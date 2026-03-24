const BASE_URL = "https://sms.verimor.com.tr";

export interface VerimorConfig {
  username: string;
  password: string;
  source_addr?: string;
}

export async function verimorPost(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Verimor API hatası: ${text}`);
  return text;
}

export async function verimorGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}${path}?${qs}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`Verimor API hatası: ${text}`);
  return text;
}