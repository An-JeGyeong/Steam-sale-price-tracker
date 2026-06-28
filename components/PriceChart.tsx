"use client";

import { useState } from "react";

export interface RawPoint {
  m: string;
  p: number;
  sale?: string;
  d?: number;
  low?: boolean;
  cur?: boolean;
}

interface Props {
  raw: RawPoint[];
  historyLow: number;
  avg: number;
  regular: number;
}

type Range = "3M" | "6M" | "1Y" | "전체";

const W = 760, H = 300, L = 56, R = 740, T = 36, B = 250;

function fmt(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

export default function PriceChart({ raw, historyLow, avg, regular }: Props) {
  const [range, setRange] = useState<Range>("1Y");
  const [hover, setHover] = useState<number>(raw.length - 1);

  const rangeN: Record<Range, number> = { "3M": 3, "6M": 6, "1Y": 12, "전체": 12 };
  const n = rangeN[range];
  const start = raw.length - n;
  const data = raw.map((d, i) => ({ ...d, gi: i })).slice(start);

  // Dynamic Y-axis range derived from data + reference lines
  const allPrices = [...data.map((d) => d.p), historyLow, avg, regular].filter(Boolean) as number[];
  const dataMin = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const dataMax = allPrices.length > 0 ? Math.max(...allPrices) : 10000;
  const pad = Math.max((dataMax - dataMin) * 0.18, dataMax * 0.05);
  const PMIN = Math.max(0, Math.floor((dataMin - pad) / 500) * 500);
  const PMAX = Math.ceil((dataMax + pad) / 500) * 500;

  const xCoord = (i: number) =>
    data.length === 1 ? (L + R) / 2 : L + i * ((R - L) / (data.length - 1));
  const yCoord = (p: number) => B - ((p - PMIN) / (PMAX - PMIN || 1)) * (B - T);

  const pts = data.map((d, i) => `${xCoord(i)},${yCoord(d.p)}`).join(" ");
  const area = `${xCoord(0)},${B} ${pts} ${xCoord(data.length - 1)},${B}`;

  const yLow = yCoord(historyLow);
  const yAvg = yCoord(avg);
  const yReg = yCoord(regular);

  const hi = data.findIndex((d) => d.gi === hover);
  const hd = hi >= 0 ? data[hi] : null;
  const hitW = data.length > 1 ? (R - L) / (data.length - 1) : R - L;

  const gridLines: [number, string, string, number][] = [
    [yReg, `정가 ${fmt(regular)}`, "#3f5849", regular],
    [yAvg, `평균 ${fmt(avg)}`, "#2c4135", avg],
    [yLow, `역대최저 ${fmt(historyLow)}`, "#5fd39a", historyLow],
  ];

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#eef6f0", display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5fd39a" strokeWidth="2">
            <path d="M3 3v18h18" /><path d="m7 14 4-5 3 3 5-7" />
          </svg>
          가격 추이
        </div>
        <div style={{ display: "flex", gap: 4, background: "#121414", border: "1px solid #272d2d", borderRadius: 9, padding: 3 }}>
          {(["3M", "6M", "1Y", "전체"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
                background: range === r ? "rgba(67,194,130,.16)" : "transparent",
                color: range === r ? "#7fe3b0" : "#828783",
                border: "none", cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43c282" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#43c282" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Reference lines */}
        {gridLines.map(([yy, , col, val], k) => (
          <g key={k}>
            <line x1={L} x2={R} y1={yy} y2={yy} stroke={col} strokeWidth={1} strokeDasharray={k === 2 ? "6 4" : "2 5"} opacity={k === 2 ? 0.9 : 0.5} />
            <text x={L - 6} y={yy + 4} textAnchor="end" style={{ font: "600 10px 'IBM Plex Mono'", fill: col }}>
              {fmt(val).replace("₩", "")}
            </text>
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={`x${i}`} x={xCoord(i)} y={B + 20} textAnchor="middle" style={{ font: "500 10px 'IBM Plex Mono'", fill: "#5a7165" }}>
            {d.m}
          </text>
        ))}

        {/* Area fill + line */}
        <polygon points={area} fill="url(#ag)" />
        <polyline points={pts} fill="none" stroke="#43c282" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />

        {/* Sale dots */}
        {data.map((d, i) =>
          d.sale ? (
            <circle
              key={`dot${i}`}
              cx={xCoord(i)} cy={yCoord(d.p)}
              r={d.low || d.cur ? 6 : 4.5}
              fill={d.low ? "#5fd39a" : "#43c282"}
              stroke="#0a120d" strokeWidth={2}
            />
          ) : null
        )}

        {/* Hover guide + tooltip */}
        {hd && hi >= 0 && (() => {
          const hx = xCoord(hi);
          const hy = yCoord(hd.p);
          const tw = hd.sale ? 150 : 122;
          const th = hd.sale ? 66 : 50;
          let tx = hx - tw / 2;
          tx = Math.max(L, Math.min(R - tw, tx));
          const ty = Math.max(T, hy - th - 14);
          return (
            <g>
              <line x1={hx} x2={hx} y1={T} y2={B} stroke="#43c282" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
              <circle cx={hx} cy={hy} r={5.5} fill="#fff" stroke="#43c282" strokeWidth={2.5} />
              <rect x={tx} y={ty} width={tw} height={th} rx={8} fill="#06120b" stroke="#28402f" />
              <text x={tx + 12} y={ty + 17} style={{ font: "600 11px 'Noto Sans KR'", fill: "#a3a8a4" }}>
                {hd.m.replace(".", " / ")}월
              </text>
              <text x={tx + 12} y={ty + 37} style={{ font: "700 14px 'IBM Plex Mono'", fill: hd.sale ? "#5fd39a" : "#cdd6d2" }}>
                {fmt(hd.p)}
              </text>
              {hd.sale && (
                <text x={tx + 12} y={ty + 54} style={{ font: "600 10px 'IBM Plex Mono'", fill: "#43c282" }}>
                  {hd.sale} · -{hd.d}%
                </text>
              )}
            </g>
          );
        })()}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect
            key={`hit${i}`}
            x={xCoord(i) - hitW / 2} y={T}
            width={hitW} height={B - T}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(d.gi!)}
          />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, marginTop: 6, fontSize: 11.5, color: "#8b8f8b", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#43c282", display: "inline-block" }} />
          세일 시점
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 16, height: 0, borderTop: "2px dashed #5fd39a", display: "inline-block" }} />
          역대 최저가 {fmt(historyLow)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3f5849", display: "inline-block" }} />
          정가 구간
        </div>
      </div>
    </div>
  );
}
