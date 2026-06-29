const STEAM_OPENID = "https://steamcommunity.com/openid/login";

/* ── 로그인 리다이렉트 URL 생성 ── */
export function getSteamLoginUrl(returnTo: string, realm: string): string {
  const p = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID}?${p.toString()}`;
}

/* ── OpenID 서명 검증 → Steam ID 64 반환 ── */
export async function verifySteamOpenId(
  callbackParams: URLSearchParams
): Promise<string | null> {
  const verify = new URLSearchParams(callbackParams);
  verify.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verify.toString(),
  });

  const body = await res.text();
  if (!body.includes("is_valid:true")) return null;

  const claimedId = callbackParams.get("openid.claimed_id") ?? "";
  const m = claimedId.match(/\/id\/(\d+)$/);
  return m ? m[1] : null;
}

/* ── Steam 위시리스트 ── */
export interface SteamWishGame {
  appId: number;
  title: string;
  capsule?: string;
}

export async function fetchSteamWishlist(steamId: string): Promise<SteamWishGame[]> {
  const url =
    `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "https://store.steampowered.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`위시리스트 접근 실패 (HTTP ${res.status})`);

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Steam returned HTML (likely blocked server-side request or session required)
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`위시리스트 응답이 JSON이 아닙니다 (HTML 반환됨): ${preview}`);
  }

  // 비공개 위시리스트 → { success: 2 } 형태
  const appIds = Object.keys(data).filter((k) => /^\d+$/.test(k));
  if (appIds.length === 0) {
    throw new Error(
      "위시리스트가 비공개이거나 비어 있습니다.\n" +
      "Steam › 개인정보 설정 › 위시리스트를 '공개'로 변경하세요."
    );
  }

  return appIds.map((id) => {
    const g = data[id] as { name?: string; capsule?: string };
    return { appId: Number(id), title: g.name ?? id, capsule: g.capsule };
  });
}
