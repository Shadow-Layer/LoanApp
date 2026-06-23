import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = String(error.config?.url || '');
    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const requestConfig = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && requestConfig && !requestConfig._retry) {
      requestConfig._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${apiBase}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        requestConfig.headers = {
          ...(requestConfig.headers as Record<string, string>),
          Authorization: `Bearer ${data.accessToken}`
        } as typeof requestConfig.headers;
        return api(requestConfig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export function isDemoMode(): boolean {
  return localStorage.getItem('accessToken') === 'demo-access-token';
}

export default api;
