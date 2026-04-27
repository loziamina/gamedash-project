using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Interface de connexion.
/// Attache ce script au Canvas de la scène Login.
/// </summary>
public class LoginUI : MonoBehaviour
{
    [Header("Champs de formulaire")]
    public TMP_InputField emailInput;
    public TMP_InputField passwordInput;

    [Header("Boutons")]
    public Button loginButton;

    [Header("Feedback")]
    public TMP_Text statusText;
    public GameObject loadingSpinner;

    void Start()
    {
        loginButton.onClick.AddListener(OnLoginClicked);
        loadingSpinner.SetActive(false);

        // Si un token est déjà stocké, on tente un auto-login
        if (ApiManager.Instance.IsAuthenticated)
            StartCoroutine(TryAutoLogin());
    }

    private void OnLoginClicked()
    {
        string email    = emailInput.text.Trim();
        string password = passwordInput.text;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            ShowStatus("Remplis tous les champs.", Color.yellow);
            return;
        }

        StartCoroutine(DoLogin(email, password));
    }

    private IEnumerator DoLogin(string email, string password)
    {
        SetLoading(true);
        ShowStatus("Connexion...", Color.white);

        yield return ApiManager.Instance.Login(email, password,
            (resp) =>
            {
                ShowStatus("Connecté !", Color.green);
                // Charger le profil puis démarrer
                StartCoroutine(LoadProfileAndProceed());
            },
            (err) =>
            {
                SetLoading(false);
                ShowStatus("Identifiants incorrects.", Color.red);
                Debug.LogError("Login error: " + err);
            }
        );
    }

    private IEnumerator TryAutoLogin()
    {
        SetLoading(true);
        ShowStatus("Reconnexion...", Color.white);
        yield return LoadProfileAndProceed();
    }

    private IEnumerator LoadProfileAndProceed()
    {
        yield return ApiManager.Instance.GetMe(
            (profile) =>
            {
                SetLoading(false);
                GameManager.Instance.OnLoginSuccess(profile);
            },
            (err) =>
            {
                SetLoading(false);
                ApiManager.Instance.Logout();
                ShowStatus("Session expirée. Reconnecte-toi.", Color.red);
            }
        );
    }

    private void SetLoading(bool active)
    {
        loadingSpinner.SetActive(active);
        loginButton.interactable = !active;
    }

    private void ShowStatus(string msg, Color color)
    {
        statusText.text  = msg;
        statusText.color = color;
    }
}
