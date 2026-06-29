import { z } from "zod";

const BASE_URL = "https://api.isthereanydeal.com";
const STEAM_SHOP = "61";

export const PriceInfoSchema = z.object({
  amount: z.number(),
  amountInt: z.number(),
  currency: z.string(),
});

export const DealSchema = z.object({
  shop: z.object({ id: z.number(), name: z.string() }),
  price: PriceInfoSchema,
  regular: PriceInfoSchema,
  cut: z.number(),
  storeLow: PriceInfoSchema.nullable(),
  flag: z.string().nullable(),   // more permissive — ITAD may return values beyond "H"|"N"|"S"
  url: z.string(),
  expiry: z.string().nullish(),
}).passthrough();

const GameSearchResultSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  assets: z.object({ boxart: z.string().optional() }).optional(),
}).passthrough();

export const GamePriceResultSchema = z.object({
  id: z.string(),
  historyLow: z.object({
    all: PriceInfoSchema.nullable(),
    y1: PriceInfoSchema.nullable(),
    m3: PriceInfoSchema.nullable(),
  }),
  deals: z.array(DealSchema),
});

const DealItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  assets: z.object({ boxart: z.string().optional() }).optional(),
  deal: z.object({
    shop: z.object({ id: z.number(), name: z.string() }),
    price: PriceInfoSchema,
    regular: PriceInfoSchema,
    cut: z.number(),
    flag: z.string().nullable(),  // more permissive
    url: z.string(),
    expiry: z.string().nullish(),
  }).passthrough(),
}).passthrough();

const DealsResponseSchema = z.object({
  list: z.array(DealItemSchema),
  hasMore: z.boolean().optional(),
});

const HistoryPointSchema = z.object({
  timestamp: z.string(),
  shop: z.object({ id: z.number(), name: z.string() }),
  deal: z.object({
    price: PriceInfoSchema,
    regular: PriceInfoSchema,
    cut: z.number(),
  }).passthrough(),
}).passthrough();

const GameLookupSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  assets: z.object({ boxart: z.string().optional() }).optional(),
});

export type GameSearchResult = z.infer<typeof GameSearchResultSchema>;
export type PriceInfo = z.infer<typeof PriceInfoSchema>;
export type DealFlag = string | null;
export type Deal = z.infer<typeof DealSchema>;
export type GamePriceResult = z.infer<typeof GamePriceResultSchema>;
export type DealItem = z.infer<typeof DealItemSchema>;
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;
export type GameLookup = z.infer<typeof GameLookupSchema>;

/* ── Steam CDN helpers ── */
export function steamAppIdFromUrl(url: string): string | null {
  const m = url.match(/store\.steampowered\.com\/app\/(\d+)/)
    ?? url.match(/\/steam\/apps\/(\d+)\//);
  return m ? m[1] : null;
}
export const steamHeaderUrl  = (id: string) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
export const steamHeroUrl    = (id: string) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_hero.jpg`;
export const steamCapsuleUrl = (id: string) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`;

function getApiKey(): string {
  const key = process.env.ITAD_API_KEY;
  if (!key) throw new Error("ITAD_API_KEY가 설정되지 않았습니다.");
  return key;
}

export async function searchGames(title: string): Promise<GameSearchResult[]> {
  const url = new URL(`${BASE_URL}/games/search/v1`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("title", title);
  url.searchParams.set("results", "10");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`게임 검색 실패 (${res.status})`);
  return z.array(GameSearchResultSchema).parse(await res.json());
}

export async function getPrices(
  gameIds: string[],
  country = "KR"
): Promise<GamePriceResult[]> {
  if (gameIds.length === 0) return [];
  const url = new URL(`${BASE_URL}/games/prices/v3`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("country", country);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gameIds),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`가격 조회 실패 (${res.status})`);
  return z.array(GamePriceResultSchema).parse(await res.json());
}

export async function getDeals(limit = 20, country = "KR", sort = "-cut"): Promise<DealItem[]> {
  const url = new URL(`${BASE_URL}/deals/v2`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", sort);
  url.searchParams.set("country", country);
  url.searchParams.set("shops", STEAM_SHOP);

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`딜 목록 조회 실패 (${res.status}): ${await res.text()}`);

  const raw = await res.json();

  // Handle both { list: [...] } and [...] shapes
  if (Array.isArray(raw)) {
    return z.array(DealItemSchema).parse(raw);
  }
  return DealsResponseSchema.parse(raw).list;
}

export async function getPriceHistory(gameId: string, country = "KR"): Promise<HistoryPoint[]> {
  const url = new URL(`${BASE_URL}/games/history/v2`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("id", gameId);
  url.searchParams.set("country", country);
  url.searchParams.set("shops", STEAM_SHOP);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`가격 히스토리 조회 실패 (${res.status})`);
  return z.array(HistoryPointSchema).parse(await res.json());
}

export async function lookupByAppId(appId: number): Promise<GameLookup | null> {
  const url = new URL(`${BASE_URL}/games/lookup/v1`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("appid", String(appId));

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data = await res.json();
  const candidate = (data?.game ?? data) as unknown;
  const parsed = GameLookupSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
