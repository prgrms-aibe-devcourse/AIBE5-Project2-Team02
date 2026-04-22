import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header_partner from "../components/Header_partner";
import PartnerBannerCard from "../components/PartnerBannerCard";
import { portfolioApi } from "../api";
import { toPortfolioEditorSeed, toPortfolioRequest } from "../lib/portfolio";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const PRIMARY_GRAD = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)";

/* ── 왼쪽 사이드바 섹션 ───────────────────────────────────── */
const SIDEBAR_SECTIONS = [
  {
    items: [
      { key: "schedule",  label: "내 스케줄 관리" },
      { key: "income",    label: "수입/정산 관리" },
      { key: "interests", label: "관심 프로젝트/파트너" },
      { key: "guarantee", label: "데브 브릿지 안심 계약" },
    ],
  },
  {
    title: "지원 내역",
    items: [
      { key: "apply_active", label: "지원 중" },
      { key: "apply_done",   label: "지원 종료" },
    ],
  },
  {
    title: "미팅",
    items: [
      { key: "free_meeting",     label: "자유 미팅" },
      { key: "contract_meeting", label: "계약 세부 협의 미팅" },
    ],
  },
  {
    title: "진행 중인 프로젝트",
    items: [
      { key: "project_manage", label: "프로젝트 진행 관리" },
    ],
  },
  {
    title: "완료한 프로젝트",
    items: [
      { key: "evaluation",    label: "평가 대기 프로젝트" },
      { key: "portfolio_add", label: "포트폴리오 추가 관리" },
    ],
  },
];


/* ── 섹션 토글 정의 ─────────────────────────────────────── */
const SECTION_DEFS = [
  { key: "basicInfo",     label: "프로젝트 기본 정보" },
  { key: "workContent",   label: "프로젝트 업무 내용" },
  { key: "thumbnail",     label: "썸네일/영상" },
  { key: "githubUrl",     label: "github repository url" },
  { key: "vision",        label: "프로젝트 경험/비전 설명" },
  { key: "coreFeatures",  label: "코어 개발 기능" },
  { key: "devHighlights", label: "개발 하이라이트" },
  { key: "techStack",     label: "사용한 기술 스택" },
  { key: "otherUrl",      label: "기타 url 추가" },
];

/* ── 섹션 아이콘 (파란 그라데이션 박스) ──────────────────── */
function SectionIcon({ children }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 11,
      background: "linear-gradient(135deg, #3B82F6, #6366F1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

/* ── 섹션 카드 ───────────────────────────────────────────── */
function SectionCard({ icon, title, headerExtra, children }) {
  return (
    <div style={{
      background: "white", borderRadius: 14,
      border: "1.5px solid #E8EDF2",
      padding: "22px 26px", marginBottom: 14,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {icon}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F, margin: 0 }}>{title}</h3>
        </div>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}

/* ── 텍스트 입력 ─────────────────────────────────────────── */
function TInput({ label, value, onChange, placeholder, icon, half }) {
  return (
    <div style={{ marginBottom: 14, flex: half ? 1 : undefined }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", fontFamily: F, marginBottom: 6 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }}>{icon}</div>}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: icon ? "12px 14px 12px 38px" : "12px 16px",
            border: "1.5px solid #E2E8F0", borderRadius: 10,
            fontSize: 14, fontFamily: F, color: "#374151",
            outline: "none", background: "white", transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "#93C5FD"}
          onBlur={e => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>
    </div>
  );
}

/* ── 텍스트에어리어 ───────────────────────────────────────── */
function TArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", fontFamily: F, marginBottom: 6 }}>{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "12px 16px",
          border: "1.5px solid #E2E8F0", borderRadius: 10,
          fontSize: 14, fontFamily: F, color: "#374151",
          outline: "none", background: "white", resize: "vertical",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#93C5FD"}
        onBlur={e => e.target.style.borderColor = "#E2E8F0"}
      />
    </div>
  );
}

/* ── 기본 프로젝트 데이터 ─────────────────────────────────── */
const defaultProject = {
  title: "",
  period: "",
  role: "",
  thumbnailFile: null,
  thumbnailPreview: null,
  workContent: "",
  vision: "",
  coreFeatures: [
    { id: 1, title: "Real-time Synchronization", desc: "WebSocket integration for instant data updates across all users." },
    { id: 2, title: "AI-Powered Insights", desc: "Automated data analysis using machine learning models." },
  ],
  technicalChallenge: "",
  solution: "",
  techTags: ["React", "Tailwind CSS", "Node.js"],
  githubUrl: "",
  liveUrl: "",
  videoUrl: "",
  sections: {
    basicInfo: true,
    workContent: true,
    thumbnail: true,
    githubUrl: true,
    vision: true,
    coreFeatures: true,
    devHighlights: true,
    techStack: true,
    otherUrl: true,
  },
};

/* ── 아이콘 SVG 모음 ─────────────────────────────────────── */
const IC = {
  eye:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  info:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  text:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  star:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  bulb:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  code:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  cal:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  link:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  globe:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  trash:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  grid:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  bolt:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  apps:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
};

/* ── 포트폴리오에 추가된 프로젝트 목록 (대시보드에서 토글 ON) ──── */
const PORTFOLIO_PROJECTS_DEFAULT = [];

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function PortfolioDetailEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const returnTo = location.state?.returnTo || "/partner_dashboard";

  const initialProjects = location.state?.addedProjects?.length
    ? location.state.addedProjects.map((item) => toPortfolioEditorSeed(item))
    : PORTFOLIO_PROJECTS_DEFAULT;

  const initialId = location.state?.projectId || initialProjects[0]?.id || null;
  const [portfolioProjects, setPortfolioProjects] = useState(initialProjects);
  const [selectedProjId, setSelectedProjId] = useState(initialId);
  const [projDataMap, setProjDataMap] = useState(() => {
    const map = {};
    initialProjects.forEach((item) => {
      map[item.id] = {
        ...defaultProject,
        ...item,
        title: item.title,
        techTags: item.tags?.map((tag) => String(tag).replace(/^#/, "")) || defaultProject.techTags,
      };
    });
    return map;
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    portfolioApi.myList()
      .then((items) => {
        if (!alive) return;
        const fromServer = (items || []).map((item) => toPortfolioEditorSeed(item, { sourceKey: item.sourceKey }));
        if (initialProjects.length === 0) {
          setPortfolioProjects(fromServer);
          setSelectedProjId((current) => current || location.state?.projectId || fromServer[0]?.id || null);
        }
        setProjDataMap((prev) => {
          const next = { ...prev };
          fromServer.forEach((item) => {
            const serverItem = items.find((s) => s.sourceKey === item.sourceKey) || {};
            // sections가 비어있거나 모든 키가 false면 defaultProject.sections로 fallback (전부 ON)
            const hasAnyEnabledSection = serverItem.sections
              && typeof serverItem.sections === "object"
              && Object.values(serverItem.sections).some(Boolean);
            const mergedSections = hasAnyEnabledSection
              ? { ...defaultProject.sections, ...serverItem.sections }
              : { ...defaultProject.sections };
            // coreFeatures가 빈 배열이면 defaultProject.coreFeatures 사용
            const mergedCoreFeatures = Array.isArray(serverItem.coreFeatures) && serverItem.coreFeatures.length > 0
              ? serverItem.coreFeatures
              : defaultProject.coreFeatures;
            next[item.id] = {
              ...defaultProject,
              ...item,
              ...serverItem,
              sections: mergedSections,
              coreFeatures: mergedCoreFeatures,
              techTags: (serverItem.techTags && serverItem.techTags.length > 0)
                ? serverItem.techTags
                : (item.tags?.map((tag) => String(tag).replace(/^#/, "")) || []),
            };
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selectedProjId && portfolioProjects.length > 0) {
      setSelectedProjId(portfolioProjects[0].id);
    }
  }, [portfolioProjects, selectedProjId]);

  useEffect(() => {
    if (initialProjects.length === 0) return;
    setPortfolioProjects(initialProjects);
    setProjDataMap((prev) => {
      const next = { ...prev };
      initialProjects.forEach((item) => {
        next[item.id] = {
          ...defaultProject,
          ...item,
          ...(next[item.id] || {}),
          techTags: next[item.id]?.techTags || item.tags?.map((tag) => String(tag).replace(/^#/, "")) || [],
        };
      });
      return next;
    });
  }, [location.state?.addedProjects]);

  const proj = projDataMap[selectedProjId] || defaultProject;
  const upd  = (key, val) => setProjDataMap(m => ({ ...m, [selectedProjId]: { ...m[selectedProjId], [key]: val } }));
  const updS = (key, val) => setProjDataMap(m => ({ ...m, [selectedProjId]: { ...m[selectedProjId], sections: { ...m[selectedProjId].sections, [key]: val } } }));

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => upd("thumbnailPreview", e.target.result);
    reader.readAsDataURL(file);
    upd("thumbnailFile", file.name);
  };

  const addFeature = () => upd("coreFeatures", [...proj.coreFeatures, { id: Date.now(), title: "", desc: "" }]);
  const removeFeature = (id) => upd("coreFeatures", proj.coreFeatures.filter(f => f.id !== id));
  const updateFeature = (id, key, val) => upd("coreFeatures", proj.coreFeatures.map(f => f.id === id ? { ...f, [key]: val } : f));

  const addTag = () => {
    const tag = window.prompt("기술 태그를 입력하세요:");
    if (tag?.trim()) upd("techTags", [...proj.techTags, tag.trim()]);
  };
  const removeTag = (i) => upd("techTags", proj.techTags.filter((_, idx) => idx !== i));

  const handlePreview = () => navigate("/portfolio_project_preview", { state: { fromEditor: true, project: proj } });
  const handleSave = async () => {
    if (!selectedProjId) return;
    try {
      setSaving(true);
      const current = projDataMap[selectedProjId] || {};
      await portfolioApi.upsertBySource(selectedProjId, toPortfolioRequest({
        ...current,
        sourceKey: selectedProjId,
        sourceProjectId: current.sourceProjectId ?? portfolioProjects.find((item) => item.id === selectedProjId)?.sourceProjectId ?? null,
      }));
      alert("포트폴리오가 저장되었습니다.");
      navigate(returnTo, { state: { activeTab: "portfolio_add" } });
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "포트폴리오 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const s = proj.sections;
  const showTechLinks = s.techStack || s.githubUrl || s.otherUrl;
  const showNarrative = s.workContent || s.vision;

  return (
    <div style={{ minHeight: "100vh", background: "#EFF4F9", fontFamily: F }}>
      <Header_partner />

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px 60px" }}>
        <PartnerBannerCard activePage="dashboard" />

        {/* ─── 3단 레이아웃 ─── */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginLeft: -38, marginRight: -38 }}>

          {/* ① 사이드바 네비 + 포트폴리오 구성 항목 토글 (세로 스택) */}
          <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 88, alignSelf: "flex-start" }}>

            {/* 네비게이션 */}
            <div style={{
              background: "white", borderRadius: 16,
              padding: "12px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {SIDEBAR_SECTIONS.map((sec, si) => (
                <div key={si}>
                  {sec.title && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", padding: "10px 14px 4px", fontFamily: F, textTransform: "uppercase" }}>
                      {sec.title}
                    </div>
                  )}
                  {sec.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => navigate("/partner_dashboard", { state: { activeTab: item.key } })}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 14px", borderRadius: 9, border: "none",
                        background: item.key === "portfolio_add" ? "#EFF6FF" : "transparent",
                        color: item.key === "portfolio_add" ? "#3B82F6" : "#475569",
                        fontSize: 13, fontWeight: item.key === "portfolio_add" ? 700 : 500,
                        cursor: "pointer", fontFamily: F, transition: "all 0.15s", marginBottom: 1,
                      }}
                      onMouseEnter={e => { if (item.key !== "portfolio_add") e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { if (item.key !== "portfolio_add") e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

          </div>

          {/* ② 포트폴리오 추가 프로젝트 + 구성항목 */}
          <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 88, alignSelf: "flex-start" }}>

          {/* 포트폴리오 추가된 프로젝트 목록 */}
          <div style={{
            background: "white", borderRadius: 16,
            padding: "16px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            maxHeight: "calc(55vh)", overflowY: "auto",
          }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", fontFamily: F }}>포트폴리오 추가 프로젝트</span>
              <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, margin: "4px 0 0" }}>프로젝트를 선택해 세부 내용을 작성하세요</p>
            </div>
            <div style={{ height: 1, background: "#F1F5F9", marginBottom: 10 }} />
            {loading ? (
              <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, padding: "8px 4px" }}>불러오는 중...</div>
            ) : ["진행 중", "완료"].map(group => {
              const groupProjects = portfolioProjects.filter(p => p.group === group);
              if (!groupProjects.length) return null;
              return (
                <div key={group} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", fontFamily: F, textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
                    {group}
                  </div>
                  {groupProjects.map(p => {
                    const isActive = selectedProjId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProjId(p.id)}
                        style={{
                          padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 6,
                          border: `1.5px solid ${isActive ? "#BFDBFE" : "#F1F5F9"}`,
                          background: isActive ? "#EFF6FF" : "#FAFBFC",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "#FAFBFC"; e.currentTarget.style.borderColor = "#F1F5F9"; } }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: p.badgeBg, color: p.badgeColor, fontFamily: F, flexShrink: 0, whiteSpace: "nowrap" }}>
                            {p.badge}
                          </span>
                          {isActive && (
                            <span style={{ fontSize: 10, color: "#3B82F6", fontWeight: 700, fontFamily: F }}>편집 중</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? "#1E40AF" : "#1E293B", fontFamily: F, margin: "0 0 5px", lineHeight: 1.4 }}>
                          {p.title}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {p.tags.map(t => (
                            <span key={t} style={{ fontSize: 10, color: "#64748B", background: "#F1F5F9", borderRadius: 4, padding: "1px 6px", fontFamily: F }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

            {/* 포트폴리오 구성 항목 토글 */}
            <div style={{
              background: "white", borderRadius: 16,
              padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {IC.grid}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", fontFamily: F }}>포트폴리오 구성 항목</span>
              </div>
              <div style={{ height: 1, background: "#F1F5F9", marginBottom: 8 }} />
              {SECTION_DEFS.map(sec => (
                <div key={sec.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 2px" }}>
                  <span style={{ fontSize: 11, color: "#374151", fontFamily: F, flex: 1, lineHeight: 1.4 }}>{sec.label}</span>
                  <div
                    onClick={() => updS(sec.key, !s[sec.key])}
                    style={{
                      width: 36, height: 20, borderRadius: 99, flexShrink: 0, marginLeft: 6,
                      background: s[sec.key]
                        ? "linear-gradient(135deg, #BAE6FD 0%, #C7D2FE 100%)"
                        : "#CBD5E1",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 2,
                      left: s[sec.key] ? "auto" : 2,
                      right: s[sec.key] ? 2 : "auto",
                      width: 16, height: 16, borderRadius: "50%",
                      background: s[sec.key] ? "#3B82F6" : "white",
                      boxShadow: s[sec.key]
                        ? "0 1px 4px rgba(59,130,246,0.4)"
                        : "0 1px 3px rgba(0,0,0,0.25)",
                      transition: "left 0.2s, right 0.2s, background 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {s[sec.key] && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ③ 에디터 콘텐츠 */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* 페이지 헤더 카드 */}
            <div style={{
              background: "white", borderRadius: 14, border: "1.5px solid #E8EDF2",
              padding: "20px 26px", marginBottom: 14,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", fontFamily: F, margin: "0 0 5px" }}>
                  포트폴리오 상세 내용 작성
                </h2>
                <p style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, margin: 0 }}>
                  {portfolioProjects.find(p => p.id === selectedProjId)?.title || "Curate your project narrative and showcase your technical expertise."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button
                  onClick={handlePreview}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 18px", borderRadius: 9,
                    border: "1.5px solid #E2E8F0", background: "white",
                    color: "#374151", fontSize: 13, fontWeight: 600, fontFamily: F,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.color = "#3B82F6"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#374151"; }}
                >
                  {IC.eye} 미리보기
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", borderRadius: 9,
                    border: "none", background: PRIMARY_GRAD,
                    color: "white", fontSize: 13, fontWeight: 700, fontFamily: F,
                    cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.45)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.3)"}
                >
                  {IC.save} {saving ? "저장 중..." : "변경 저장하기"}
                </button>
              </div>
            </div>

            {/* ─ 1. Basic Information ─ */}
            {s.basicInfo && (
              <SectionCard title="Basic Information" icon={<SectionIcon>{IC.info}</SectionIcon>}>
                <TInput label="Project Title" value={proj.title} onChange={v => upd("title", v)} placeholder="Enter project name" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <TInput label="Project Period" value={proj.period} onChange={v => upd("period", v)} placeholder="e.g., 2023.10 - 2024.02" icon={IC.cal} />
                  <TInput label="Your Role" value={proj.role} onChange={v => upd("role", v)} placeholder="e.g., Lead Frontend Developer" icon={IC.user} />
                </div>
              </SectionCard>
            )}

            {/* ─ 2. Thumbnail / Video Upload ─ */}
            {s.thumbnail && (
              <SectionCard title="Thumbnail/Video Upload" icon={<SectionIcon>{IC.upload}</SectionIcon>}>
                {/* 영상 URL 입력란 (YouTube, Google Drive 등) */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", fontFamily: F, marginBottom: 6, letterSpacing: "0.02em" }}>
                    Video URL <span style={{ color: "#94A3B8", fontWeight: 500 }}>(YouTube · Google Drive · Vimeo 링크)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex", alignItems: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </span>
                    <input
                      type="url"
                      value={proj.videoUrl || ""}
                      onChange={e => upd("videoUrl", e.target.value)}
                      placeholder="https://drive.google.com/file/d/..../view"
                      style={{
                        width: "100%", padding: "10px 14px 10px 38px",
                        border: "1.5px solid #E2E8F0", borderRadius: 10,
                        fontSize: 14, color: "#1E293B", fontFamily: F,
                        background: "#FFFFFF", outline: "none",
                        transition: "border-color 0.15s", boxSizing: "border-box",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
                      onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                    />
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  style={{
                    border: `2px dashed ${dragOver ? "#3B82F6" : "#CBD5E1"}`,
                    borderRadius: 12, padding: "40px 20px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    cursor: "pointer", background: dragOver ? "#EFF6FF" : "#F8FAFC",
                    transition: "all 0.15s", textAlign: "center",
                  }}
                >
                  {proj.thumbnailPreview ? (
                    <img src={proj.thumbnailPreview} alt="preview" style={{ maxHeight: 120, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: proj.thumbnailFile ? "#22C55E" : "#374151", fontFamily: F, margin: "0 0 4px" }}>
                      {proj.thumbnailFile ? proj.thumbnailFile : "Drag and drop your thumbnail or video here, or click to upload"}
                    </p>
                    <p style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, margin: 0 }}>MP4, MOV, JPG, PNG (Max 50MB)</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              </SectionCard>
            )}

            {/* ─ 3. Narrative & Vision ─ */}
            {showNarrative && (
              <SectionCard title="Narrative & Vision" icon={<SectionIcon>{IC.text}</SectionIcon>}>
                {s.workContent && (
                  <TArea label="Brief Description (Work Content)" value={proj.workContent} onChange={v => upd("workContent", v)} placeholder="A concise summary of what this project is..." rows={3} />
                )}
                {s.vision && (
                  <TArea label="Creative Vision & Experience" value={proj.vision} onChange={v => upd("vision", v)} placeholder="Explain the 'Why' behind your project. What problem did you solve? What was the inspiration?" rows={5} />
                )}
              </SectionCard>
            )}

            {/* ─ 4. Core Features ─ */}
            {s.coreFeatures && (
              <SectionCard
                title="Core Features"
                icon={<SectionIcon>{IC.star}</SectionIcon>}
                headerExtra={
                  <button
                    onClick={addFeature}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", borderRadius: 8,
                      border: "1.5px solid #DBEAFE", background: "#EFF6FF",
                      color: "#3B82F6", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
                    }}
                  >
                    + Add Feature
                  </button>
                }
              >
                {proj.coreFeatures.length === 0 && (
                  <p style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, textAlign: "center", padding: "20px 0" }}>
                    "+ Add Feature" 버튼으로 기능을 추가하세요.
                  </p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {proj.coreFeatures.map((feat, i) => (
                    <div key={feat.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      border: "1.5px solid #E8EDF2", background: "#FAFBFC",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: "#F1F5F9", border: "1.5px solid #E2E8F0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {i % 2 === 0 ? IC.bolt : IC.apps}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={feat.title}
                          onChange={e => updateFeature(feat.id, "title", e.target.value)}
                          placeholder="Feature title"
                          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 3 }}
                        />
                        <input
                          type="text"
                          value={feat.desc}
                          onChange={e => updateFeature(feat.id, "desc", e.target.value)}
                          placeholder="Brief description..."
                          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#64748B", fontFamily: F }}
                        />
                      </div>
                      <button
                        onClick={() => removeFeature(feat.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, flexShrink: 0, marginTop: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}
                      >
                        {IC.trash}
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ─ 5. Development Highlights ─ */}
            {s.devHighlights && (
              <SectionCard title="Development Highlights" icon={<SectionIcon>{IC.bulb}</SectionIcon>}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E8EDF2", padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", fontFamily: F, marginBottom: 10, textTransform: "uppercase" }}>
                    Technical Challenge
                  </div>
                  <textarea
                    rows={4}
                    value={proj.technicalChallenge}
                    onChange={e => upd("technicalChallenge", e.target.value)}
                    placeholder="Describe a difficult problem you faced..."
                    style={{ width: "100%", boxSizing: "border-box", border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: F, color: "#374151", resize: "vertical" }}
                  />
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E8EDF2", padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.08em", fontFamily: F, marginBottom: 10, textTransform: "uppercase" }}>
                    Your Solution
                  </div>
                  <textarea
                    rows={4}
                    value={proj.solution}
                    onChange={e => upd("solution", e.target.value)}
                    placeholder="How did you overcome it technicaly?"
                    style={{ width: "100%", boxSizing: "border-box", border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: F, color: "#374151", resize: "vertical" }}
                  />
                </div>
              </SectionCard>
            )}

            {/* ─ 6. Tech Stack & Links ─ */}
            {showTechLinks && (
              <SectionCard title="Tech Stack & Links" icon={<SectionIcon>{IC.code}</SectionIcon>}>
                {s.techStack && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", fontFamily: F, marginBottom: 8 }}>Technologies Used</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {proj.techTags.map((tag, i) => (
                        <span key={i} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", borderRadius: 999,
                          background: "#F0F9FF", border: "1px solid #BAE6FD",
                          fontSize: 13, fontWeight: 500, color: "#0369A1", fontFamily: F,
                        }}>
                          {tag}
                          <span
                            onClick={() => removeTag(i)}
                            style={{ cursor: "pointer", color: "#94A3B8", fontWeight: 700, fontSize: 14, lineHeight: 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}
                          >×</span>
                        </span>
                      ))}
                      <button
                        onClick={addTag}
                        style={{
                          padding: "5px 14px", borderRadius: 999,
                          border: "1.5px dashed #CBD5E1", background: "transparent",
                          fontSize: 13, color: "#64748B", fontFamily: F, cursor: "pointer",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#93C5FD"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD5E1"}
                      >
                        + Add Tag
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: (s.githubUrl && s.otherUrl) ? "1fr 1fr" : "1fr", gap: 14 }}>
                  {s.githubUrl && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", fontFamily: F, marginBottom: 6 }}>GitHub Repository</label>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>{IC.link}</div>
                        <input type="text" value={proj.githubUrl} onChange={e => upd("githubUrl", e.target.value)} placeholder="https://github.com/..."
                          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 36px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: F, color: "#374151", outline: "none", background: "white" }}
                          onFocus={e => e.target.style.borderColor = "#93C5FD"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                      </div>
                    </div>
                  )}
                  {s.otherUrl && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", fontFamily: F, marginBottom: 6 }}>Live Demo / Other Links</label>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>{IC.globe}</div>
                        <input type="text" value={proj.liveUrl} onChange={e => upd("liveUrl", e.target.value)} placeholder="https://project-demo.com"
                          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 36px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: F, color: "#374151", outline: "none", background: "white" }}
                          onFocus={e => e.target.style.borderColor = "#93C5FD"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* 전체 꺼진 경우 안내 */}
            {!s.basicInfo && !s.thumbnail && !showNarrative && !s.coreFeatures && !s.devHighlights && !showTechLinks && (
              <div style={{
                background: "white", borderRadius: 14, border: "1.5px solid #E8EDF2",
                padding: "60px 40px", textAlign: "center",
              }}>
                <p style={{ fontSize: 15, color: "#94A3B8", fontFamily: F, margin: 0 }}>
                  왼쪽 패널에서 섹션 토글을 켜서 내용을 작성하세요.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}