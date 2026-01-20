import axios, { AxiosInstance } from "axios";

// Base URL do backend Django
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Cria instância Axios com configuração padrão
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Para enviar cookies (sessions)
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para renovar token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se token expirou (401) e não é requisição de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/v1/auth/token/refresh/"
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Tenta renovar o token
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/token/refresh/`,
          { refresh: refreshToken },
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        // Refaz a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se refresh falhar, limpa storage e redireciona para login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ============================================================================
// TIPOS
// ============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Application {
  id: number;
  codigo: string;
  nome: string;
  url: string;
  showInPortal: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ApplicationAccessResponse {
  application: Application;
  hasAccess: boolean;
}

// ============================================================================
// SERVIÇOS DE AUTENTICAÇÃO
// ============================================================================

export const authService = {
  /**
   * Login com JWT
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/api/v1/auth/token/", {
      email: email, // Backend espera 'username' mas aceita email
      password,
    });
    return response.data;
  },

  /**
   * Logout (limpa tokens locais)
   */
  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  },

  /**
   * Obtém usuário do localStorage
   */
  getUser(): User | null {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Salva dados de login no localStorage
   */
  saveAuth(data: LoginResponse, user: User) {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    localStorage.setItem("user", JSON.stringify(user));
  },
};

// ============================================================================
// SERVIÇOS DO PORTAL
// ============================================================================

export const portalService = {
  /**
   * Lista aplicações que o usuário tem acesso
   */
  async getApplications(): Promise<Application[]> {
    const response = await api.get<Application[]>(
      "/api/v1/portal/applications/",
    );
    return response.data;
  },

  /**
   * Busca detalhes de uma aplicação
   */
  async getApplication(codigo: string): Promise<Application> {
    const response = await api.get<Application>(
      `/api/v1/portal/applications/${codigo}/`,
    );
    return response.data;
  },

  /**
   * Verifica se usuário tem acesso a uma aplicação
   */
  async checkAccess(codigo: string): Promise<ApplicationAccessResponse> {
    const response = await api.get<ApplicationAccessResponse>(
      `/api/v1/portal/applications/${codigo}/access/`,
    );
    return response.data;
  },
};
