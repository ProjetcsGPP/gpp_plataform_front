import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Garante barra final em toda URL (Django exige APPEND_SLASH)
api.interceptors.request.use((config) => {
  if (config.url && !config.url.endsWith("/") && !config.url.includes("?")) {
    config.url = config.url + "/";
  }
  if (["post", "put", "patch", "delete"].includes(config.method ?? "")) {
    const csrf = document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")[1];
    if (csrf) config.headers["X-CSRFToken"] = csrf;
  }
  return config;
});

// Redireciona para login apenas se NÃO for o endpoint de logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogout = error.config?.url?.includes("/accounts/logout");
    if (
      !isLogout &&
      error.response?.status === 401 &&
      error.response?.data?.code === "session_revoked"
    ) {
      window.location.href = "/portal/login?reason=session_revoked";
    }
    return Promise.reject(error);
  }
);

export default api;
