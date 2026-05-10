export const BACKEND_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:3001`
    : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// ✅ single place for versioning
export const BACKEND_API_PREFIX =
  process.env.NEXT_PUBLIC_BACKEND_API_PREFIX || "/api/v1";

const isBrowser = () => typeof window !== "undefined";
const getAccessToken = () =>
  isBrowser() ? localStorage.getItem("accessToken") : null;

function joinUrl(base: string, prefix: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = prefix ? `/${prefix.replace(/^\/+|\/+$/g, "")}` : "";
  const r = `/${path.replace(/^\/+/, "")}`;
  return `${b}${p}${r}`;
}

async function readError(res: Response) {
  const txt = await res.text();
  try {
    const j = JSON.parse(txt);
    if (typeof j === "string") return j;
    if (j && typeof j === "object") {
      const msg =
        (j as any).message ?? (j as any).error ?? (j as any).detail ?? null;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    return txt || JSON.stringify(j);
  } catch {
    return txt;
  }
}

export async function fetchJSON<T>(path: string): Promise<T> {
  const url = joinUrl(BACKEND_URL, BACKEND_API_PREFIX, path);
  const token = getAccessToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body?: any): Promise<T> {
  const url = joinUrl(BACKEND_URL, BACKEND_API_PREFIX, path);
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}
