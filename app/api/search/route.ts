import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/itad";

function hasKorean(text: string): boolean {
  return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(text);
}

async function translateKoToEn(text: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en&de=anjmo4568@gmail.com`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return text;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    if (data.responseStatus !== 200 && data.responseStatus !== undefined) return text;
    return data.responseData?.translatedText ?? text;
  } catch {
    return text;
  }
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title?.trim()) {
    return NextResponse.json([]);
  }

  const trimmed = title.trim();

  try {
    let searchTitle = trimmed;

    if (hasKorean(trimmed)) {
      const translated = await translateKoToEn(trimmed);
      if (translated && translated !== trimmed) {
        searchTitle = translated;
      }
    }

    const results = await searchGames(searchTitle);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
