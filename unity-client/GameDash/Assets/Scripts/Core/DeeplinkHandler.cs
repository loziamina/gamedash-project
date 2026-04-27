using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// DeeplinkHandler — à attacher sur le GameObject "GameDash" (même que ApiManager/GameManager).
///
/// Rôle :
///   1. Au démarrage, lit les arguments de ligne de commande pour détecter
///      un deeplink gamedash://testmap?map_id=42&token=xxx
///   2. Si un deeplink est détecté :
///      - Stocke le token JWT dans ApiManager
///      - Récupère le profil joueur (/auth/me)
///      - Télécharge les données de la map (/maps/{id})
///      - Charge la scène MapTest avec la map
///   3. Sinon, lance le flux normal (scène Login)
/// </summary>
public class DeeplinkHandler : MonoBehaviour
{
    [Header("Scène de test de map")]
    public string mapTestScene = "MapTest";

    void Start()
    {
        ParseCommandLineArgs();
    }

    // ──────────────────────────────────────────────────────────────
    // Lecture des arguments de lancement
    // ──────────────────────────────────────────────────────────────

    private void ParseCommandLineArgs()
    {
        string[] args = Environment.GetCommandLineArgs();

        foreach (string arg in args)
        {
            // Cherche un argument du type : gamedash://testmap?map_id=42&token=eyJhbG...
            if (arg.StartsWith("gamedash://testmap", StringComparison.OrdinalIgnoreCase))
            {
                Debug.Log("[Deeplink] Détecté : " + arg);
                HandleTestMapDeeplink(arg);
                return;
            }
        }

        // Aucun deeplink → flux normal
        Debug.Log("[Deeplink] Aucun deeplink, démarrage normal.");
    }

    private void HandleTestMapDeeplink(string url)
    {
        // Parse les query params depuis gamedash://testmap?map_id=42&token=xxx
        var query = ParseQuery(url);

        if (!query.TryGetValue("map_id", out string mapIdStr) ||
            !int.TryParse(mapIdStr, out int mapId))
        {
            Debug.LogError("[Deeplink] map_id manquant ou invalide dans : " + url);
            SceneManager.LoadScene("Login");
            return;
        }

        if (!query.TryGetValue("token", out string token) || string.IsNullOrEmpty(token))
        {
            Debug.LogError("[Deeplink] token manquant dans : " + url);
            SceneManager.LoadScene("Login");
            return;
        }

        Debug.Log($"[Deeplink] map_id={mapId}, token présent.");

        // Injecter le token dans ApiManager et PlayerPrefs
        ApiManager.Instance.InjectToken(token);

        // Charger le profil puis la map
        StartCoroutine(LoadProfileAndMap(mapId));
    }

    // ──────────────────────────────────────────────────────────────
    // Chargement du profil + map
    // ──────────────────────────────────────────────────────────────

    private IEnumerator LoadProfileAndMap(int mapId)
    {
        // 1. Récupérer le profil joueur
        bool profileOk = false;
        yield return ApiManager.Instance.GetMe(
            (profile) =>
            {
                GameManager.Instance.SetLocalPlayer(profile);
                profileOk = true;
                Debug.Log($"[Deeplink] Profil chargé : {profile.pseudo}");
            },
            (err) => Debug.LogError("[Deeplink] Impossible de charger le profil : " + err)
        );

        if (!profileOk)
        {
            Debug.LogError("[Deeplink] Profil introuvable, retour au login.");
            SceneManager.LoadScene("Login");
            yield break;
        }

        // 2. Télécharger les données de la map
        yield return ApiManager.Instance.GetMap(mapId,
            (mapResponse) =>
            {
                Debug.Log($"[Deeplink] Map reçue : {mapResponse.title} (content_url={mapResponse.content_url?.Length} chars)");

                // 3. Décoder le JSON base64 de la map
                MapData mapData = null;
                try
                {
                    if (!string.IsNullOrEmpty(mapResponse.content_url))
                        mapData = MapData.FromBase64(mapResponse.content_url);
                }
                catch (Exception e)
                {
                    Debug.LogWarning("[Deeplink] Impossible de décoder content_url : " + e.Message);
                }

                // 4. Passer les données au MapTestController et charger la scène
                MapTestController.PendingMap    = mapData;
                MapTestController.PendingMapId  = mapId;
                MapTestController.PendingMapTitle = mapResponse.title;

                SceneManager.LoadScene("MapTest");
            },
            (err) =>
            {
                Debug.LogError("[Deeplink] Impossible de charger la map : " + err);
                SceneManager.LoadScene("Login");
            }
        );
    }

    // ──────────────────────────────────────────────────────────────
    // Utilitaire : parse les query params d'une URI
    // ──────────────────────────────────────────────────────────────

    private static System.Collections.Generic.Dictionary<string, string> ParseQuery(string url)
    {
        var result = new System.Collections.Generic.Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        int qIdx = url.IndexOf('?');
        if (qIdx < 0) return result;

        string queryString = url.Substring(qIdx + 1);
        foreach (string pair in queryString.Split('&'))
        {
            int eqIdx = pair.IndexOf('=');
            if (eqIdx < 0) continue;
            string key = Uri.UnescapeDataString(pair.Substring(0, eqIdx));
            string val = Uri.UnescapeDataString(pair.Substring(eqIdx + 1));
            result[key] = val;
        }
        return result;
    }
}
