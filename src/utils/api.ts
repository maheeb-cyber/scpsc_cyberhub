/**
 * Safe API client utilities to guarantee that JSON responses are parsed robustly
 * and non-JSON HTML error responses (like 404/500/gateway fallbacks) never crash the app.
 */

export async function safeJson(res: Response, defaultFallback: any = {}): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return defaultFallback;
  }
  try {
    return JSON.parse(text);
  } catch {
    if (res.ok) {
      return defaultFallback;
    }
    const cleanMsg =
      res.status === 404
        ? "API endpoint not found (404)"
        : res.status >= 500
        ? "Server encountered an internal error (500)"
        : `Request failed (status ${res.status})`;
    throw new Error(cleanMsg);
  }
}

export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit,
  defaultFallback?: T
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const data = (await safeJson(res, defaultFallback)) as T;
    if (!res.ok) {
      const errMsg = (data as any)?.error || `Request failed (${res.status})`;
      return { ok: false, status: res.status, data, error: errMsg };
    }
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: (defaultFallback ?? ({} as T)) as T,
      error: err.message || "Connection error"
    };
  }
}
