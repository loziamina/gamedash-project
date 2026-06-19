using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public enum GameState { Login, MainMenu, InQueue, InGame, Results, MapEditor }
    public GameState CurrentState { get; private set; } = GameState.MainMenu;

    public int    CurrentMatchId    { get; private set; }
    public int    CurrentOpponentId { get; private set; }
    public string CurrentMode       { get; private set; }
    public int    CurrentMapId      { get; private set; }
    public bool   PlayerWon         { get; set; }
    public UserProfile         LocalPlayer     { get; private set; }
    public FinishMatchResponse LastMatchResult { get; private set; }

    [Header("Scènes")]
    public string loginScene     = "Login";
    public string mainMenuScene  = "Lobby";
    public string gameScene      = "Game";
    public string resultsScene   = "Results";
    public string mapEditorScene = "MapEditor";
    public string queueScene     = "Queue";

    [Header("Polling matchmaking (secondes)")]
    public float pollInterval = 2f;

    private Coroutine _pollingCoroutine;
    private bool      _matchFound = false;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    // ── AUTH ──────────────────────────────────────────────────────

    public void OnLoginSuccess(UserProfile profile)
    {
        LocalPlayer = profile;
        TransitionTo(GameState.MainMenu);
        SceneManager.LoadScene(mainMenuScene);
    }

    public void SetLocalPlayer(UserProfile profile)
    {
        LocalPlayer = profile;
        Debug.Log($"[GameManager] Joueur : {profile.pseudo} (id={profile.id})");
    }

    public void GoToLogin()
    {
        if (_pollingCoroutine != null) StopCoroutine(_pollingCoroutine);
        GameWebSocketClient.Instance?.DisconnectLobbyWS();
        GameWebSocketClient.Instance?.DisconnectGameWS();
        LocalPlayer = null;
        TransitionTo(GameState.Login);
        SceneManager.LoadScene(loginScene);
    }

    public void GoToLobby()
    {
        TransitionTo(GameState.MainMenu);
        SceneManager.LoadScene(mainMenuScene);
    }

    public void GoToMapEditor()
    {
        TransitionTo(GameState.MapEditor);
        SceneManager.LoadScene(mapEditorScene);
    }

    // ── MATCHMAKING ───────────────────────────────────────────────

    public void StartMatchmaking(string mode)
    {
        CurrentMode       = mode;
        CurrentMatchId    = 0;
        CurrentOpponentId = 0;
        CurrentMapId      = 0;

        MapTestController.PendingMap      = null;
        MapTestController.PendingMapId    = -1;
        MapTestController.PendingMapTitle = "Map sans titre";

        _matchFound  = false;
        TransitionTo(GameState.InQueue);
        StartCoroutine(JoinAndPoll(mode));
        if (!string.IsNullOrEmpty(queueScene))
            SceneManager.LoadScene(queueScene);
    }

    public void CancelMatchmaking()
    {
        if (_pollingCoroutine != null) StopCoroutine(_pollingCoroutine);
        _matchFound = false;
        StartCoroutine(ApiManager.Instance.LeaveQueue(
            () => { TransitionTo(GameState.MainMenu); SceneManager.LoadScene(mainMenuScene); },
            (err) => Debug.LogWarning("LeaveQueue error: " + err)
        ));
    }

    private IEnumerator JoinAndPoll(string mode)
    {
        bool joined = false;

        yield return ApiManager.Instance.JoinQueue(mode,
            (resp) =>
            {
                Debug.Log($"[JoinQueue] message={resp.message} match_id={resp.match_id}");
                joined = true;
            },
            (err) => Debug.LogError("JoinQueue: " + err)
        );

        if (!joined) { TransitionTo(GameState.MainMenu); yield break; }

        yield return TryResolveMatch(mode);
        if (_matchFound) yield break;

        _pollingCoroutine = StartCoroutine(PollForMatch(mode));
    }

    private IEnumerator PollForMatch(string mode)
    {
        while (CurrentState == GameState.InQueue && !_matchFound)
        {
            yield return new WaitForSeconds(pollInterval);
            if (_matchFound) yield break;

            yield return TryResolveMatch(mode);
            if (_matchFound) yield break;

            yield return ApiManager.Instance.JoinQueue(mode,
                (resp) => { },
                (err) => Debug.LogWarning("PollForMatch/join: " + err));
        }
    }

    private IEnumerator TryResolveMatch(string mode)
    {
        yield return ApiManager.Instance.GetCurrentMatch(mode,
            (resp) =>
            {
                if (_matchFound) return;
                if (resp.match != null && resp.match.match_id > 0)
                {
                    _matchFound       = true;
                    CurrentMatchId    = resp.match.match_id;
                    CurrentOpponentId = resp.match.opponent;
                    CurrentMode       = resp.match.mode;
                    CurrentMapId      = resp.match.map_id;
                    Debug.Log($"[GameManager] Match trouvé : {CurrentMatchId} vs {CurrentOpponentId}");
                    StartGame();
                }
            },
            (err) => Debug.LogWarning("GetCurrentMatch: " + err));
    }

    public void StartMatchFromDeeplink(int matchId, int opponentId, string mode, int mapId)
    {
        CurrentMatchId    = matchId;
        CurrentOpponentId = opponentId;
        CurrentMode       = string.IsNullOrEmpty(mode) ? "ranked" : mode;
        CurrentMapId      = mapId;
        StartGame();
    }

    private void StartGame()
    {
        if (_pollingCoroutine != null)
        {
            StopCoroutine(_pollingCoroutine);
            _pollingCoroutine = null;
        }

        if (CurrentMapId > 0)
        {
            StartCoroutine(ApiManager.Instance.GetMap(CurrentMapId, (mapResp) =>
            {
                try
                {
                    MapTestController.PendingMap      = MapData.FromBase64(mapResp.content_url);
                    MapTestController.PendingMapId    = mapResp.id;
                    MapTestController.PendingMapTitle = mapResp.title ?? "Map";
                }
                catch (System.Exception ex)
                {
                    Debug.LogWarning("Failed to parse map: " + ex.Message);
                    MapTestController.PendingMap   = null;
                    MapTestController.PendingMapId = -1;
                }
                TransitionTo(GameState.InGame);
                SceneManager.LoadScene(gameScene);
            }, (err) =>
            {
                Debug.LogWarning("GetMap failed: " + err);
                MapTestController.PendingMap = null;
                TransitionTo(GameState.InGame);
                SceneManager.LoadScene(gameScene);
            }));
            return;
        }

        TransitionTo(GameState.InGame);
        SceneManager.LoadScene(gameScene);
    }

    // ── FIN DE MATCH ──────────────────────────────────────────────

    public void ReportMatchEnd(int winnerId)
    {
        PlayerWon = (winnerId == LocalPlayer.id);
        StartCoroutine(SubmitMatchResult(winnerId));
    }

    private IEnumerator SubmitMatchResult(int winnerId)
    {
        bool resultOk = false;
        yield return ApiManager.Instance.PostMatchResult(CurrentMatchId, winnerId,
            () => resultOk = true,
            (err) => Debug.LogError("PostMatchResult: " + err)
        );
        if (!resultOk) yield break;

        yield return ApiManager.Instance.FinishMatch(CurrentMatchId, winnerId,
            (resp) =>
            {
                LastMatchResult = resp;
                StartCoroutine(ApiManager.Instance.GetMe((profile) =>
                {
                    SetLocalPlayer(profile);
                    LastMatchResult = resp;
                    TransitionTo(GameState.Results);
                    SceneManager.LoadScene(resultsScene);
                }, (err) =>
                {
                    Debug.LogWarning("Refresh profile failed: " + err);
                    TransitionTo(GameState.Results);
                    SceneManager.LoadScene(resultsScene);
                }));
            },
            (err) => Debug.LogError("FinishMatch: " + err)
        );
    }

    // ── Utilitaires ───────────────────────────────────────────────

    private void TransitionTo(GameState next)
    {
        Debug.Log($"[GameManager] {CurrentState} -> {next}");
        CurrentState = next;
    }

    public void SetPlayerWon(bool won)       { PlayerWon = won; }
    public void SetLastMatchResult(FinishMatchResponse r) { LastMatchResult = r; }

    public void GoToResultsDirectly()
    {
        TransitionTo(GameState.Results);
        SceneManager.LoadScene(resultsScene);
    }
}