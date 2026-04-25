import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import heroCheck from "../assets/hero_check.png";
import heroStudent from "../assets/hero_student.png";
import heroMoney from "../assets/hero_money.png";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const GRADE_BADGE = {
  diamond: { label: "💎 다이아몬드", color: "#1E3A8A", bg: "#DBEAFE", border: "#93C5FD" },
  platinum: { label: "🌙 플래티넘",  color: "#4C1D95", bg: "#EDE9FE", border: "#C4B5FD" },
  gold:     { label: "🥇 골드",      color: "#78350F", bg: "#FEF3C7", border: "#FCD34D" },
  silver:   { label: "🥈 실버",      color: "#374151", bg: "#F1F5F9", border: "#CBD5E1" },
};

const SKILL_COLOR_MAP = {
  "React": "#61DAFB", "Vue": "#4FC08D", "Angular": "#DD0031",
  "TypeScript": "#3178C6", "JavaScript": "#F39C12", "Node.js": "#339933",
  "Python": "#3776AB", "Java": "#007396", "Spring": "#6DB33F",
  "MySQL": "#4479A1", "MongoDB": "#47A248", "AWS": "#FF9900",
  "Docker": "#2496ED", "Kubernetes": "#326CE5", "Figma": "#F24E1E",
  "Flutter": "#02569B", "Swift": "#FA7343", "Kotlin": "#7F52FF",
  "Go": "#00ADD8", "PHP": "#777BB4", "C#": "#239120", "C++": "#00599C",
  "AI/ML": "#A855F7", "GraphQL": "#E535AB", "TensorFlow": "#FF6F00",
};

const MOCK_CAREERS_FALLBACK = [
  { companyName: "테크브릿지 (주)", jobTitle: "프론트엔드 개발팀장", period: "2021.03 ~ 현재", employmentType: "정규직", desc: "React 기반 SaaS 플랫폼 개발 및 팀 리딩, 성능 최적화 20% 달성" },
  { companyName: "스타트업 코리아", jobTitle: "풀스택 개발자", period: "2018.07 ~ 2021.02", employmentType: "정규직", desc: "Node.js + React 스택으로 B2B 서비스 0→1 프로덕트 개발" },
];

const MOCK_EDU_FALLBACK = [
  { school: "한국대학교", schoolType: "4년제 대학교", major: "컴퓨터공학과", degree: "학사", status: "졸업" },
];

const PORTFOLIO_IMGS = [heroCheck, heroStudent, heroMoney];
const PORTFOLIO_BG = [
  "linear-gradient(135deg,#F97316,#EF4444)",
  "linear-gradient(135deg,#3B82F6,#6366F1)",
  "linear-gradient(135deg,#10B981,#0EA5E9)",
];
const MOCK_PORTFOLIO_FALLBACK = [
  { title: "AI 기반 챗봇 플랫폼", category: "개발·AI", tags: ["React", "FastAPI"], desc: "LLM 기반 콘텐츠 추천 플랫폼 풀스택 개발", rep: true },
  { title: "SaaS 관리자 대시보드", category: "개발·웹", tags: ["Vue.js", "TypeScript"], desc: "B2B SaaS 관리자 대시보드 UI 리뉴얼", rep: false },
  { title: "크로스플랫폼 모바일 앱", category: "개발·앱", tags: ["React Native", "Firebase"], desc: "쇼핑몰 앱 리뉴얼 및 성능 최적화", rep: false },
];
const MOCK_REVIEWS_FALLBACK = [
  { reviewer: "Alpha FinTech", rating: 5.0, date: "2024.11", comment: "요구사항을 정확히 파악하고 기간 내 완벽하게 납품해주셨습니다. 커뮤니케이션도 뛰어납니다." },
  { reviewer: "Beta Corp", rating: 4.8, date: "2024.08", comment: "기술적인 이해도가 높아서 요구사항을 빠르게 반영해주셨어요. 매우 만족스럽습니다." },
];

const TABS = [
  { key: "intro",     label: "소개",       icon: "👤" },
  { key: "skills",    label: "기술",       icon: "</>", isCode: true },
  { key: "career",    label: "경력",       icon: "💼" },
  { key: "education", label: "학력",       icon: "🎓" },
  { key: "portfolio", label: "포트폴리오", icon: "📋" },
  { key: "reviews",   label: "평가",       icon: "⭐" },
];

export default function PartnerProfileModal({ partner, onClose, onPropose, onReject }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("intro");
  const scrollRef = useRef(null);

  // 실제 백엔드 데이터로 prop 보강 (mock fallback 우선순위 낮춤)
  // partner.partnerUsername 또는 partner.username 으로 GET /api/profile/{username}/detail 호출
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    const username = partner?.partnerUsername || partner?.username || partner?.name;
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const { profileApi } = await import("../api/profile.api");
        const data = await profileApi.getDetailByUsername(username);
        if (!cancelled) setFetched(data);
      } catch (e) {
        // 조용히 실패 — partner prop 만으로 렌더 fallback
        if (!cancelled) setFetched(null);
      }
    })();
    return () => { cancelled = true; };
  }, [partner?.partnerUsername, partner?.username, partner?.name]);

  // partner prop + 실제 fetch 데이터 병합 (실제 데이터가 우선)
  const merged = { ...partner, ...(fetched || {}) };
  const sectionRefs = {
    intro:     useRef(null),
    skills:    useRef(null),
    career:    useRef(null),
    education: useRef(null),
    portfolio: useRef(null),
    reviews:   useRef(null),
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const keys = ["intro", "skills", "career", "education", "portfolio", "reviews"];
      let current = keys[0];
      for (const key of keys) {
        const el = sectionRefs[key].current;
        if (!el) continue;
        if (el.offsetTop - container.offsetTop - 80 <= scrollTop) {
          current = key;
        }
      }
      setActiveTab(current);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const grade = merged.grade ? GRADE_BADGE[merged.grade] : null;
  // 실제 데이터(merged.careers 등)가 있으면 그걸 사용, 없으면 mock fallback
  const careers = (merged.careers || []).length > 0 ? merged.careers : MOCK_CAREERS_FALLBACK;
  const educations = (merged.educations || []).length > 0 ? merged.educations : MOCK_EDU_FALLBACK;
  const portfolioItems = (merged.portfolioItems || []).length > 0 ? merged.portfolioItems : MOCK_PORTFOLIO_FALLBACK;
  const reviews = (merged.reviews || []).length > 0 ? merged.reviews : MOCK_REVIEWS_FALLBACK;
  const rating = merged.rating ?? 4.9;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 24,
          width: "min(820px, 94vw)", height: "88vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 32px 100px rgba(15,23,42,0.28)",
          overflow: "hidden",
        }}
      >
        {/* ── 헤더 ─────────────────────────────────── */}
        <div style={{
          padding: "22px 28px 16px", borderBottom: "1px solid #F1F5F9",
          background: "white", flexShrink: 0,
          display: "flex", alignItems: "flex-start", gap: 18,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
            border: "2px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#60A5FA"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#60A5FA"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{partner.name}</span>
              {grade && (
                <span style={{
                  fontSize: 12, fontWeight: 700, color: grade.color,
                  background: grade.bg, border: `1px solid ${grade.border}`,
                  borderRadius: 8, padding: "3px 10px", fontFamily: F,
                }}>{grade.label}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#64748B", fontFamily: F, marginBottom: 6 }}>
              {partner.title || partner.slogan || "개발 파트너"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, color: "#F59E0B" }}>{"★".repeat(Math.round(rating))}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{rating.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>/5.0</span>
              {partner.contractCount && (
                <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginLeft: 4 }}>· {partner.contractCount}건 완료</span>
              )}
            </div>
          </div>

          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 24, color: "#94A3B8", lineHeight: 1,
            padding: "2px 6px", flexShrink: 0,
          }}>✕</button>
        </div>

        {/* ── 탭 바 ─────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 4, padding: "12px 28px",
          borderBottom: "1px solid #F1F5F9", background: "white",
          flexShrink: 0, overflowX: "auto",
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  const el = sectionRefs[tab.key].current;
                  if (el && scrollRef.current) {
                    scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
                  }
                }}
                style={{
                  padding: "7px 16px", borderRadius: 99, border: "none",
                  background: isActive ? "#3B82F6" : "#F1F5F9",
                  color: isActive ? "white" : "#475569",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", fontFamily: F, whiteSpace: "nowrap",
                  transition: "all 0.15s", flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#E2E8F0"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#F1F5F9"; }}
              >
                <span style={tab.isCode ? { fontSize: 10, fontWeight: 900 } : { fontSize: 13 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 스크롤 콘텐츠 ─────────────────────────── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* 소개 섹션 */}
          <div ref={sectionRefs.intro} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>소개</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #E2E8F0" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", fontFamily: F, margin: "0 0 10px" }}>자기소개</p>
                <p style={{ fontSize: 15, color: "#1E293B", fontFamily: F, lineHeight: 1.8, margin: 0 }}>
                  {partner.desc || "안녕하세요. 클라이언트의 목표를 실현하는 파트너입니다."}
                </p>
              </div>
              {partner.sloganSub && (
                <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #E2E8F0" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", fontFamily: F, margin: "0 0 10px" }}>주요 업무 분야 및 강점</p>
                  <p style={{ fontSize: 15, color: "#1E293B", fontFamily: F, lineHeight: 1.8, margin: 0 }}>{partner.sloganSub}</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#64748B", fontFamily: F, margin: "0 0 10px" }}>주요 기술 태그</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(partner.tags || []).map(tag => {
                    const color = SKILL_COLOR_MAP[tag] || "#6366F1";
                    return (
                      <span key={tag} style={{
                        padding: "6px 14px", borderRadius: 99,
                        background: color + "18", border: `1.5px solid ${color}40`,
                        color, fontSize: 13, fontWeight: 700, fontFamily: F,
                      }}>{tag}</span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 기술 섹션 */}
          <div ref={sectionRefs.skills} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>기술</p>
            <div>
              {(partner.skills && partner.skills.length > 0 ? partner.skills : (partner.tags || [])).map((item, i) => {
                const techName = typeof item === "string" ? item : (item.techName || item.customTech || "기타");
                const proficiency = typeof item === "object" ? item.proficiency : ["전문가", "고급", "중급", "초급"][Math.min(i, 3)];
                const experience  = typeof item === "object" ? item.experience  : `${Math.max(1, (partner.experience || 3) - i)}년`;
                const color = SKILL_COLOR_MAP[techName] || "#6366F1";
                const initials = techName.length <= 3 ? techName.toUpperCase() : techName.substring(0, 2).toUpperCase();
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 20px", borderRadius: 12,
                    border: "1.5px solid #E2E8F0", background: "white",
                    marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: color + "18", border: `1.5px solid ${color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color, flexShrink: 0, fontFamily: F,
                    }}>{initials}</div>
                    <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#1E293B", fontFamily: F }}>
                      {techName}
                      {proficiency && <><span style={{ color: "#CBD5E1", margin: "0 8px" }}>|</span><span style={{ color: "#475569", fontWeight: 500 }}>{proficiency}</span></>}
                      {experience  && <><span style={{ color: "#CBD5E1", margin: "0 8px" }}>|</span><span style={{ color: "#475569", fontWeight: 500 }}>{experience}</span></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 경력 섹션 */}
          <div ref={sectionRefs.career} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>경력</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {careers.map((c, i) => {
                const companyName = c.companyName || c.company || "";
                const jobTitle    = c.jobTitle || c.role || "";
                const period = c.startDate
                  ? `${c.startDate.replace(/-/g, ".")} ~ ${c.isCurrent ? "현재" : (c.endDate || "").replace(/-/g, ".")}`
                  : (c.period || "");
                const empType = c.employmentType || c.type || "";
                const desc    = c.description || c.desc || "";
                return (
                  <div key={i} style={{ background: "white", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: desc ? 8 : 0 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{companyName}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#3B82F6", fontFamily: F, marginTop: 3 }}>{jobTitle}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>{period}</div>
                        {empType && <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", borderRadius: 5, padding: "2px 8px", fontFamily: F }}>{empType}</span>}
                      </div>
                    </div>
                    {desc && <p style={{ fontSize: 13, color: "#475569", fontFamily: F, margin: 0, lineHeight: 1.7 }}>{desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 학력 섹션 */}
          <div ref={sectionRefs.education} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>학력</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {educations.map((e, i) => {
                const schoolName = e.schoolName || e.school || "";
                const major      = e.major || e.track || "";
                const nameStr    = schoolName + (major ? ` | ${major}` : "");
                const degreeType = e.degree || e.degreeType || "";
                const status     = e.isEnrolled ? "재학중" : (e.status || "졸업");
                const schoolType = e.schoolType || "";
                const meta = [schoolType, degreeType, status].filter(Boolean).join(" · ");
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", padding: "14px 18px",
                    background: "white", borderRadius: 14,
                    border: "1.5px solid #F1F5F9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: "#EFF6FF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginRight: 14, flexShrink: 0,
                    }}>
                      <GraduationCap size={20} color="#3B82F6" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{nameStr}</div>
                      <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>{meta}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 포트폴리오 섹션 */}
          <div ref={sectionRefs.portfolio} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>포트폴리오</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {portfolioItems.map((p, i) => (
                <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{
                    height: 110, background: PORTFOLIO_BG[i % PORTFOLIO_BG.length],
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                  }}>
                    <img src={PORTFOLIO_IMGS[i % PORTFOLIO_IMGS.length]} alt="" style={{ height: 80, objectFit: "contain", opacity: 0.9 }} />
                    {p.rep && (
                      <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontWeight: 800, color: "#1D4ED8", background: "white", borderRadius: 6, padding: "2px 8px", fontFamily: F }}>대표</span>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", background: "white" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    {p.category && <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, marginBottom: 6 }}>{p.category}</div>}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                      {(p.tech || p.tags || []).map(t => (
                        <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", background: "#EFF6FF", borderRadius: 5, padding: "2px 8px", fontFamily: F }}>{t}</span>
                      ))}
                    </div>
                    {p.desc && <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: F, lineHeight: 1.5 }}>{p.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 평가 섹션 */}
          <div ref={sectionRefs.reviews} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: F, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1 }}>평가</p>
            <div>
              {/* 요약 카드 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 28,
                background: "#F8FAFC", borderRadius: 16, padding: "20px 24px",
                border: "1.5px solid #E2E8F0", marginBottom: 20,
              }}>
                <div style={{ textAlign: "center", minWidth: 70 }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: "#1E293B", fontFamily: F, lineHeight: 1 }}>{rating.toFixed(1)}</div>
                  <div style={{ fontSize: 13, color: "#F59E0B", marginTop: 4 }}>{"★".repeat(Math.round(rating))}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>{partner.contractCount ?? reviews.length}건 평가</div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "전문성",    value: partner.ratingBreakdown?.expertise     ?? 5.0 },
                    { label: "일정 준수", value: partner.ratingBreakdown?.schedule      ?? 4.8 },
                    { label: "소통 능력", value: partner.ratingBreakdown?.communication ?? 4.9 },
                    { label: "적극성",    value: partner.ratingBreakdown?.proactivity   ?? 4.9 },
                  ].map(rb => (
                    <div key={rb.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{rb.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", fontFamily: F }}>{rb.value.toFixed(1)}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: "#E2E8F0" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #93C5FD, #3B82F6)", width: `${(rb.value / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 리뷰 카드 목록 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map((r, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 14, padding: "18px 22px", border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>
                        {r.reviewer || r.client || "클라이언트"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#F59E0B", fontFamily: F }}>★ {(r.rating ?? 5).toFixed(1)}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F }}>{r.date}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.6 }}>
                      {r.comment || r.review}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── 하단 푸터 ─────────────────────────────── */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid #F1F5F9",
          background: "white", flexShrink: 0, display: "flex", gap: 10,
        }}>
          {onReject ? (
            <button
              onClick={() => { onClose(); onReject(); }}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12,
                border: "1px solid #FECACA", background: "#FEF2F2",
                color: "#EF4444", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: F, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
              onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}
            >
              {partner?.applicationId ? "지원 거절하기" : "제안 거절하기"}
            </button>
          ) : (
            <button
              onClick={() => { onClose(); navigate("/partner_profile_view", { state: { partner } }); }}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12,
                border: "1.5px solid #BFDBFE", background: "#EFF6FF",
                color: "#1e3a5f", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: F, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
              onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"}
            >
              프로필 전체 보기 →
            </button>
          )}
          <button style={{
            flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)",
            color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F,
          }} onClick={() => { onClose(); onPropose?.(partner); }}>
            {partner?.applicationId ? "지원 수락하기" : "협업 제안하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
