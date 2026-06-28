import { z } from "zod";

const BASE_URL = "https://api.isthereanydeal.com";

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
  flag: z.enum(["H", "N", "S"]).nullable(),
  url: z.string(),
  expiry: z.string().nullish(),
});

const GameSearchResultSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  assets: z.object({ boxart: z.string().optional() }),
});

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
    flag: z.enum(["H", "N", "S"]).nullable(),
    url: z.string(),
    expiry: z.string().nullish(),
  }),
});

const DealsResponseSchema = z.object({
  list: z.array(DealItemSchema),
  hasMore: z.boolean(),
});

const HistoryPointSchema = z.object({
  shop: z.object({ id: z.number(), name: z.string() }),
  price: PriceInfoSchema,
  regular: PriceInfoSchema,
  cut: z.number(),
  timestamp: z.string(),
  expiry: z.string().nullish(),
});

export type GameSearchResult = z.infer<typeof GameSearchResultSchema>;
export type PriceInfo = z.infer<typeof PriceInfoSchema>;
export type DealFlag = z.infer<typeof DealSchema>["flag"];
export type Deal = z.infer<typeof DealSchema>;
export type GamePriceResult = z.infer<typeof GamePriceResultSchema>;
export type DealItem = z.infer<typeof DealItemSchema>;
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;

function getApiKey(): string {
  const key = process.env.ITAD_API_KEY;
  if (!key) {
    throw new Error("ITAD_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요.");
  }
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

export async function getDeals(limit = 8, country = "KR"): Promise<DealItem[]> {
  const url = new URL(`${BASE_URL}/deals/v2`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", "-discount");
  url.searchParams.set("country", country);

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`딜 목록 조회 실패 (${res.status})`);
  const data = DealsResponseSchema.parse(await res.json());
  return data.list;
}

export async function getPriceHistory(gameId: string, country = "KR"): Promise<HistoryPoint[]> {
  const url = new URL(`${BASE_URL}/games/history/v2`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("id", gameId);
  url.searchParams.set("country", country);
  url.searchParams.set("shops", "61");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`가격 히스토리 조회 실패 (${res.status})`);
  return z.array(HistoryPointSchema).parse(await res.json());
}
