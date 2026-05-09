export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const requestOptions = { ...options };

  const headers = {
    ...requestOptions.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // FastAPI OAuth2 espera FormData en el login; no forzamos Content-Type ahi.
  if (!(requestOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (requestOptions.body && typeof requestOptions.body === "object") {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers,
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!response.ok) {
    const detail = typeof data === "object" && data !== null ? data.detail : data;
    throw new Error(detail || `Error en la peticion: ${response.status}`);
  }

  return data;
}
