using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Écran de file d'attente. Tourne en attendant que GameManager trouve un match.
/// Affiche le temps d'attente et le mode en cours.
/// </summary>
public class QueueUI : MonoBehaviour
{
    [Header("UI")]
    public TMP_Text modeText;
    public TMP_Text waitTimeText;
    public TMP_Text dotsText;
    public Button   cancelButton;

    private float   _elapsed = 0f;
    private bool    _running = true;

    void Start()
    {
        modeText.text = $"Mode : {GameManager.Instance.CurrentMode?.ToUpper() ?? "—"}";
        cancelButton.onClick.AddListener(() =>
        {
            _running = false;
            GameManager.Instance.CancelMatchmaking();
        });

        StartCoroutine(AnimateDots());
    }

    void Update()
    {
        if (!_running) return;
        _elapsed += Time.deltaTime;
        int minutes = (int)(_elapsed / 60);
        int seconds = (int)(_elapsed % 60);
        waitTimeText.text = $"En attente : {minutes:00}:{seconds:00}";
    }

    private IEnumerator AnimateDots()
    {
        string[] frames = { ".", "..", "..." };
        int i = 0;
        while (_running)
        {
            dotsText.text = "Recherche" + frames[i % 3];
            i++;
            yield return new WaitForSeconds(0.5f);
        }
    }
}
