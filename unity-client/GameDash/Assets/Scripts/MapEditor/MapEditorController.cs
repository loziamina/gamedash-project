using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Éditeur de maps en grille 2D.
///
/// Fonctionnement :
/// ─ Une grille NxM de boutons représente le niveau.
/// ─ Le joueur sélectionne un "pinceau" (mur, sol, spawn, powerup) et clique sur les cases.
/// ─ Bouton "Publier" → sérialise la grille en JSON base64 → POST /maps/ via ApiManager.
/// ─ Bouton "Nouvelle version" → POST /maps/version si la map a déjà été publiée.
///
/// Setup dans Unity :
/// ─ Crée un Panel "Grid" et assigne-le à gridContainer.
/// ─ Crée un prefab Button avec Image enfant et assigne-le à cellButtonPrefab.
/// ─ Remplis les champs UI.
/// </summary>
public class MapEditorController : MonoBehaviour
{
    // ── Grille ──────────────────────────────────────────────────
    [Header("Grille")]
    public Transform  gridContainer;   // LayoutGroup Grid
    public GameObject cellButtonPrefab;
    public int        gridWidth  = 16;
    public int        gridHeight = 12;

    // ── Palette de couleurs par type ────────────────────────────
    private static readonly Color[] TileColors = new Color[]
    {
        new Color(0.15f, 0.15f, 0.15f),  // 0 vide       – gris foncé
        new Color(0.30f, 0.20f, 0.10f),  // 1 mur        – marron
        new Color(0.20f, 0.60f, 0.20f),  // 2 sol        – vert
        new Color(0.10f, 0.50f, 0.90f),  // 3 spawn P1   – bleu
        new Color(0.90f, 0.20f, 0.20f),  // 4 spawn P2   – rouge
        new Color(1.00f, 0.85f, 0.00f),  // 5 powerup    – jaune
    };

    private static readonly string[] TileNames = { "Vide", "Mur", "Sol", "Spawn J1", "Spawn J2", "Powerup" };

    // ── UI ──────────────────────────────────────────────────────
    [Header("UI – Meta map")]
    public TMP_InputField mapNameInput;
    public TMP_InputField mapDescInput;
    public TMP_InputField versionNotesInput;

    [Header("UI – Palette")]
    public Transform  paletteContainer;  // Horizontal Layout avec les boutons de palette
    public GameObject paletteButtonPrefab;

    [Header("UI – Actions")]
    public Button   publishButton;
    public Button   newVersionButton;
    public Button   clearButton;
    public Button   backButton;
    public TMP_Text statusText;
    public TMP_Text selectedTileLabel;

    [Header("UI – Infos map publiée")]
    public TMP_Text mapIdText;

    // ── État interne ─────────────────────────────────────────────
    private int[,]         _grid;
    private Button[,]      _cellButtons;
    private int            _selectedTile = 1;   // pinceau actif
    private int            _publishedMapId = -1; // -1 = jamais publié

    // ──────────────────────────────────────────────────────────────
    // Init
    // ──────────────────────────────────────────────────────────────

    void Start()
    {
        _grid        = new int[gridWidth, gridHeight];
        _cellButtons = new Button[gridWidth, gridHeight];

        BuildPalette();
        BuildGrid();
        UpdatePaletteLabel();

        publishButton.onClick.AddListener(OnPublish);
        newVersionButton.onClick.AddListener(OnNewVersion);
        clearButton.onClick.AddListener(ClearGrid);
        backButton.onClick.AddListener(GameManager.Instance.GoToLobby);

        newVersionButton.interactable = false;
        statusText.text = "";
        mapIdText.text  = "";
    }

    // ──────────────────────────────────────────────────────────────
    // Construction de la palette
    // ──────────────────────────────────────────────────────────────

    private void BuildPalette()
    {
        for (int t = 0; t < TileNames.Length; t++)
        {
            int tileType = t;
            var go   = Instantiate(paletteButtonPrefab, paletteContainer);
            var btn  = go.GetComponent<Button>();
            var img  = go.GetComponent<Image>();
            var lbl  = go.GetComponentInChildren<TMP_Text>();

            img.color = TileColors[t];
            if (lbl != null) lbl.text = TileNames[t];
            btn.onClick.AddListener(() => SelectTile(tileType));
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Construction de la grille
    // ──────────────────────────────────────────────────────────────

    private void BuildGrid()
    {
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int cx = x, cy = y;
                var go  = Instantiate(cellButtonPrefab, gridContainer);
                var btn = go.GetComponent<Button>();
                var img = go.GetComponent<Image>();

                img.color = TileColors[0];
                btn.onClick.AddListener(() => PaintCell(cx, cy));

                _cellButtons[x, y] = btn;
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Peinture
    // ──────────────────────────────────────────────────────────────

    private void PaintCell(int x, int y)
    {
        _grid[x, y] = _selectedTile;
        _cellButtons[x, y].GetComponent<Image>().color = TileColors[_selectedTile];

    }

    private void SelectTile(int type)
    {
        _selectedTile = type;
        UpdatePaletteLabel();
    }

    private void UpdatePaletteLabel()
    {
        selectedTileLabel.text = $"Pinceau : {TileNames[_selectedTile]}";
    }

    private void ClearGrid()
    {
        for (int y = 0; y < gridHeight; y++)
            for (int x = 0; x < gridWidth; x++)
            {
                _grid[x, y] = 0;
                _cellButtons[x, y].GetComponent<Image>().color = TileColors[0];
            }

    }

    // ──────────────────────────────────────────────────────────────
    // Sérialisation
    // ──────────────────────────────────────────────────────────────

    private MapData BuildMapData()
    {
        string name = mapNameInput.text.Trim();
        string desc = mapDescInput.text.Trim();
        if (string.IsNullOrEmpty(name)) name = "Ma map sans titre";

        var data = new MapData(name, desc, gridWidth, gridHeight);

        for (int y = 0; y < gridHeight; y++)
            for (int x = 0; x < gridWidth; x++)
                if (_grid[x, y] != 0)    // on ne stocke pas les cases vides
                    data.cells.Add(new MapCell { x = x, y = y, type = _grid[x, y] });

        return data;
    }

    // ──────────────────────────────────────────────────────────────
    // Publication → POST /maps/
    // ──────────────────────────────────────────────────────────────

    private void OnPublish()
    {
        if (!ValidateForm()) return;

        MapData data = BuildMapData();

        var payload = new CreateMapRequest
        {
            title       = data.name,
            description = data.description,
            status      = "beta",
            content_url = data.ToBase64(),
            tags        = new string[] { "unity", "editor" },
            screenshot_urls = new string[0]
        };

        SetBusy(true, "Publication en cours...");
        StartCoroutine(ApiManager.Instance.CreateMap(payload,
            (resp) =>
            {
                _publishedMapId = resp.map_id;

                SetBusy(false, $"✅ Map publiée ! ID #{_publishedMapId}");
                mapIdText.text = $"Map ID : {_publishedMapId}";
                newVersionButton.interactable = true;
            },
            (err) =>
            {
                SetBusy(false, "❌ Erreur de publication.");
                Debug.LogError("CreateMap: " + err);
            }
        ));
    }

    // ──────────────────────────────────────────────────────────────
    // Nouvelle version → POST /maps/version
    // ──────────────────────────────────────────────────────────────

    private void OnNewVersion()
    {
        if (_publishedMapId < 0) { statusText.text = "Publie d'abord une map."; return; }

        string notes = versionNotesInput.text.Trim();
        if (string.IsNullOrEmpty(notes)) notes = "Mise à jour";

        MapData data = BuildMapData();

        var payload = new AddVersionRequest
        {
            map_id      = _publishedMapId,
            notes       = notes,
            content_url = data.ToBase64(),
            screenshot_urls = new string[0]
        };

        SetBusy(true, "Envoi de la version...");
        StartCoroutine(ApiManager.Instance.AddMapVersion(payload,
            (resp) =>
            {

                SetBusy(false, $"✅ {resp.version} publiée !");
            },
            (err) =>
            {
                SetBusy(false, "❌ Erreur lors de la mise à jour.");
                Debug.LogError("AddMapVersion: " + err);
            }
        ));
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private bool ValidateForm()
    {
        if (string.IsNullOrWhiteSpace(mapNameInput.text))
        {
            statusText.text = "Donne un nom à ta map.";
            return false;
        }
        return true;
    }

    private void SetBusy(bool busy, string msg)
    {
        statusText.text = msg;
        publishButton.interactable    = !busy;
        newVersionButton.interactable = !busy && _publishedMapId >= 0;
        clearButton.interactable      = !busy;
    }
}
