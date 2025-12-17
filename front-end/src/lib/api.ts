export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
