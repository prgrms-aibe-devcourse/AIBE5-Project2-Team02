import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2, Heart } from "lucide-react";
import AppHeader from "../components/AppHeader";
import { CONTRACT_MODAL_BY_KEY } from "../components/ContractModals";
import { projectsApi, applicationsApi } from "../api";
import useStore from "../store/useStore";
import { matchApi } from "../api/match.api";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const PRIMARY = "#3B82F6";
const TEAL = "#0CA5A0";

const EXAMPLES = [
  "AI 챗봇으로 고객 문의를 자동화 하고 싶습니다.",
  "중개 플랫폼을 만들고 싶어요. 예약·결제 기능 통합 사례와 비용을 알고 싶습니다.",
  "AI 추천 시스템을 활용해 고객별 맞춤형 상품을 제안하고 싶습니다.",
];
const HIGHLIGHT_KEYWORDS = [["AI 챗봇", "자동화"], ["중개 플랫폼", "예약·결제"], ["AI 추천 시스템", "맞춤형"]];

const SERVICE_FIELDS = ["AI", "커머스", "웹사이트", "디자인/기획", "유지보수", "핀테크", "SaaS", "모바일", "클라우드"];
const PRIMARY_GRAD = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)";

const GRADE_BADGE = {
  diamond: { label: "💎 다이아몬드", color: "#1E3A8A", bg: "#DBEAFE", border: "#93C5FD" },
  platinum: { label: "🌙 플래티넘",  color: "#4C1D95", bg: "#EDE9FE", border: "#C4B5FD" },
  gold:     { label: "🟡 골드",      color: "#78350F", bg: "#FEF3C7", border: "#FCD34D" },
  silver:   { label: "⚫ 실버",      color: "#374151", bg: "#F1F5F9", border: "#CBD5E1" },
};

const GRADE_LIST = [
  { key: "diamond", label: "다이아몬드", icon: "💎" },
  { key: "platinum", label: "플래티넘",  icon: "🌙" },
  { key: "gold",    label: "골드",      icon: "🟡" },
  { key: "silver",  label: "실버",      icon: "⚫" },
];

const CLIENT_VERIF_LIST = [
  { key: "본인인증 완료",   icon: "✅" },
  { key: "사업자등록 완료", icon: "🏢" },
  { key: "평가 우수",       icon: "🏅" },
];

const LEVEL_OPTIONS = ["전체", "주니어", "미들", "시니어"];
const PAGE_SIZE_OPTIONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const matchColor = (n) => n >= 90 ? "#10B981" : n >= 70 ? "#3B82F6" : "#F59E0B";

export default function ProjectSearch() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const loadInterests = useStore(s => s.loadInterests);

  // 마운트 시 찜 목록 동기화 (하트 초기 상태용)
  useEffect(() => { loadInterests(); }, [loadInterests]);

  useEffect(() => {
    let mounted = true;
    projectsApi.list()
      .then((data) => {
        if (!mounted) return;
        const normalized = data.map((project) => ({
          ...project,
          avatarColor: project.avatarColor || "#60A5FA",
          clientId: project.clientId || `client_${project.id}`,
          slogan: project.slogan || project.title || "프로젝트",
          sloganSub: project.sloganSub || `${project.serviceField || "기타"} 프로젝트`,
          desc: project.desc || "",
          tags: Array.isArray(project.tags) ? project.tags : [],
          serviceField: project.serviceField || "기타",
          workPref: project.workPref || "협의",
          priceType: project.priceType || "유료",
          remote: Boolean(project.remote),
          level: project.level || "전체",
          grade: project.grade || "silver",
          match: project.match ?? 0,
          price: project.price || "협의",
          period: project.period || "협의",
          verifications: Array.isArray(project.verifications) ? project.verifications : [],
        }));
        setAllProjects(normalized);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("[ProjectSearch] 프로젝트 로딩 실패:", err);
        if (mounted) setLoadError("프로젝트 데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [searchParams] = useSearchParams();
  const initialField = searchParams.get("field");
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery]               = useState(initialQuery); // 상단 AI 검색용
  const [nameQuery, setNameQuery]       = useState("");           // 사이드바: 프로젝트명 키워드 검색
  // 예산 슬라이더 최대값. 이 값이면 "무제한" 으로 간주하여 필터를 적용하지 않음.
  const BUDGET_MAX = 30000;
  const didAutoSearch = useRef(false);
  const [fields, setFields]             = useState(initialField ? [initialField] : []);
  const [budget, setBudget]             = useState(30000);
  const [priceType, setPriceType]       = useState([]);
  const [grades, setGrades]             = useState([]);
  const [clientVerifs, setClientVerifs] = useState([]);
  const [level, setLevel]               = useState("전체");
  const [techInput, setTechInput]       = useState("");
  const [techs, setTechs]               = useState([]);
  const [remoteOnly, setRemoteOnly]     = useState(false);
  const [sort, setSort]                 = useState("최신순");
  const [sortOpen, setSortOpen]         = useState(false);
  const [page, setPage]                 = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applied, setApplied]           = useState(
    initialField ? { fields: [initialField], budget: 30000, priceType: [], grades: [], clientVerifs: [], level: "전체", techs: [], remoteOnly: false, query: "" } : null
  );

  /* AI 매칭 점수 */
  const [aiScores, setAiScores] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const applyFilters = () => {
    const snapshot = { fields, budget, priceType, grades, clientVerifs, level, techs, remoteOnly, query, nameQuery };
    setApplied(snapshot);
    setPage(1);

    const trimmed = (query || "").trim();
    if (!trimmed) { setAiScores({}); setAiError(null); return; }
    const candidates = allProjects.filter(p => matchesFilter(p, snapshot));
    if (candidates.length === 0) { setAiScores({}); return; }
    // 신규(id 큰 것) 우선으로 50개 cap → 방금 등록한 프로젝트도 AI 후보에 포함되게
    const candidateIds = [...candidates].sort((a, b) => b.id - a.id).slice(0, 50).map(p => p.id);

    setAiLoading(true); setAiError(null);
    const minDelay = new Promise(resolve => setTimeout(resolve, 5000));
    Promise.all([matchApi.projects(trimmed, candidateIds), minDelay])
      .then(([arr]) => {
        const map = {};
        arr.forEach(s => { map[s.id] = { matchScore: s.matchScore, reasons: s.reasons || [] }; });
        setAiScores(map);
        if (Object.keys(map).length > 0) setSort("AI 추천순");
      })
      .catch((err) => {
        console.error("[ProjectSearch] AI 매칭 실패:", err);
        const message = err?.code === "ECONNABORTED"
          ? "AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요."
          : !err?.response
            ? "네트워크 연결이 불안정해요. 잠시 후 다시 시도해주세요."
            : "AI 매칭에 실패했어요. 잠시 후 다시 시도해주세요.";
        setAiError(message);
        setAiScores({});
      })
      .finally(() => setAiLoading(false));
  };

  useEffect(() => {
    if (allProjects.length > 0 && initialQuery && !didAutoSearch.current) {
      didAutoSearch.current = true;
      applyFilters();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects.length]);

  const resetFilters = () => {
    setFields([]); setBudget(30000); setPriceType([]);
    setGrades([]); setClientVerifs([]); setLevel("전체"); setTechs([]); setTechInput("");
    setRemoteOnly(false); setNameQuery(""); setApplied(null); setPage(1);
    setAiScores({}); setAiError(null);
  };

  const toggleField  = (f) => setFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleGrade  = (g) => setGrades(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const toggleVerif  = (v) => setClientVerifs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const addTech = (e) => {
    if (e.key === "Enter" && techInput.trim()) {
      setTechs(p => [...new Set([...p, techInput.trim()])]);
      setTechInput("");
    }
  };
  const removeTech = (t) => setTechs(p => p.filter(x => x !== t));
  const togglePrice = (pt) => setPriceType(p => p.includes(pt) ? p.filter(x => x !== pt) : [...p, pt]);

  /* 1차 필터 (재사용 가능). 자연어 query는 AI에 위임. */
  const matchesFilter = (p, applied) => {
    if (!applied) return true;
    const { fields: fs, grades: gs, clientVerifs: cvs, level: lv, techs: ts, budget: bg, remoteOnly: ro, priceType: pt, nameQuery: nq } = applied;
    const nqTrim = (nq || "").trim().toLowerCase();
    if (nqTrim) {
      const hay = `${p.title || ""} ${p.slogan || ""} ${p.clientId || ""}`.toLowerCase();
      if (!hay.includes(nqTrim)) return false;
    }
    if (fs.length && !fs.includes(p.serviceField)) return false;
    if (gs.length && !gs.includes(p.grade)) return false;
    if (cvs.length && !cvs.every(v => p.verifications.includes(v))) return false;
    if (lv !== "전체" && p.level !== lv) return false;
    if (ts.length && !ts.every(t => p.tags.some(tag => tag.toLowerCase().includes(t.toLowerCase())))) return false;
    const priceMin = p.budgetMin ?? NaN;
    // bg 가 슬라이더 최대값(=무제한)이면 예산 필터 미적용
    if (bg < BUDGET_MAX && !isNaN(priceMin) && priceMin > bg) return false;
    if (ro && !p.remote) return false;
    if (pt.length) {
      const isPaid = p.priceType === "유료";
      const wantFree = pt.includes("무료/팀모임");
      const wantPaid = pt.includes("유료");
      if (wantFree && !wantPaid && isPaid) return false;
      if (wantPaid && !wantFree && !isPaid) return false;
    }
    return true;
  };

  const filtered = allProjects.filter(p => matchesFilter(p, applied));

  const effectiveMatch = (p) => {
    const ai = aiScores[p.id];
    return ai ? ai.matchScore : (p.match ?? 0);
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "AI 추천순") return effectiveMatch(b) - effectiveMatch(a);
    if (sort === "최신순") return b.id - a.id;
    return effectiveMatch(b) - effectiveMatch(a);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const pageItems  = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", fontFamily: F }}>
      <AppHeader />

      <section style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #E0F2FE 35%, #F0F9FF 65%, #FAF5FF 100%)", padding: "56px 20px 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{
            fontSize: 38, fontWeight: 900, margin: "0 0 10px", fontFamily: F,
            background: "linear-gradient(90deg, #7DD3FC 0%, #38BDF8 25%, #818CF8 65%, #93C5FD 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>AI 맞춤 프로젝트 추천</h1>
          <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 32px", fontFamily: F, fontWeight: 600 }}>
            💡 필터 적용 후 질문하면, 행운이 알고리즘이 맞는 파트너를 더 딱맞게 잘 찾아드려요!
          </p>
          <div style={{ position: "relative", maxWidth: 680, margin: "0 auto 24px" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
              placeholder="어떤 프로젝트를 찾고 계신가요?"
              style={{ width: "100%", height: 62, borderRadius: 999, border: "1.5px solid #E2E8F0", padding: "0 74px 0 32px", fontSize: 16, fontFamily: F, outline: "none", boxSizing: "border-box", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", color: "#334155", backgroundColor: "white" }}
            />
            <button
              onClick={applyFilters}
              disabled={aiLoading}
              title={aiLoading ? "AI가 찾는 중..." : "검색"}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", border: "none", background: PRIMARY_GRAD, cursor: aiLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.40)", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
              onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(99,102,241,0.55)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.40)"; }}
            >{aiLoading
              ? <Loader2 size={20} color="white" className="animate-spin" />
              : <Search size={20} color="white" />}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 860, margin: "0 auto" }}>
            {EXAMPLES.map((ex, i) => (
              <div key={i} onClick={() => setQuery(ex)}
                style={{ background: "white", borderRadius: 14, padding: "18px 20px", textAlign: "left", cursor: "pointer", border: "1.5px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.18)"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
              >
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, background: "#F1F5F9", borderRadius: 5, padding: "2px 8px", display: "inline-block", marginBottom: 10, fontFamily: F }}>예시</span>
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, margin: 0, fontFamily: F }}>
                  {(() => { let txt = ex; const parts = []; const kws = HIGHLIGHT_KEYWORDS[i] || [];
                    kws.forEach(kw => { const idx = txt.indexOf(kw); if (idx >= 0) { if (idx > 0) parts.push(txt.slice(0, idx)); parts.push(<span key={kw} style={{ color: PRIMARY, fontWeight: 700 }}>{kw}</span>); txt = txt.slice(idx + kw.length); } });
                    if (txt) parts.push(txt); return parts; })()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* 필터 패널 */}
        <aside style={{ width: 280, flexShrink: 0, background: "white", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>필터</span>
            <button onClick={applyFilters}
              style={{ background: PRIMARY_GRAD, color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,0.30)", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.55)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(99,102,241,0.30)"}
            >필터 적용</button>
          </div>

          <FilterSection label="검색어">
            <div style={{ position: "relative" }}>
              <input value={nameQuery} onChange={e => setNameQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && applyFilters()} placeholder="프로젝트 검색..."
                style={{ width: "100%", height: 38, borderRadius: 8, border: "1.5px solid #E2E8F0", padding: "0 36px 0 12px", fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
              <Search size={15} color="#94A3B8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </FilterSection>

          <FilterSection label="서비스 분야">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SERVICE_FIELDS.map(f => (
                <button key={f} onClick={() => toggleField(f)}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${fields.includes(f) ? PRIMARY : "#E2E8F0"}`, background: fields.includes(f) ? PRIMARY : "white", color: fields.includes(f) ? "white" : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>
                  {f}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="예산 (비용)">
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13, color: TEAL, fontWeight: 700, fontFamily: F, marginBottom: 8 }}>{budget >= BUDGET_MAX ? "무제한" : `~ ${budget.toLocaleString()}만원`}</div>
            <input type="range" min={100} max={BUDGET_MAX} step={100} value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              style={{ width: "100%", accentColor: PRIMARY, cursor: "pointer" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {["무료/팀모임", "유료"].map(pt => (
                <button key={pt} onClick={() => togglePrice(pt)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${priceType.includes(pt) ? PRIMARY : "#E2E8F0"}`, background: priceType.includes(pt) ? "#EFF6FF" : "white", color: priceType.includes(pt) ? PRIMARY : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>
                  {pt}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="파트너 등급">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {GRADE_LIST.map(({ key, label, icon }) => (
                <button key={key} onClick={() => toggleGrade(key)}
                  style={{ padding: "8px 0", borderRadius: 8, border: `1.5px solid ${grades.includes(key) ? PRIMARY : "#E2E8F0"}`, background: grades.includes(key) ? "#EFF6FF" : "white", color: grades.includes(key) ? PRIMARY : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="클라이언트 검증">
            {CLIENT_VERIF_LIST.map(({ key, icon }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#334155", cursor: "pointer", marginBottom: 10, fontFamily: F }}>
                <input type="checkbox" checked={clientVerifs.includes(key)} onChange={() => toggleVerif(key)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY, cursor: "pointer" }} />
                {icon} {key}
              </label>
            ))}
          </FilterSection>

          <FilterSection label="경력 수준">
            <select value={level} onChange={e => setLevel(e.target.value)}
              style={{ width: "100%", height: 38, borderRadius: 8, border: "1.5px solid #E2E8F0", padding: "0 12px", fontSize: 14, fontFamily: F, outline: "none", cursor: "pointer", backgroundColor: "white", color: "#334155" }}>
              {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FilterSection>

          <FilterSection label="필수 기술 스택">
            <input value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={addTech}
              placeholder="기술 입력 후 Enter (예: Vue.js)"
              style={{ width: "100%", height: 38, borderRadius: 8, border: "1.5px solid #E2E8F0", padding: "0 12px", fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {techs.map(t => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EFF6FF", color: PRIMARY, borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600, fontFamily: F }}>
                  {t}<span onClick={() => removeTech(t)} style={{ cursor: "pointer", fontWeight: 900, color: "#94A3B8" }}>×</span>
                </span>
              ))}
            </div>
          </FilterSection>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 14, color: "#334155", fontFamily: F }}>원격 근무만 보기</span>
            <div onClick={() => setRemoteOnly(p => !p)}
              style={{ width: 44, height: 24, borderRadius: 999, background: remoteOnly ? PRIMARY : "#CBD5E1", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 3, left: remoteOnly ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </div>
          </div>

          <button onClick={resetFilters}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            필터 초기화
          </button>
        </aside>

        {/* 프로젝트 리스트 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 21.3, fontWeight: 900, fontFamily: F, background: PRIMARY_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>모든 프로젝트 탐색 </span>
              <span style={{ fontSize: 14, color: "#94A3B8", fontFamily: F }}>총 {sorted.length.toLocaleString()}개의 프로젝트가 있습니다</span>
              {aiLoading && (
                <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#3B82F6", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 999, padding: "4px 12px", fontFamily: F }}>
                  <Loader2 size={12} className="animate-spin" /> 행운이 AI가 찾는 중...
                </span>
              )}
              {!aiLoading && Object.keys(aiScores).length > 0 && (
                <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 700, color: "#0F766E", background: "#CCFBF1", border: "1px solid #5EEAD4", borderRadius: 999, padding: "4px 12px", fontFamily: F }}>✨ 행운이 AI 매칭 완료!</span>
              )}
              {aiError && (
                <span style={{ marginLeft: 12, fontSize: 12, color: "#EF4444", fontFamily: F }}>{aiError}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* 페이지당 개수 드롭다운 */}
              <div style={{ position: "relative" }}>
                <button onClick={() => { setPageSizeOpen(p => !p); setSortOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer", fontFamily: F }}>
                  {itemsPerPage}개 보기 ∨
                </button>
                {pageSizeOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 120 }}>
                    {PAGE_SIZE_OPTIONS.map(n => (
                      <div key={n} onClick={() => { setItemsPerPage(n); setPage(1); setPageSizeOpen(false); }}
                        style={{ padding: "11px 16px", fontSize: 14, fontFamily: F, color: itemsPerPage === n ? PRIMARY : "#334155", fontWeight: itemsPerPage === n ? 700 : 500, cursor: "pointer", background: itemsPerPage === n ? "#EFF6FF" : "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = itemsPerPage === n ? "#EFF6FF" : "transparent"}>
                        {n}개 보기
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 정렬 드롭다운 */}
              <div style={{ position: "relative" }}>
                <button onClick={() => { setSortOpen(p => !p); setPageSizeOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 14px", fontSize: 14, fontWeight: 600, color: PRIMARY, cursor: "pointer", fontFamily: F }}>
                  정렬: {sort} ∨
                </button>
                {sortOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 140 }}>
                    {["AI 추천순", "최신순", "필터 추천순"].map(s => (
                      <div key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                        style={{ padding: "11px 16px", fontSize: 14, fontFamily: F, color: sort === s ? PRIMARY : "#334155", fontWeight: sort === s ? 700 : 500, cursor: "pointer", background: sort === s ? "#EFF6FF" : "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = sort === s ? "#EFF6FF" : "transparent"}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedProject ? (
            <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 16, fontFamily: F }}>
                  프로젝트 정보를 불러오는 중...
                </div>
              ) : loadError ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#EF4444", fontSize: 15, fontFamily: F }}>
                  {loadError}
                </div>
              ) : pageItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 16, fontFamily: F }}>
                  조건에 맞는 프로젝트가 없습니다.
                </div>
              ) : pageItems.map(p => {
                const ai = aiScores[p.id];
                const merged = ai
                  ? { ...p, match: ai.matchScore, aiReasons: ai.reasons || [] }
                  : p;
                return <ProjectCard key={p.id} data={merged} onSelect={setSelectedProject} />;
              })}
            </div>
          )}

          {!selectedProject && totalPages > 1 && (() => {
            const half = 5;
            let s = Math.max(1, page - half);
            let e = Math.min(totalPages, s + 9);
            if (e - s < 9) s = Math.max(1, e - 9);
            const visPages = Array.from({ length: e - s + 1 }, (_, i) => s + i);
            return (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 40 }}>
                <PagBtn label="<" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                {visPages.map(n => (
                  <PagBtn key={n} label={n} onClick={() => setPage(n)} active={page === n} />
                ))}
                <PagBtn label=">" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}

/* ── 프로젝트 카드 ─────────────────────────────────────────── */
function ProjectCard({ data, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const g = GRADE_BADGE[data.grade] || GRADE_BADGE.silver;
  const initials = data.clientId.slice(0, 2).toUpperCase();
  const isPaid = data.priceType === "유료";
  const priceTag = isPaid
    ? { label: "유료", color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD" }
    : { label: "무료", color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" };

  // 찜 상태 (useStore 연동)
  const isLiked = useStore(s => s.interestedProjectIds.includes(data.id));
  const toggleLike = useStore(s => s.toggleProjectInterest);
  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(data.id).catch(() => {});
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 16,
        border: `1.5px solid ${hovered ? "#BFDBFE" : "#E2E8F0"}`,
        padding: "22px 26px",
        boxShadow: hovered ? "0 6px 24px rgba(59,130,246,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s", display: "flex", gap: 20, alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: g.color, background: g.bg, border: `1px solid ${g.border}`, borderRadius: 6, padding: "3px 10px", fontFamily: F, whiteSpace: "nowrap", flexShrink: 0 }}>
            {g.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: priceTag.color, background: priceTag.bg, border: `1px solid ${priceTag.border}`, borderRadius: 6, padding: "3px 10px", fontFamily: F, whiteSpace: "nowrap", flexShrink: 0 }}>
            {priceTag.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 10px", fontFamily: F, whiteSpace: "nowrap", flexShrink: 0 }}>
            {data.workPref}
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.title || data.slogan}
          </span>
        </div>

        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, margin: "0 0 12px", fontFamily: F }}>
          {data.slogan && data.slogan !== (data.title || "") ? data.slogan : data.sloganSub}
        </p>

        {/* AI 매칭 이유 (AI 검색 실제 수행될 때만) */}
        {Array.isArray(data.aiReasons) && (() => {
          const reasons = data.aiReasons.length > 0
            ? data.aiReasons
            : [
                `AI 매칭 점수 ${data.match}%`,
                ...(Array.isArray(data.tags) && data.tags.length > 0 ? [`핵심 기술: ${data.tags.slice(0, 2).join(", ")}`] : []),
                ...(data.serviceField ? [`${data.serviceField} 분야 적합`] : []),
              ].slice(0, 3);
          if (reasons.length === 0) return null;
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {reasons.map((r, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 700, color: "#0F766E",
                  background: "#CCFBF1", border: "1px solid #5EEAD4",
                  borderRadius: 999, padding: "3px 10px", fontFamily: F,
                }}>✨ {r}</span>
              ))}
            </div>
          );
        })()}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {data.tags.map(t => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#F1F5F9", borderRadius: 6, padding: "4px 10px", fontFamily: F }}>{t}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", background: "#EEF2FF", borderRadius: 999, padding: "4px 10px", fontFamily: F }}>{data.serviceField}</span>
          {data.verifications.map((v, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: "#059669", background: "#ECFDF5", borderRadius: 999, padding: "4px 10px", fontFamily: F }}>{v}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: data.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white", fontFamily: F, flexShrink: 0 }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", fontFamily: F }}>@{data.clientId}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: "right", minWidth: 180, position: "relative", alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
        {/* 찜 하트 */}
        <button
          onClick={handleLikeClick}
          title={isLiked ? "찜 해제" : "찜하기"}
          style={{
            position: "absolute", top: -4, right: -4,
            width: 34, height: 34, borderRadius: "50%",
            background: isLiked ? "#FEE2E2" : "#F8FAFC",
            border: `1.5px solid ${isLiked ? "#FCA5A5" : "#E2E8F0"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s", padding: 0,
            zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <Heart size={16} color={isLiked ? "#EF4444" : "#94A3B8"} fill={isLiked ? "#EF4444" : "none"} strokeWidth={2.2} />
        </button>
        {Array.isArray(data.aiReasons) && (
          <div style={{ fontSize: 14, fontWeight: 800, color: matchColor(data.match), marginBottom: 6, fontFamily: F, paddingRight: 42 }}>
            {data.match}% AI Match
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 900, color: "#3B82F6", fontFamily: F, marginBottom: 4, paddingRight: 42 }}>
          {data.price}
        </div>
        <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, paddingRight: 42 }}>
          기간: {data.period}
        </div>
        <button
          onClick={() => onSelect(data)}
          style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: "#EFF6FF", color: "#3B82F6", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.15s", marginTop: "auto" }}
          onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
          onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"}
        >
          상세보기
        </button>
      </div>
    </div>
  );
}

function FilterSection({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 12px", fontFamily: F }}>{label}</p>
      {children}
    </div>
  );
}

function PagBtn({ label, onClick, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${active ? PRIMARY : "#E2E8F0"}`, background: active ? PRIMARY : "white", color: active ? "white" : disabled ? "#CBD5E1" : "#334155", fontSize: 14, fontWeight: active ? 700 : 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, transition: "all 0.15s" }}>
      {label}
    </button>
  );
}

/* ── 섹션 타이틀 (ProjectDetail 외부에 선언) ───────────────── */
function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, background: PRIMARY_GRAD, borderRadius: 2 }} />
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{children}</h2>
    </div>
  );
}

/* ── 프로젝트 상세 ─────────────────────────────────────────── */
function ProjectDetail({ project: p, onBack }) {
  const { userRole } = useStore();
  const isPartner = userRole === "partner" || userRole === "PARTNER";
  const [showConfirm, setShowConfirm] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 서버에서 내 지원 내역을 가져와 이미 지원한 프로젝트인지 확인
  useEffect(() => {
    if (!isPartner || !p?.id) return;
    let alive = true;
    applicationsApi.myList()
      .then((list) => {
        if (!alive) return;
        const found = (list || []).some((a) => Number(a.projectId) === Number(p.id));
        setApplied(found);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [p?.id, isPartner]);

  const handleApply = async () => {
    if (!isPartner) {
      alert("파트너 계정으로 로그인해주세요.");
      return;
    }
    try {
      setSubmitting(true);
      await applicationsApi.apply(p.id, message?.trim() || null);
      setApplied(true);
      setShowConfirm(false);
      setMessage("");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "지원 실패");
    } finally {
      setSubmitting(false);
    }
  };
  const g = GRADE_BADGE[p.grade] || GRADE_BADGE.silver;
  const initials = p.clientId.slice(0, 2).toUpperCase();

  // workPref에 따른 파생 데이터
  const isOutsource = p.workPref === "외주";

  const requirements = [
    `${p.tags.slice(0, 2).join("/")} 등 관련 기술 실무 경험 ${p.level === "시니어" ? "3년 이상" : p.level === "미들" ? "2년 이상" : "1년 이상"}`,
    `${p.serviceField} 도메인 프로젝트 수행 경험 우대`,
    "원활한 커뮤니케이션 능력 보유자",
  ];
  const headcount = isOutsource
    ? "1명 (파트너)"
    : "2명 (프론트엔드 1, 백엔드 1)";
  const workStyle = p.remote
    ? (isOutsource ? "원격 외주 (온라인 협업)" : "원격 근무 (주 1회 오프라인 미팅 권장)")
    : (isOutsource ? "대면 외주 (방문 협의 포함)" : "상주 근무 (주 5일 현장 출근)");
  const deadline = "2026.04.30";

  // 외주 전용 추가 섹션
  const outsourceDetails = [
    `${p.slogan}을 위한 핵심 기능 설계 및 구현`,
    "납품 기준: 기능 명세서 기반 검수 후 최종 승인",
    "최소 1회 이상 수정 반영 포함",
  ];

  // 상주(기간제) 전용 추가 섹션
  const fulltimeDetails = [
    "팀 협업 도구(Slack, Notion, Jira) 사용 환경",
    "주간 스프린트 리뷰 및 회고 참여",
    "계약 만료 후 연장 협의 가능",
  ];

  const divider = <div style={{ borderTop: "1px solid #F1F5F9", margin: "24px 0" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 뒤로가기 */}
      <button onClick={onBack}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
        onMouseLeave={e => e.currentTarget.style.color = "#64748B"}
      >
        ← 목록으로 돌아가기
      </button>

      {/* 단일 블록 */}
      <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "30px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* ① 배지 + 버튼 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: g.color, background: g.bg, border: `1px solid ${g.border}`, borderRadius: 6, padding: "3px 10px", fontFamily: F }}>{g.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: matchColor(p.match), background: matchColor(p.match) === "#10B981" ? "#D1FAE5" : matchColor(p.match) === "#3B82F6" ? "#DBEAFE" : "#FEF3C7", borderRadius: 6, padding: "3px 10px", fontFamily: F }}>{p.match}% AI Match</span>
          </div>
          {applied ? (
            <button disabled style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#D1FAE5", color: "#065F46", fontSize: 14, fontWeight: 700,
              cursor: "default", fontFamily: F, whiteSpace: "nowrap"
            }}>
              ✓ 지원 완료
            </button>
          ) : (
            <button onClick={() => setShowConfirm(true)} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: PRIMARY_GRAD, color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: F, boxShadow: "0 4px 14px rgba(99,102,241,0.3)", whiteSpace: "nowrap"
            }}>
              프로젝트 지원하기
            </button>
          )}
        </div>

        {/* 지원 확인 모달 */}
        {showConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowConfirm(false)}>
            <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: F }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>📋</div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: "0 0 8px", textAlign: "center" }}>프로젝트 지원</h2>
              <p style={{ fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 1.7, margin: "0 0 16px" }}>
                <strong style={{ color: "#1E293B" }}>{p.slogan}</strong><br />
                위 프로젝트에 지원하시겠습니까?
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="간단한 자기소개나 지원 동기를 남겨보세요. (선택)"
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: F,
                  resize: "vertical", marginBottom: 18, boxSizing: "border-box",
                  color: "#0F172A", outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowConfirm(false)} disabled={submitting} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #E5E7EB",
                  background: "white", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F,
                  opacity: submitting ? 0.5 : 1,
                }}>취소</button>
                <button onClick={handleApply} disabled={submitting} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                  background: PRIMARY_GRAD, color: "white", fontSize: 14, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer", fontFamily: F,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)", opacity: submitting ? 0.7 : 1,
                }}>{submitting ? "지원 중..." : "지원하기"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ② 제목 */}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: "0 0 16px", fontFamily: F }}>{p.slogan}</h1>

        {/* ③ 견적·기간 박스 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
          {[
            { label: "예상 견적", value: p.price, big: true },
            { label: "예상 기간", value: p.period, big: false },
          ].map(({ label, value, big }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", padding: "14px 24px", flex: "1 1 120px" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4, fontFamily: F }}>{label}</div>
              <div style={{ fontSize: big ? 22 : 18, fontWeight: 900, color: "#1E293B", fontFamily: F }}>{value}</div>
            </div>
          ))}
        </div>

        {divider}

        {/* ④ 프로젝트 개요 */}
        <SectionTitle>프로젝트 개요</SectionTitle>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: 0, fontFamily: F }}>{p.desc}</p>

        {divider}

        {/* ⑤ 필요 기술 스택 */}
        <SectionTitle>필요 기술 스택</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {p.tags.map(t => (
            <span key={t} style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "5px 14px", fontFamily: F }}>{t}</span>
          ))}
        </div>

        {divider}

        {/* ⑥ 상세 요구사항 */}
        <SectionTitle>{isOutsource ? "상세 요구사항" : "근무 환경 및 팀 구성"}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(isOutsource ? outsourceDetails : fulltimeDetails).map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: PRIMARY, fontWeight: 900, marginTop: 1, flexShrink: 0 }}>✔</span>
              <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: F }}>{item}</span>
            </div>
          ))}
        </div>

        {divider}

        {/* ⑦ 근무 환경 및 모집 요건 */}
        <SectionTitle>근무 환경 및 모집 요건</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {[
            { label: "모집 인원", value: headcount },
            { label: "근무 형태", value: workStyle },
            { label: "계약 기간", value: p.period },
            { label: "모집 마감", value: <span style={{ color: "#EF4444", fontWeight: 700 }}>{deadline}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4, fontFamily: F }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10, fontFamily: F }}>자격 요건</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requirements.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#94A3B8", flexShrink: 0 }}>·</span>
              <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: F }}>{r}</span>
            </div>
          ))}
        </div>

        {divider}

        {/* ⑦.5 7가지 세부 협의사항 — 등록 시 입력한 내용이 있으면 탭으로 노출 */}
        <ContractTermsTabs terms={p.contractTerms} />

        {divider}

        {/* ⑧ 클라이언트 정보 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: p.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "white", fontFamily: F, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>@{p.clientId}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>클라이언트 신뢰도 4.9/5.0</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {p.verifications.map((v, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#ECFDF5", borderRadius: 999, padding: "3px 10px", fontFamily: F }}>{v}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   7가지 세부 협의사항 탭 뷰 (read-only)
   - 등록 시 입력했던 contractTerms JSON 을 7개 탭으로 노출
───────────────────────────────────────────────────────── */
// DB(project_modules.module_key) 표준 키와 일치시킴.
const CONTRACT_TABS = [
  { key: "scope",       label: "1. 작업 범위" },
  { key: "deliverable", label: "2. 전달 결과물" },
  { key: "schedule",    label: "3. 일정" },
  { key: "payment",     label: "4. 결제" },
  { key: "revision",    label: "5. 수정" },
  { key: "completion",  label: "6. 완료" },
  { key: "terms",       label: "7. 특약" },
];

function ContractTermsTabs({ terms }) {
  const [active, setActive] = useState("scope");
  if (!terms || typeof terms !== "object" || Object.keys(terms).length === 0) {
    return (
      <div>
        <SectionTitle>7가지 세부 협의사항</SectionTitle>
        <div style={{
          padding: "20px 24px", background: "#F8FAFC", border: "1px dashed #CBD5E1",
          borderRadius: 12, fontSize: 13, color: "#64748B", fontFamily: F, textAlign: "center",
        }}>
          이 프로젝트는 아직 세부 협의사항이 등록되지 않았어요.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>7가지 세부 협의사항</SectionTitle>

      {/* 탭 헤더 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, borderBottom: "1px solid #E2E8F0", paddingBottom: 0 }}>
        {CONTRACT_TABS.map((t) => {
          const has = !!terms[t.key];
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                padding: "9px 14px", border: "none", background: "none",
                borderBottom: isActive ? "2.5px solid #3B82F6" : "2.5px solid transparent",
                color: isActive ? "#1D4ED8" : has ? "#475569" : "#CBD5E1",
                fontSize: 13, fontWeight: isActive ? 800 : 600, fontFamily: F,
                cursor: "pointer", marginBottom: -1,
              }}
            >{t.label}{!has && " ·"}</button>
          );
        })}
      </div>

      {/* 탭 본문 — 세부협의 모달을 inline + readOnly 로 렌더링 (세부협의미팅과 동일 디자인, 수정/수락 버튼만 제거) */}
      <div style={{
        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "18px 22px", minHeight: 80, fontFamily: F,
      }}>
        <ContractTermInlineModal termKey={active} data={terms[active]} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ContractTermInlineModal
   - 세부협의 모달(ContractModals)을 inline + readOnly 로 임베드.
   - DB 의 contractTerms[key] 데이터를 그대로 모달의 value 로 전달.
   - data 가 줄글({text}) 만 있는 구버전이면 줄글로 fallback.
───────────────────────────────────────────────────────── */
function ContractTermInlineModal({ termKey, data }) {
  const Comp = CONTRACT_MODAL_BY_KEY[termKey];
  if (!data) {
    return <div style={{ fontSize: 13, color: "#94A3B8" }}>이 항목은 아직 입력되지 않았어요.</div>;
  }
  // 모듈에서 사용 가능한 구조화된 키가 하나라도 있으면 모달로 렌더, 아니면 줄글 fallback
  const structuredKeys = ["included","excluded","memo","deliverables","formats","delivery","notes","phases","milestones","total","payments","freeItems","paidItems","items","steps","terms"];
  const hasStructured = data && typeof data === "object" && structuredKeys.some(k => data[k] != null);
  if (!Comp || !hasStructured) {
    if (data && typeof data === "object" && data.text) {
      return <Prose text={String(data.text)} />;
    }
    return <div style={{ fontSize: 13, color: "#94A3B8" }}>표시할 데이터가 없어요.</div>;
  }
  return (
    <Comp
      inline
      readOnly
      showHeaderStatusBadge={false}
      value={data}
      onClose={() => {}}
      onSubmit={null}
      onChange={null}
    />
  );
}

function ContractTermContent({ termKey, data }) {
  if (!data) {
    return <div style={{ fontSize: 13, color: "#94A3B8" }}>이 항목은 아직 입력되지 않았어요.</div>;
  }
  switch (termKey) {
    case "scope":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {Array.isArray(data.included) && <ListBlock title="포함 작업" items={data.included} dotColor="#3B82F6" />}
          {Array.isArray(data.excluded) && <ListBlock title="제외 작업" items={data.excluded} dotColor="#9CA3AF" muted />}
          {data.memo && <Memo text={data.memo} />}
        </div>
      );
    case "deliverable":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {Array.isArray(data.deliverables) && (
            <div>
              <BlockTitle>전달물 목록</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.deliverables.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(data.formats) && <ListBlock title="파일 형식" items={data.formats} dotColor="#10B981" />}
          {Array.isArray(data.delivery) && <ListBlock title="전달 방법" items={data.delivery} dotColor="#3B82F6" />}
          {Array.isArray(data.notes) && <ListBlock title="유의사항" items={data.notes} dotColor="#F59E0B" />}
        </div>
      );
    case "schedule":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {Array.isArray(data.phases) && (
            <div>
              <BlockTitle>마일스톤</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.phases.map((ph, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#3B82F6", marginBottom: 4 }}>{ph.num} · {ph.title}</div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{ph.desc}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>완료 예정: {ph.date} · {ph.weeks}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#475569" }}>
            {data.startDate && <span>시작: <b>{data.startDate}</b></span>}
            {data.endDate && <span>종료: <b>{data.endDate}</b></span>}
            {data.launchDate && <span>런칭: <b>{data.launchDate}</b></span>}
          </div>
          {Array.isArray(data.reviewRules) && (
            <div>
              <BlockTitle>검토/피드백 규칙</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.reviewRules.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#374151" }}>
                    <b style={{ color: "#1E293B" }}>{r.label}</b> — {r.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "payment":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {data.total && (
            <div style={{ padding: "12px 16px", background: "white", border: "1px solid #E2E8F0", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>총 결제 금액 {data.vatNote ? `(${data.vatNote})` : ""}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>₩{data.total}</div>
            </div>
          )}
          {Array.isArray(data.stages) && (
            <div>
              <BlockTitle>결제 단계</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.stages.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{s.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.bankName && (
            <div style={{ fontSize: 12, color: "#64748B" }}>
              <b style={{ color: "#1E293B" }}>입금 계좌</b>: {data.bankName} {data.bankNote && `· ${data.bankNote}`}
            </div>
          )}
          {Array.isArray(data.extraPolicies) && <ListBlock title="추가 정책" items={data.extraPolicies} dotColor="#F59E0B" />}
        </div>
      );
    case "revision":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {Array.isArray(data.freeItems) && <ListBlock title="무상 수정 범위" items={data.freeItems} dotColor="#10B981" />}
          {Array.isArray(data.paidItems) && <ListBlock title="유상 수정 기준" items={data.paidItems} dotColor="#EF4444" />}
          {data.memo && <Memo text={data.memo} />}
        </div>
      );
    case "completion":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {Array.isArray(data.steps) && (
            <div>
              <BlockTitle>완료 절차</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.steps.map((s, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "white", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#3B82F6", marginBottom: 3 }}>STEP {s.n}. {s.title}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(data.criteria) && <ListBlock title="검수 기준" items={data.criteria} dotColor="#3B82F6" />}
          {Array.isArray(data.categories) && (
            <div>
              <BlockTitle>최종 산출물 카테고리</BlockTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.categories.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#374151" }}>
                    <b style={{ color: "#1E293B" }}>{c.n}. {c.title}</b> — {c.desc}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "terms":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.text && <Prose text={data.text} />}
          {data.intro && (
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{data.intro}</div>
          )}
          {Array.isArray(data.terms) && data.terms.map((t, i) => (
            <div key={i} style={{
              padding: "12px 14px", background: "white",
              border: `1px solid ${t.enabled ? "#BFDBFE" : "#E2E8F0"}`,
              borderRadius: 10, opacity: t.enabled ? 1 : 0.6,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.enabled ? "#1D4ED8" : "#94A3B8", marginBottom: 6 }}>
                {t.icon} {t.title} {t.enabled ? "" : "(미적용)"}
              </div>
              {Array.isArray(t.items) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {t.items.map((it, j) => (
                    <div key={j} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>• {it}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    default:
      return <pre style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>;
  }
}

function BlockTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 8, fontFamily: F }}>{children}</div>;
}
function ListBlock({ title, items, dotColor = "#3B82F6", muted = false }) {
  return (
    <div>
      <BlockTitle>{title}</BlockTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, marginTop: 7, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: muted ? "#6B7280" : "#374151", lineHeight: 1.55, fontFamily: F }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Memo({ text }) {
  return (
    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 14px" }}>
      {String(text).split("\n").map((line, i) => (
        <div key={i} style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6, fontFamily: F }}>• {line}</div>
      ))}
    </div>
  );
}
function Prose({ text }) {
  return (
    <div style={{ fontSize: 13.5, color: "#1E293B", lineHeight: 1.75, fontFamily: F, whiteSpace: "pre-wrap" }}>{text}</div>
  );
}
