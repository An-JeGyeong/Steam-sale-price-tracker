"use client";

import { useState } from "react";
import type { GameSearchResult, Deal, PriceInfo } from "@/lib/itad";

interface CheckResult {
  bestDeal: Deal;
  historyLow: PriceInfo | null;
  isAllTimeLow: boolean;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<GameSearchResult[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [selected, setSelected] = useState<GameSearchResult | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(null);
    setNoResults(false);
    try {
      const res = await fetch(`/api/search?title=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색 실패");
      setCandidates(data);
      if (data.length === 0) setNoResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(game: GameSearchResult) {
    setSelected(game);
    setCandidates([]);
    setNoResults(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/check?id=${game.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-lg flex-col gap-6">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
          지금 이 할인, 역대 최저가일까?
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="게임 이름 입력 (예: Hades)"
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-black disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-black"
          >
            검색
          </button>
        </form>

        {loading && <p className="text-zinc-500">불러오는 중...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {noResults && <p className="text-zinc-500">검색 결과가 없습니다.</p>}

        {candidates.length > 0 && (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {candidates.map((game) => (
              <li key={game.id}>
                <button
                  onClick={() => handleSelect(game)}
                  className="w-full px-4 py-2 text-left text-black hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-900"
                >
                  {game.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && result && (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {selected.assets?.boxart && (
              <img
                src={selected.assets.boxart}
                alt={selected.title}
                className="w-full rounded-md object-cover"
              />
            )}
            <h2 className="text-lg font-semibold text-black dark:text-white">{selected.title}</h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              현재 최저가: {result.bestDeal.price.amount.toFixed(2)} {result.bestDeal.price.currency} ({result.bestDeal.shop.name}, {result.bestDeal.cut}% 할인)
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              역대 최저가: {result.historyLow ? `${result.historyLow.amount.toFixed(2)} ${result.historyLow.currency}` : "정보 없음"}
            </p>
            <p
              className={`text-lg font-bold ${
                result.isAllTimeLow ? "text-green-600" : "text-orange-500"
              }`}
            >
              {result.isAllTimeLow ? "지금이 역대 최저가입니다!" : "역대 최저가는 아니에요."}
            </p>
            <a
              href={result.bestDeal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block rounded-lg bg-black px-4 py-2 text-center text-white dark:bg-white dark:text-black"
            >
              구매하기 →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
