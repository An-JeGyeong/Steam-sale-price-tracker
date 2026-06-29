"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useTheme } from "@/app/theme-provider";

interface AuthMeResponse {
  loggedIn: boolean;
  steamName?: string;
  steamAvatar?: string;
  steamId?: string;
}

function SteamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z" />
    </svg>
  );
}

function PillToggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="테마 변경"
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: checked ? "#2c3630" : "#5fd39a",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: "4px",
        left: checked ? "4px" : "calc(100% - 20px)",
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        display: "block",
      }} />
    </button>
  );
}

const PANEL_STYLE = {
  background: "linear-gradient(180deg,#141716,#101212)",
  border: "1px solid #1e2424",
  borderRadius: 14,
  padding: "22px 24px",
  marginBottom: 18,
} as const;

const PANEL_TITLE = {
  fontSize: 14,
  fontWeight: 800,
  color: "#eef6f0",
  letterSpacing: -0.2,
  marginBottom: 16,
} as const;

const LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 600,
  color: "#7e827f",
  marginBottom: 6,
  display: "block",
} as const;

const INPUT_STYLE = {
  width: "100%",
  background: "#0e1210",
  border: "1px solid #272d2d",
  borderRadius: 9,
  padding: "9px 13px",
  color: "#cfd3d0",
  fontSize: 13,
  fontFamily: "'Noto Sans KR', system-ui, sans-serif",
  outline: "none",
  boxSizing: "border-box" as const,
} as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<AuthMeResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [customAvatar, setCustomAvatar] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem("custom-avatar") ?? "";
    setCustomAvatar(stored);
    setAvatarInput(stored);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: AuthMeResponse) => {
        setProfile(d);
        setPageLoading(false);
      })
      .catch(() => setPageLoading(false));
  }, []);

  function saveAvatar() {
    setCustomAvatar(avatarInput);
    localStorage.setItem("custom-avatar", avatarInput);
    setSavedMsg(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedMsg(false), 2000);
  }

  function resetAvatar() {
    setCustomAvatar("");
    setAvatarInput("");
    localStorage.removeItem("custom-avatar");
  }

  const effectiveAvatar = customAvatar || (profile?.steamAvatar ?? "");
  const displayName = profile?.steamName ?? "Steam 유저";

  if (pageLoading) {
    return (
      <div>
        <Nav />
        <div style={{ maxWidth: 860, margin: "80px auto", padding: "0 22px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#7e827f" }}>불러오는 중…</div>
        </div>
      </div>
    );
  }

  if (!profile?.loggedIn) {
    return (
      <div>
        <Nav />
        <div style={{ maxWidth: 860, margin: "80px auto", padding: "0 22px", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e6ebe8", marginBottom: 8 }}>로그인이 필요합니다</div>
          <div style={{ fontSize: 14, color: "#7e827f", marginBottom: 28 }}>마이페이지를 이용하려면 Steam으로 로그인해주세요.</div>
          <a
            href="/api/auth/steam"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 700, color: "#c7d5e0",
              background: "#1b2838", border: "1px solid #2a475e",
              padding: "11px 22px", borderRadius: 10, textDecoration: "none",
            }}
          >
            <SteamIcon />
            Steam으로 로그인
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 22px 60px" }}>

        {/* 페이지 제목 */}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, marginBottom: 28 }}>
          마이페이지
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>

          {/* 왼쪽 카드 */}
          <div style={{
            background: "linear-gradient(180deg,#141716,#101212)",
            border: "1px solid #1e2424",
            borderRadius: 16,
            padding: "28px 22px",
            textAlign: "center",
            position: "sticky",
            top: 80,
          }}>
            {/* 아바타 90x90 */}
            <div style={{
              width: 90, height: 90, borderRadius: 20, overflow: "hidden",
              background: "#1e2424", border: "2px solid rgba(67,194,130,.35)",
              margin: "0 auto 14px",
            }}>
              {effectiveAvatar ? (
                <img
                  src={effectiveAvatar}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: "#5fd39a" }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* 이름 */}
            <div style={{ fontSize: 16, fontWeight: 800, color: "#eef6f0", marginBottom: 4 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12, color: "#5fd39a", fontWeight: 600, marginBottom: 24 }}>
              Steam 계정 연동
            </div>

            {/* 찜목록 버튼 */}
            <Link
              href="/wishlist"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: 13, fontWeight: 700, color: "#5fd39a",
                background: "transparent", border: "1px solid rgba(95,211,154,.35)",
                padding: "9px 0", borderRadius: 10, textDecoration: "none",
                marginBottom: 10, width: "100%",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              찜목록 보기
            </Link>

            {/* 로그아웃 */}
            <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
              <button
                type="submit"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, fontWeight: 600, color: "#7e827f",
                  background: "#0e1210", border: "1px solid #272d2d",
                  padding: "9px 0", borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  width: "100%",
                }}
              >
                로그아웃
              </button>
            </form>
          </div>

          {/* 오른쪽 패널들 */}
          <div>

            {/* 1. 프로필 이미지 설정 */}
            <div style={PANEL_STYLE}>
              <div style={PANEL_TITLE}>프로필 이미지 설정</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                {/* 미리보기 56x56 */}
                <div style={{
                  width: 56, height: 56, borderRadius: 12, overflow: "hidden",
                  background: "#1e2424", border: "1.5px solid rgba(67,194,130,.3)", flexShrink: 0,
                }}>
                  {avatarInput ? (
                    <img
                      src={avatarInput}
                      alt="미리보기"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#5fd39a" }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_STYLE}>아바타 이미지 URL</label>
                  <input
                    type="text"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={saveAvatar}
                  style={{
                    fontSize: 13, fontWeight: 700, color: "#06120b",
                    background: "#5fd39a", border: "none", borderRadius: 9,
                    padding: "8px 20px", cursor: "pointer",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}
                >
                  저장
                </button>
                <button
                  onClick={resetAvatar}
                  style={{
                    fontSize: 13, fontWeight: 600, color: "#7e827f",
                    background: "#0e1210", border: "1px solid #272d2d", borderRadius: 9,
                    padding: "8px 16px", cursor: "pointer",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}
                >
                  초기화
                </button>
                {savedMsg && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#5fd39a" }}>
                    ✓ 저장됨
                  </span>
                )}
              </div>
            </div>

            {/* 2. 테마 설정 */}
            <div style={PANEL_STYLE}>
              <div style={PANEL_TITLE}>테마 설정</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#dce3de" }}>
                    {theme === "dark" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
                  </div>
                  <div style={{ fontSize: 12, color: "#7e827f", marginTop: 4 }}>
                    {theme === "dark" ? "어두운 배경 테마를 사용 중입니다" : "밝은 배경 테마를 사용 중입니다"}
                  </div>
                </div>
                <PillToggle checked={theme === "dark"} onToggle={toggle} />
              </div>
            </div>

            {/* 3. 계정 정보 */}
            <div style={PANEL_STYLE}>
              <div style={PANEL_TITLE}>계정 정보</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span style={LABEL_STYLE}>Steam 닉네임</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#cfd3d0" }}>{displayName}</div>
                </div>
                {profile.steamId && (
                  <div>
                    <span style={LABEL_STYLE}>Steam ID</span>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: "#cfd3d0" }}>{profile.steamId}</div>
                  </div>
                )}
                <div>
                  <span style={LABEL_STYLE}>연동 상태</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#5fd39a" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5fd39a", display: "inline-block", boxShadow: "0 0 6px #5fd39a" }} />
                    Steam 계정 연동 완료
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
