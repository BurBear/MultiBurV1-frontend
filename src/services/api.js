export const BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Si mandamos un FormData (para login), no seteamos Content-Type a json
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error en la petición: ${response.status}`);
  }

  return response.json();
}
