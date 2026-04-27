using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

// ──────────────────────────────────────────────────────────────
// Modèle de données d'une map
// ──────────────────────────────────────────────────────────────

/// <summary>
/// Représente une case de la grille de l'éditeur.
/// Type : 0 = vide, 1 = mur, 2 = sol, 3 = spawn joueur, 4 = spawn adversaire, 5 = powerup
/// </summary>
[Serializable]
public class MapCell
{
    public int x;
    public int y;
    public int type;
}

/// <summary>Structure sérialisable envoyée à l'API sous forme de JSON encodé en base64.</summary>
[Serializable]
public class MapData
{
    public string       name;
    public string       description;
    public int          width;
    public int          height;
    public List<MapCell> cells;

    public MapData(string name, string desc, int w, int h)
    {
        this.name        = name;
        this.description = desc;
        this.width       = w;
        this.height      = h;
        this.cells       = new List<MapCell>();
    }

    /// <summary>Sérialise la map en JSON puis l'encode en base64 (content_url utilisé comme stockage).</summary>
    public string ToBase64()
    {
        string json = JsonUtility.ToJson(this);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    public static MapData FromBase64(string b64)
    {
        string json = Encoding.UTF8.GetString(Convert.FromBase64String(b64));
        return JsonUtility.FromJson<MapData>(json);
    }
}
