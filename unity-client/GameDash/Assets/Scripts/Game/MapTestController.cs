using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// MapTestController — contrôleur de la scène "MapTest".
///
/// Cette scène est chargée quand un joueur clique "Tester" sur le site web.
/// Elle :
///   1. Lit les données statiques PendingMap / PendingMapId / PendingMapTitle
///   2. Reconstruit la grille dans la scène 2D à partir du JSON de la map
///   3. Lance une session de jeu de 3 minutes sur cette map
///   4. À la fin, envoie POST /maps/test avec les stats réelles (durée, complétion)
///   5. Affiche un écran de résumé puis retourne au Lobby (ou ferme Unity)
///
/// ─── Setup dans Unity ──────────────────────────────────────────────────────
/// Scène "MapTest" :
///   - Empty GameObject → attacher MapTestController
///   - Canvas avec :
///       TMP_Text  mapTitleText
///       TMP_Text  timerText
///       TMP_Text  statusText
///       Button    exitButton  ("Quitter le test")
///       Panel     summaryPanel (désactivé par défaut)
///         TMP_Text summaryText
///         Button   closeSummaryButton
///   - Prefabs assignés :
///       wallPrefab     → Sprite carré marron, Layer "Default"
///       floorPrefab    → Sprite carré vert, Layer "Default"
///       spawnP1Prefab  → Sprite cercle bleu
///       spawnP2Prefab  → Sprite cercle rouge
///       powerupPrefab  → Sprite étoile jaune
/// ─────────────────────────────────────────────────────────────────────────
/// </summary>
public class MapTestController : MonoBehaviour
{
    // ── Données partagées entre scènes (static) ──────────────────
    public static MapData   PendingMap;
    public static int       PendingMapId   = -1;
    public static string    PendingMapTitle = "Map sans titre";

    // ── Prefabs de tuiles ────────────────────────────────────────
    [Header("Prefabs de tuiles")]
    public GameObject wallPrefab;
    public GameObject floorPrefab;
    public GameObject spawnP1Prefab;
    public GameObject spawnP2Prefab;
    public GameObject powerupPrefab;

    [Header("Taille d'une tuile (unités Unity)")]
    public float tileSize = 1f;

    // ── UI ───────────────────────────────────────────────────────
    [Header("UI")]
    public TMP_Text   mapTitleText;
    public TMP_Text   timerText;
    public TMP_Text   statusText;
    public Button     exitButton;
    public GameObject summaryPanel;
    public TMP_Text   summaryText;
    public Button     closeSummaryButton;

    // ── Durée du test (secondes) ─────────────────────────────────
    [Header("Durée du test")]
    public float testDuration = 180f;   // 3 minutes

    // ── État interne ─────────────────────────────────────────────
    private float  _elapsed     = 0f;
    private bool   _testEnded   = false;

    private GameObject _mapRoot;                // parent de tous les tiles

    // ──────────────────────────────────────────────────────────────
    // Init
    // ──────────────────────────────────────────────────────────────

    void Start()
    {
        // Affiche le titre
        mapTitleText.text = PendingMapTitle;
        statusText.text   = "Test en cours...";

        summaryPanel.SetActive(false);
        exitButton.onClick.AddListener(OnExitEarly);
        closeSummaryButton.onClick.AddListener(OnCloseSummary);

        if (PendingMap != null && PendingMap.cells != null && PendingMap.cells.Count > 0)
        {
            BuildMap(PendingMap);
            statusText.text = $"Map chargée ({PendingMap.cells.Count} tuiles)";
        }
        else
        {
            // Aucune map reçue : affiche un niveau de démonstration vide
            statusText.text = "Aucune map reçue — mode démo";
            BuildDemoMap();
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Update — timer
    // ──────────────────────────────────────────────────────────────

    void Update()
    {
        if (_testEnded) return;

        _elapsed += Time.deltaTime;
        float remaining = Mathf.Max(0, testDuration - _elapsed);
        int m = (int)(remaining / 60);
        int s = (int)(remaining % 60);
        timerText.text = $"{m:00}:{s:00}";

        if (_elapsed >= testDuration)
            EndTest(completed: false);
    }

    // ──────────────────────────────────────────────────────────────
    // Construction de la map depuis MapData
    // ──────────────────────────────────────────────────────────────

    private void BuildMap(MapData data)
    {
        // Crée un parent pour pouvoir tout nettoyer facilement
        _mapRoot = new GameObject("MapRoot");

        // Centre la caméra sur la map
        float centerX = (data.width  * tileSize) / 2f;
        float centerY = (data.height * tileSize) / 2f;
        Camera.main.transform.position = new Vector3(centerX, centerY, -10f);

        // Instancie chaque tuile
        foreach (var cell in data.cells)
        {
            GameObject prefab = GetPrefabForType(cell.type);
            if (prefab == null) continue;

            Vector3 pos = new Vector3(cell.x * tileSize, cell.y * tileSize, 0f);
            var tile = Instantiate(prefab, pos, Quaternion.identity, _mapRoot.transform);
            tile.name = $"tile_{cell.x}_{cell.y}_t{cell.type}";

            // Tag les spawns pour que le joueur puisse s'y placer
            if (cell.type == 3) tile.tag = "SpawnP1";
            if (cell.type == 4) tile.tag = "SpawnP2";
        }
    }

    private GameObject GetPrefabForType(int type)
    {
        return type switch
        {
            1 => wallPrefab,
            2 => floorPrefab,
            3 => spawnP1Prefab,
            4 => spawnP2Prefab,
            5 => powerupPrefab,
            _ => null
        };
    }

    // ──────────────────────────────────────────────────────────────
    // Map de démo (si aucune map reçue)
    // ──────────────────────────────────────────────────────────────

    private void BuildDemoMap()
    {
        var demoData = new MapData("Démo", "", 16, 12);
        // Bordures
        for (int x = 0; x < 16; x++) { demoData.cells.Add(new MapCell{x=x,y=0,type=1}); demoData.cells.Add(new MapCell{x=x,y=11,type=1}); }
        for (int y = 1; y < 11; y++) { demoData.cells.Add(new MapCell{x=0,y=y,type=1}); demoData.cells.Add(new MapCell{x=15,y=y,type=1}); }
        // Sol intérieur
        for (int y = 1; y < 11; y++)
            for (int x = 1; x < 15; x++)
                demoData.cells.Add(new MapCell{x=x,y=y,type=2});
        // Spawns
        demoData.cells.Add(new MapCell{x=2, y=2, type=3});
        demoData.cells.Add(new MapCell{x=13,y=9, type=4});
        BuildMap(demoData);
    }

    // ──────────────────────────────────────────────────────────────
    // Fin de test
    // ──────────────────────────────────────────────────────────────

    /// <summary>Appelé par la logique de jeu quand le joueur atteint la sortie.</summary>
    public void OnPlayerCompletedMap()
    {

        EndTest(completed: true);
    }

    private void OnExitEarly()
    {
        EndTest(completed: false);
    }

    private void EndTest(bool completed)
    {
        if (_testEnded) return;
        _testEnded = true;

        int   durationSeconds  = Mathf.RoundToInt(_elapsed);
        float completionRate   = completed ? 1.0f : Mathf.Clamp01(_elapsed / testDuration);

        statusText.text = completed ? "Map terminée !" : "Test terminé.";

        // Envoyer les stats à l'API
        if (PendingMapId >= 0)
            StartCoroutine(SubmitTest(PendingMapId, durationSeconds, completionRate, completed));
        else
            ShowSummary(durationSeconds, completionRate, completed, null);
    }

    private IEnumerator SubmitTest(int mapId, int duration, float completion, bool completed)
    {
        string resultMsg = null;
        yield return ApiManager.Instance.MarkMapTest(mapId, duration, completion,
            () => resultMsg = "Test enregistré sur le dashboard !",
            (err) => { resultMsg = "Test terminé (hors ligne)."; Debug.LogWarning(err); }
        );
        ShowSummary(duration, completion, completed, resultMsg);
    }

    // ──────────────────────────────────────────────────────────────
    // Écran de résumé
    // ──────────────────────────────────────────────────────────────

    private void ShowSummary(int duration, float completion, bool completed, string apiMsg)
    {
        summaryPanel.SetActive(true);

        int m = duration / 60;
        int s = duration % 60;
        string completionPct = $"{Mathf.RoundToInt(completion * 100)}%";

        summaryText.text =
            $"Map : {PendingMapTitle}\n\n" +
            $"Durée : {m:00}:{s:00}\n" +
            $"Complétion : {completionPct}\n" +
            $"Résultat : {(completed ? "✅ Terminée" : "⏱ Temps écoulé")}\n\n" +
            (apiMsg ?? "");
    }

    private void OnCloseSummary()
    {
        // Nettoyer les données statiques
        PendingMap      = null;
        PendingMapId    = -1;
        PendingMapTitle = "Map sans titre";

        // Si on vient du deeplink, le GameManager n'a pas de lobby → fermer
        // Sinon, retourner au lobby
        if (GameManager.Instance.LocalPlayer != null)
            GameManager.Instance.GoToLobby();
        else
            Application.Quit();
    }
}
