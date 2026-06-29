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
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("위시리스트 기능을 사용하려면 STEAM_API_KEY 환경변수가 필요합니다.");

  const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${apiKey}&steamid=${steamId}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    if (res.status === 500) {
      throw new Error(
        "위시리스트가 비공개이거나 존재하지 않습니다.\n" +
        "Steam › 개인정보 설정 › 위시리스트를 '공개'로 변경하세요."
      );
    }
    throw new Error(`위시리스트 접근 실패 (HTTP ${res.status})`);
  }

  const data = await res.json() as { response?: { items?: Array<{ appid: number }> } };
  const items = data.response?.items;

  if (!items || items.length === 0) {
    throw new Error(
      "위시리스트가 비공개이거나 비어 있습니다.\n" +
      "Steam › 개인정보 설정 › 위시리스트를 '공개'로 변경하세요."
    );
  }

  return items.map(({ appid }) => ({
    appId: appid,
    title: String(appid),
    capsule: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
  }));
}
