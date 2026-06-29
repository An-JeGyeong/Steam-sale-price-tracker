"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

interface FeedbackPost {
  id: string;
  type: "버그제보" | "기능개선" | "기타";
  title: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
}

const SEED_POSTS: FeedbackPost[] = [
  {
    id: "1",
    type: "기능개선",
    title: "모바일 뷰 개선 요청",
    content: "모바일에서 볼 때 테이블이 너무 작아요. 모바일 최적화가 됐으면 합니다.",
    author: "Steam 유저",
    createdAt: "2026-06-25T10:00:00Z",
    upvotes: 12,
  },
  {
    id: "2",
    type: "버그제보",
    title: "일부 게임 이미지 안 나옴",
    content: "할인 목록에서 이미지가 안 뜨는 게임들이 있어요. 확인 부탁드립니다.",
    author: "익명",
    createdAt: "2026-06-26T14:30:00Z",
    upvotes: 7,
  },
  {
    id: "3",
    type: "기능개선",
    title: "가격 알림 기능 추가",
    content: "특정 가격 이하가 되면 알림 받을 수 있는 기능이 있으면 좋겠어요!",
    author: "Steam 유저",
    createdAt: "2026-06-27T09:15:00Z",
    upvotes: 24,
  },
  {
    id: "4",
    type: "기타",
    title: "서비스 너무 유용해요",
    content: "역대 최저가 확인 기능이 정말 편합니다. 감사합니다!",
    author: "익명",
    createdAt: "2026-06-28T18:00:00Z",
    upvotes: 18,
  },
];

const STORAGE_KEY = "feedback-posts";

function loadPosts(): FeedbackPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = [...SEED_POSTS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_POSTS];
    return parsed as FeedbackPost[];
  } catch {
    return [...SEED_POSTS];
  }
}

function savePosts(posts: FeedbackPost[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

type PostType = "버그제보" | "기능개선" | "기타";
type FilterTab = "전체" | "버그제보" | "기능개선" | "기타";

const TYPE_BADGE: Record<PostType, { bg: string; color: string }> = {
  "버그제보": { bg: "rgba(232,112,95,.15)", color: "#e8705f" },
  "기능개선": { bg: "rgba(95,211,154,.15)", color: "#5fd39a" },
  "기타": { bg: "rgba(163,168,164,.15)", color: "#a3a8a4" },
};

const FILTER_TABS: FilterTab[] = ["전체", "버그제보", "기능개선", "기타"];

export default function FeedbackPage() {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("전체");
  const [formOpen, setFormOpen] = useState(false);

  /* 폼 상태 */
  const [formType, setFormType] = useState<PostType>("기능개선");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    setPosts(loadPosts());
  }, []);

  /* 필터링 + 최신순 정렬 */
  const filtered = posts
    .filter((p) => filterTab === "전체" || p.type === filterTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleSubmit() {
    if (!formTitle.trim() || !formContent.trim()) {
      setSubmitMsg("제목과 내용을 입력해주세요.");
      return;
    }
    const newPost: FeedbackPost = {
      id: Date.now().toString(),
      type: formType,
      title: formTitle.trim(),
      content: formContent.trim(),
      author: formAuthor.trim() || "익명",
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    savePosts(updated);
    setFormTitle("");
    setFormContent("");
    setFormAuthor("");
    setSubmitMsg("등록되었습니다!");
    setFormOpen(false);
    setTimeout(() => setSubmitMsg(""), 3000);
  }

  function handleUpvote(id: string) {
    const updated = posts.map((p) =>
      p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p
    );
    setPosts(updated);
    savePosts(updated);
  }

  const INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    background: "#0e1210",
    border: "1px solid #272d2d",
    borderRadius: 9,
    padding: "9px 13px",
    color: "#cfd3d0",
    fontSize: 13,
    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 22px 60px" }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#eef6f0", letterSpacing: -0.4, marginBottom: 6 }}>
            피드백 &amp; 제안
          </div>
          <div style={{ fontSize: 14, color: "#7e827f" }}>
            서비스 개선을 위한 의견을 남겨주세요
          </div>
        </div>

        {/* 작성 버튼 + 폼 */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => setFormOpen((v) => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 700, color: "#06120b",
              background: "#5fd39a", border: "none",
              padding: "10px 22px", borderRadius: 10, cursor: "pointer",
              fontFamily: "'Noto Sans KR', system-ui, sans-serif",
              marginBottom: formOpen ? 16 : 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {formOpen ? "접기" : "피드백 작성"}
          </button>

          {formOpen && (
            <div style={{ background: "linear-gradient(180deg,#141716,#101212)", border: "1px solid #1e2424", borderRadius: 14, padding: "22px 24px" }}>
              {/* 타입 선택 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#7e827f", marginBottom: 8 }}>분류</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["버그제보", "기능개선", "기타"] as PostType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormType(t)}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        color: formType === t ? TYPE_BADGE[t].color : "#7e827f",
                        background: formType === t ? TYPE_BADGE[t].bg : "transparent",
                        border: `1px solid ${formType === t ? TYPE_BADGE[t].color : "#272d2d"}`,
                        cursor: "pointer",
                        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                        transition: "all 0.12s",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7e827f", display: "block", marginBottom: 6 }}>제목</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="제목을 입력해주세요"
                  style={INPUT_STYLE}
                />
              </div>

              {/* 내용 */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7e827f", display: "block", marginBottom: 6 }}>내용</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="내용을 입력해주세요"
                  rows={4}
                  style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              {/* 작성자 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7e827f", display: "block", marginBottom: 6 }}>작성자</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Steam 닉네임 또는 익명"
                  style={INPUT_STYLE}
                />
              </div>

              {/* 등록 + 메시지 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    fontSize: 14, fontWeight: 700, color: "#06120b",
                    background: "#5fd39a", border: "none", borderRadius: 9,
                    padding: "9px 24px", cursor: "pointer",
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                  }}
                >
                  등록
                </button>
                {submitMsg && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: submitMsg.includes("!") ? "#5fd39a" : "#e8705f" }}>
                    {submitMsg}
                  </span>
                )}
              </div>
            </div>
          )}
          {submitMsg && !formOpen && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#5fd39a" }}>{submitMsg}</div>
          )}
        </div>

        {/* 필터 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              style={{
                padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                color: filterTab === tab ? "#5fd39a" : "#7e827f",
                background: filterTab === tab ? "rgba(95,211,154,.1)" : "transparent",
                border: `1px solid ${filterTab === tab ? "rgba(95,211,154,.3)" : "#272d2d"}`,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                transition: "all 0.12s",
              }}
            >
              {tab}
              {tab !== "전체" && (
                <span style={{ marginLeft: 6, fontSize: 11, color: filterTab === tab ? "#5fd39a" : "#4a504d" }}>
                  ({posts.filter((p) => p.type === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#5a615d", fontSize: 14 }}>
              게시글이 없습니다
            </div>
          ) : (
            filtered.map((post) => {
              const badge = TYPE_BADGE[post.type];
              return (
                <div
                  key={post.id}
                  style={{
                    background: "linear-gradient(180deg,#141716,#101212)",
                    border: "1px solid #1e2424",
                    borderRadius: 13,
                    padding: "18px 20px",
                  }}
                >
                  {/* 헤더 라인 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: badge.color, background: badge.bg, padding: "3px 9px", borderRadius: 5, flexShrink: 0 }}>
                      {post.type}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e6ebe8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.title}
                    </div>
                  </div>

                  {/* 내용 미리보기 (2줄) */}
                  <div style={{
                    fontSize: 13, color: "#a3a8a4", lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: 12,
                  } as React.CSSProperties}>
                    {post.content}
                  </div>

                  {/* 푸터 라인 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#5a615d" }}>
                        {post.author}
                      </span>
                      <span style={{ fontSize: 11, color: "#3d4440" }}>
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    {/* 추천 버튼 */}
                    <button
                      onClick={() => handleUpvote(post.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700, color: "#7e827f",
                        background: "rgba(163,168,164,.07)", border: "1px solid #272d2d",
                        padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#5fd39a";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(95,211,154,.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#7e827f";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#272d2d";
                      }}
                    >
                      <span>👍</span>
                      <span>{post.upvotes}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
