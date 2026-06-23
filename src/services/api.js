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

function formatErrorDetail(detail) {
  if (!detail) return "";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const location = Array.isArray(item.loc) ? item.loc.join(".") : "";
          const message = item.msg || item.message || JSON.stringify(item);
          return location ? `${location}: ${message}` : message;
        }
        return String(item);
      })
      .join(" | ");
  }

  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return String(detail);
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
    throw new Error(formatErrorDetail(detail) || `Error en la peticion: ${response.status}`);
  }

  return data;
}
