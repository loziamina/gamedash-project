const API_URL = "http://127.0.0.1:8000";

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function register({ pseudo, email, password }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pseudo,
      email,
      password,
    }),
  });

  if (!response.ok) {
    let message = "Register failed";

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Ignore JSON parse errors and keep fallback message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Unable to request password reset");
  }

  return response.json();
}

export async function resetPassword(token, password) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    let message = "Unable to reset password";
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Ignore JSON parse errors and keep fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No active session");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("match");
    }
    throw new Error("Unable to fetch current user");
  }

  return response.json();
}

export async function updateProfile(userId, payload) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to update profile");
  }

  return response.json();
}

export async function deleteAccount(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to delete account");
  }

  return response.json();
}
