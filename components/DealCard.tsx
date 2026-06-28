import Link from "next/link";
import Sparkline from "./Sparkline";

export interface DealData {
  id?: string;
  name: string;
  tags: string;
  old: number;
  now: number;
  disc: number;
  low: boolean;
  spark: number[];
  boxart?: string;
}

const CAP_BG = "repeating-linear-gradient(45deg,transparent 0 15px,rgba(32,36,34,.55) 15px 30px),linear-gradient(135deg,#1c1f1e,#141716)";

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

export default function DealCard({ game }: { game: DealData }) {
  return (
    <Link
      href={`/game/${game.id ?? "1"}?title=${encodeURIComponent(game.name)}`}
      className="dcard"
      style={{
        background: "linear-gradient(180deg,#141716,#101212)",
        border: "1px solid #272d2d",
        borderRadius: 14,
        overflow: "hidden",
        display: "block",
        transition: "border-color .15s, transform .15s",
      }}
    >
      <div style={{ height: 104, background: CAP_BG, position: "relative", overflow: "hidden" }}>
        {game.boxart && (
          <img
            src={game.boxart}
            alt={game.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {!game.boxart && (
          <span style={{ position: "absolute", top: 9, left: 11, font: "600 9px 'IBM Plex Mono'", color: "#3f5849", letterSpacing: 1 }}>
            CAPSULE
          </span>
        )}
        {game.low && (
          <span style={{
            position: "absolute", top: 9, right: 9,
            fontSize: 10, fontWeight: 700, color: "#06120b",
            background: "#5fd39a", padding: "3px 8px", borderRadius: 6,
          }}>
            역대 최저
          </span>
        )}
      </div>

      <div style={{ padding: "13px 14px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#e6ebe8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {game.name}
        </div>
        <div style={{ fontSize: 11.5, color: "#7e827f", marginTop: 3 }}>
          {game.tags}
        </div>
        <div style={{ marginTop: 11, height: 34 }}>
          <Sparkline data={game.spark} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600, color: "#06120b", background: "#5fd39a", padding: "3px 7px", borderRadius: 6 }}>
            -{game.disc}%
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 700, color: "#5fd39a" }}>
            {won(game.now)}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#7e827f", textDecoration: "line-through", marginLeft: "auto" }}>
            {won(game.old)}
          </span>
        </div>
      </div>
    </Link>
  );
}
