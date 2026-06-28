import Link from "next/link";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7e827f" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default function Nav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(13,15,14,.86)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #222727",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", height: 60,
        padding: "0 22px", display: "flex", alignItems: "center", gap: 22,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 9,
          fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", color: "#eef6f0",
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: "linear-gradient(135deg,#43c282,#1d7a52)",
            boxShadow: "0 0 14px rgba(67,194,130,.45)",
          }} />
          스팀 최저가 트래커
        </Link>

        <div style={{
          flex: 1, maxWidth: 420, height: 38,
          background: "#141616", border: "1px solid #272d2d", borderRadius: 9,
          display: "flex", alignItems: "center", gap: 9, padding: "0 13px",
          color: "#7e827f", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
        }}>
          <SearchIcon />
          게임 검색…
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, fontWeight: 600, color: "#a3a8a4" }}>
          <span style={{ cursor: "pointer" }}>핫딜</span>
          <span style={{ cursor: "pointer" }}>출시예정</span>
          <span style={{ cursor: "pointer" }}>위시리스트</span>
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg,#2a302d,#191c1b)",
          border: "1px solid #2c4135",
        }} />
      </div>
    </nav>
  );
}
