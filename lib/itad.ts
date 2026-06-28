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

export type GameSearchResult = z.infer<typeof GameSearchResultSchema>;
export type PriceInfo = z.infer<typeof PriceInfoSchema>;
export type DealFlag = z.infer<typeof DealSchema>["flag"];
export type Deal = z.infer<typeof DealSchema>;
export type GamePriceResult = z.infer<typeof GamePriceResultSchema>;

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
  if (!res.ok) {
    throw new Error(`게임 검색 실패 (${res.status})`);
  }
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
  if (!res.ok) {
    throw new Error(`가격 조회 실패 (${res.status})`);
  }
  return z.array(GamePriceResultSchema).parse(await res.json());
}
