import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { StreamChat } from "stream-chat";
import heroDefault from "../assets/hero_default.png";
import heroStudent from "../assets/hero_student.png";
import heroMoney from "../assets/hero_money.png";
import heroCheck from "../assets/hero_check.png";
import heroTeacher from "../assets/hero_teacher.png";
import heroVacation from "../assets/hero_vacation.png";
import heroMeeting from "../assets/hero_meeting.png";
import Header_client from "../components/Header_client";
import ClientBannerCard from "../components/ClientBannerCard";
import useStore from "../store/useStore";
import contractionImg from "../assets/contraction.png";
import {
  ScopeModal, DeliverablesModal, ScheduleModal, PaymentModal,
  RevisionModal, CompletionModal, SpecialTermsModal,
} from "../components/ContractModals";
import MOCK_INTEREST_PROJECTS from "../data/mockInterestProjects.json";
import MOCK_INTEREST_PARTNERS from "../data/mockInterestPartners.json";
import { projectsApi, partnersApi, applicationsApi, profileApi, projectModulesApi, dashboardApi, milestonesApi, escrowsApi, paymentMethodsApi } from "../api";

/* ── 찜 목록 상세 API 응답을 카드 표시용으로 매핑 ───────────── */
function toCardProject(p) {
  if (!p) return null;
  const budget = p.budget
    || (p.budgetMin && p.budgetMax ? `${Number(p.budgetMin).toLocaleString()}만~${Number(p.budgetMax).toLocaleString()}만원` : null)
    || (p.budgetAmount ? `${Number(p.budgetAmount).toLocaleString()}만원` : "협의");
  const period = p.period || (p.durationMonths ? `${p.durationMonths}개월` : "협의");
  const isFree = p.isPartnerFree === true || p.priceType === "무료";
  return {
    id: p.id,
    badge: isFree ? "무료" : "유료",
    title: p.title || p.slogan || "프로젝트",
    desc: p.desc || p.sloganSub || "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    period, budget,
    deadline: p.deadline ? `마감: ${p.deadline}` : "마감일 협의",
    deadlineColor: "#64748B",
    _raw: p,
  };
}
function toCardPartner(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name || p.username || `Partner #${p.id}`,
    rating: typeof p.rating === "number" ? p.rating : (p.stats?.rating || 4.5),
    tags: Array.isArray(p.tags) ? p.tags : (Array.isArray(p.skills) ? p.skills : []),
    desc: p.sloganSub || p.slogan || p.bio || "파트너 프로필",
    _raw: p,
  };
}
import PartnerProfileModal from "../components/PartnerProfileModal";
import PortfolioAddManagementTab from "../components/dashboard/PortfolioAddManagementTab";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const COMMON_EMOJIS = [
  "👍", "👎", "👏", "🤝", "🙏", "❤️", "🔥", "✨", "🎉", "✅",
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯"
];

// 텍스트가 이모지(또는 이모지 조합/공백)만으로 이루어졌는지 체크
const isOnlyEmoji = (s) => {
  if (!s) return false;
  const trimmed = String(s).trim();
  if (!trimmed) return false;
  try {
    return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|[\u200D\uFE0F\u20E3\s])+$/u.test(trimmed);
  } catch {
    return false;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const HERO_MAP = {
  hero_student: heroStudent,
  hero_money:   heroMoney,
  hero_check:   heroCheck,
};

const CHAT_CONTACT_HEROES = { 1: heroStudent, 2: heroCheck, 3: heroMoney };
const CHAT_CONTRACT_HEROES = { 1: heroStudent, 2: heroCheck };
const CHAT_PROJECT_HEROES = { 1: heroMeeting, 2: heroTeacher, 3: heroVacation };

/* ── 요일별 컬럼 너비 비율 (단위 없음, 상대 비율) ───────────
   예) mon:2 → 월요일이 다른 요일의 2배 너비
   시간축(44px)을 제외한 남은 공간을 비율대로 분배합니다.       */
import ScheduleTab from "../components/dashboard/ScheduleTab";
import StartingProjectsTab from "../components/dashboard/StartingProjectsTab";
import ProjectManageTabLive from "../components/dashboard/ProjectManageTabLive";
/* ── 대시보드 사이드바 섹션 ───────────────────────────────── */
const SECTIONS = [
  {title: "내 현황 관리",
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
      { key: "apply_done",   label: "모집 종료" },
    ],
  },
  {
    title: "미팅",
    items: [
      { key: "free_meeting",     label: "자유 미팅" },
      { key: "contract_meeting", label: "계약 세부 협의 미팅" },
      { key: "project_meeting",  label: "진행 프로젝트 미팅" },
    ],
  },
  {
    title: "내 프로젝트 관리",
    items: [
      { key: "starting_projects", label: "시작 전 프로젝트" },
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

/* ── MiniCalendar ─────────────────────────────────────────── */

/* ── 지원 내역 모의 데이터 ─────────────────────────────────── */
const MOCK_ACTIVE_PROJS = [
  {
    id: 1, badge: "유료",
    title: "AI 기반 이상 거래 탐지 시스템 고도화",
    desc: "금융 데이터 분석을 통한 실시간 이상 거래 탐지 모델 최적화 및 API 개발",
    tags: ["#AI/ML", "#Python", "#Fintech"],
    period: "3개월", budget: "1,500만원",
    deadline: "마감 임박 (D-3)", deadlineColor: "#EF4444",
    applicants: [
      { id: 1, name: "Alex Miller", title: "백엔드·플랫폼 파트너", rating: 4.9, match: 93, status: "검토 중", appliedAt: "2026.04.12", tags: ["Java", "Spring", "AWS"], desc: "대규모 커머스 API 현대화와 인증, 성능 최적화 경험을 보유한 백엔드 파트너입니다." },
      { id: 2, name: "Sophie Chen", title: "프론트엔드·AI 파트너", rating: 4.8, match: 87, status: "검토 중", appliedAt: "2026.04.13", tags: ["React", "TypeScript", "Python"], desc: "사용자 경험 중심의 프론트엔드 설계와 AI 연동 경험이 풍부한 파트너입니다." },
      { id: 3, name: "David Kim", title: "AI/ML 엔지니어", rating: 4.7, match: 81, status: "검토 중", appliedAt: "2026.04.14", tags: ["Python", "AI/ML", "TensorFlow"], desc: "추천 엔진 및 자연어 처리 모델 개발 경험이 풍부한 AI 파트너입니다." },
    ],
  },
  {
    id: 2, badge: "무료",
    title: "이커머스 플랫폼 모바일 앱 리뉴얼",
    desc: "사용자 경험 중심의 UI/UX 개편 및 Flutter 기반 크로스 플랫폼 앱 개발",
    tags: ["#Mobile", "#Web", "#Flutter"],
    period: "4개월", budget: "2,800만원",
    deadline: "마감 D-15", deadlineColor: "#64748B",
    applicants: [
      { id: 4, name: "이하은", title: "모바일·풀스택 파트너", rating: 5.0, match: 91, status: "검토 중", appliedAt: "2026.04.10", tags: ["Flutter", "React Native", "Firebase"], desc: "크로스플랫폼 앱 개발과 UX 최적화 경험이 풍부한 모바일 파트너입니다." },
    ],
  },
];
const MOCK_ACCEPTED_PROJS = [
  {
    id: 1,
    statusBadge: "지원 합격", statusBadgeBg: "#FFF7ED", statusBadgeColor: "#C2410C",
    title: "블록체인 기반 공급망 관리 시스템 구축",
    desc: "물류 프로세스 투명성 확보를 위한 이더리움 기반 스마트 컨트랙트 개발",
    tags: ["#Blockchain", "#Solidity", "#Node.js"],
    period: "6개월", budget: "4,200만원",
    statusText: "계약 대기중", statusTextColor: "#F97316",
    btnLabel: "계약하기",
    btnBg: "#FEF3C7", btnBgHover: "#FDE68A", btnColor: "#92400E",
    applicants: [
      { id: 5, name: "박지훈", title: "블록체인 개발 파트너", rating: 4.9, match: 95, status: "합격", appliedAt: "2026.03.20", tags: ["Solidity", "Ethereum", "Node.js"], desc: "블록체인 기반 DApp 및 스마트 컨트랙트 개발 전문 파트너입니다." },
      { id: 6, name: "Chris Park", title: "백엔드·블록체인 파트너", rating: 4.6, match: 78, status: "불합격", appliedAt: "2026.03.22", tags: ["Go", "Ethereum", "AWS"], desc: "분산 시스템 설계와 블록체인 인프라 구축 경험을 보유한 파트너입니다." },
    ],
  },
  {
    id: 2,
    statusBadge: "논의 중", statusBadgeBg: "#EFF6FF", statusBadgeColor: "#1D4ED8",
    title: "메타버스 협업 툴 시각화 모듈 개발",
    desc: "Three.js를 활용한 웹 기반 3D 데이터 시각화 엔진 고도화 및 최적화",
    tags: ["#Three.js", "#WebGL", "#React"],
    period: "2개월", budget: "1,200만원",
    statusText: "시작 예정 (12/01)", statusTextColor: "#64748B",
    btnLabel: "상세 계약 미팅 이동",
    btnBg: "#DBEAFE", btnBgHover: "#BFDBFE", btnColor: "#1E3A5F",
    applicants: [
      { id: 7, name: "나유진", title: "3D·그래픽스 파트너", rating: 4.8, match: 89, status: "합격", appliedAt: "2026.03.28", tags: ["Three.js", "WebGL", "React"], desc: "웹 기반 3D 그래픽스 및 실시간 렌더링 최적화 경험이 풍부한 파트너입니다." },
    ],
  },
];
const MOCK_CLOSED_PROJS = [
  {
    id: 1,
    title: "실시간 스트리밍 앱 최적화 및 안정화",
    desc: "대규모 동시 접속자 처리를 위한 백엔드 구조 개편 및 트래픽 제어 알고리즘 적용",
    tags: ["#Streaming", "#Go", "#Redis"],
    endDate: "종료일: 2024.11.15", statusText: "모집 완료",
    applicants: [
      { id: 8, name: "김도현", title: "백엔드·인프라 파트너", rating: 4.9, match: 94, status: "합격", appliedAt: "2024.10.30", tags: ["Go", "Redis", "Kafka"], desc: "대용량 트래픽 처리와 스트리밍 시스템 설계 경험이 풍부한 파트너입니다." },
      { id: 9, name: "이수진", title: "DevOps·백엔드 파트너", rating: 4.5, match: 72, status: "불합격", appliedAt: "2024.11.01", tags: ["AWS", "Docker", "Go"], desc: "클라우드 인프라 구축 및 DevOps 파이프라인 자동화 전문 파트너입니다." },
    ],
  },
  {
    id: 2,
    title: "개인 맞춤형 식단 관리 웹 서비스",
    desc: "사용자 건강 데이터를 기반으로 한 영양소 분석 및 AI 레시피 추천 시스템",
    tags: ["#HealthCare", "#Vue.js", "#Django"],
    endDate: "마감일: 2024.11.10", statusText: "지원 철회됨",
    applicants: [],
  },
];

/* ── 지원자 배너 미니 카드 ──────────────────────────────── */
function ApplicantBanner({ app, onViewPartner, statusOverride }) {
  const effectiveStatus = statusOverride ?? app.status;
  const statusColor = effectiveStatus === "검토 중" ? "#3B82F6" : effectiveStatus === "합격" ? "#16A34A" : "#EF4444";
  const statusBg    = effectiveStatus === "검토 중" ? "#EFF6FF" : effectiveStatus === "합격" ? "#F0FFF4" : "#FEF2F2";
  const statusBorder = effectiveStatus === "검토 중" ? "#BFDBFE" : effectiveStatus === "합격" ? "#86EFAC" : "#FECACA";
  const matchColor  = app.match >= 90 ? "#10B981" : app.match >= 75 ? "#3B82F6" : "#F59E0B";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px", borderRadius: 12,
      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    }}>
      {/* 아바타 */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
        border: "1.5px solid #BFDBFE",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="#60A5FA"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#60A5FA"/>
        </svg>
      </div>
      {/* 이름·직함 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{app.name}</span>
          <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{app.title}</span>
          <span style={{ fontSize: 11, color: "#FBBF24" }}>★</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", fontFamily: F }}>{app.rating}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: matchColor,
            background: matchColor + "18", borderRadius: 6, padding: "2px 7px", fontFamily: F,
          }}>AI {app.match}%</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {app.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "white", border: "1px solid #E2E8F0", color: "#475569", fontFamily: F }}>{t}</span>
          ))}
        </div>
      </div>
      {/* 상태 배지 + 지원일 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: statusColor,
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 6, padding: "3px 10px", fontFamily: F,
        }}>{effectiveStatus}</span>
        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F }}>지원일 {app.appliedAt}</span>
      </div>
      {/* 버튼 영역 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onViewPartner(app); }}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: "#DBEAFE", color: "#1E3A5F", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: F, flexShrink: 0, transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
          onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
        >프로필 보기</button>
      </div>
    </div>
  );
}

/* ── 지원자 목록 섹션 (접기/펼치기) ─────────────────────── */
function ApplicantsSection({ applicants, onViewPartner, getStatus }) {
  const [open, setOpen] = useState(true);
  if (!applicants || applicants.length === 0) return null;
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", padding: "0 0 8px", fontFamily: F,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", fontFamily: F }}>지원자 {applicants.length}명</span>
        <span style={{ fontSize: 12, color: "#94A3B8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", lineHeight: 1 }}>▲</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {applicants.map(app => (
            <ApplicantBanner key={app.id} app={app} onViewPartner={onViewPartner}
              statusOverride={getStatus?.(app.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 지원 중 카드 ─────────── */
function ActiveProjCard({ proj, onViewPartner, onViewProject, getStatus }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F, flexShrink: 0 }}>{proj.badge}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
        </div>
        <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          onClick={() => onViewProject?.(proj)}
          style={{ padding: "8px 22px", borderRadius: 10, border: "none", background: hov ? "#BFDBFE" : "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, flexShrink: 0, marginLeft: 16, transition: "background 0.15s" }}>
          상세보기
        </button>
      </div>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>예상 기간: {proj.period}&nbsp;&nbsp;예상 금액: {proj.budget}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: proj.deadlineColor, fontFamily: F }}>{proj.deadline}</span>
      </div>
      <ApplicantsSection applicants={proj.applicants} onViewPartner={onViewPartner} getStatus={getStatus} />
    </div>
  );
}

/* ── 합격 프로젝트 카드 ─────── */
function AcceptedProjCard({ proj, onViewPartner, getStatus }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.statusBadgeBg, color: proj.statusBadgeColor, fontFamily: F, flexShrink: 0 }}>{proj.statusBadge}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
        </div>
        <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: hov ? proj.btnBgHover : proj.btnBg, color: proj.btnColor, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, flexShrink: 0, marginLeft: 16, transition: "background 0.15s", whiteSpace: "nowrap" }}>
          {proj.btnLabel}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>계약 기간: {proj.period}&nbsp;&nbsp;계약 금액: {proj.budget}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: proj.statusTextColor, fontFamily: F }}>{proj.statusText}</span>
      </div>
      <ApplicantsSection applicants={proj.applicants} onViewPartner={onViewPartner} getStatus={getStatus} />
    </div>
  );
}

/* ── 지원 종료 카드 ─────────── */
function ClosedProjCard({ proj, onViewPartner }) {
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#64748B", fontFamily: F, flexShrink: 0, letterSpacing: "0.03em" }}>CLOSED</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", fontFamily: F }}>{proj.title}</span>
        </div>
        <button style={{ padding: "8px 22px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#F8FAFC", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "default", fontFamily: F, flexShrink: 0, marginLeft: 16 }}>종료됨</button>
      </div>
      <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#94A3B8", fontFamily: F }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>{proj.endDate}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", fontFamily: F }}>{proj.statusText}</span>
      </div>
      <ApplicantsSection applicants={proj.applicants} onViewPartner={onViewPartner} />
    </div>
  );
}

/* ── 지원자 카드 (파트너 → 클라이언트 프로젝트 지원) ──────── */
function ApplicantCard({ app }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const statusColor = app.status === "검토 중" ? "#3B82F6" : app.status === "합격" ? "#16A34A" : "#EF4444";
  const statusBg    = app.status === "검토 중" ? "#EFF6FF" : app.status === "합격" ? "#F0FFF4" : "#FEF2F2";
  const heroSrc = HERO_MAP[app.partnerHero] || heroDefault;
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* 파트너 HERO 아바타 */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
          border: "1.5px solid #BFDBFE",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src={heroSrc} alt="hero" style={{ width: 44, height: 44, objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px", background: statusBg, color: statusColor, fontFamily: F }}>{app.status}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: F }}>지원일: {app.appliedAt}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 4 }}>{app.projectTitle}</div>
          <div style={{ fontSize: 13, color: "#64748B", fontFamily: F, marginBottom: 10 }}>
            지원자: <strong style={{ color: "#334155" }}>@{app.partnerName}</strong> &nbsp;·&nbsp; {app.projectWorkPref} &nbsp;·&nbsp; {app.projectPeriod} &nbsp;·&nbsp; {app.projectPrice}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {app.projectTags.slice(0, 4).map(t => (
              <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>
            ))}
          </div>
        </div>
        <button
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          onClick={() => navigate("/partner_profile_view")}
          style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: hov ? "#BFDBFE" : "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, flexShrink: 0, transition: "background 0.15s", whiteSpace: "nowrap" }}>
          프로필 보기
        </button>
      </div>
    </div>
  );
}

/* ── ApplicationsTab ─────────────────────────────────────── */
function ApplicationsTab({ activeTab }) {
  const [selectedProj, setSelectedProj] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null); // { partner, onAccept?, onReject? }
  const [appStatuses, setAppStatuses] = useState({});
  const accept = (id) => setAppStatuses(prev => ({ ...prev, [id]: "합격" }));
  const reject = (id) => setAppStatuses(prev => ({ ...prev, [id]: "불합격" }));
  const getStatus = (id) => appStatuses[id];
  const openApplicantModal = (app) => setSelectedPartner({
    partner: app,
    onAccept: () => accept(app.id),
    onReject: () => reject(app.id),
  });

  return (
    <div>
      {selectedProj && <ProjectDetailPopup proj={selectedProj} onClose={() => setSelectedProj(null)} />}
      {selectedPartner && <PartnerProfileModal
        partner={selectedPartner.partner}
        onClose={() => setSelectedPartner(null)}
        onPropose={selectedPartner.onAccept}
        onReject={selectedPartner.onReject}
      />}

      {/* 지원 중 탭 헤더 */}
      {activeTab === "apply_active" && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontFamily: F, margin: "0 0 6px" }}>
            지원 중인 파트너스
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", fontFamily: F, margin: 0 }}>
            내 프로젝트에 지원한 파트너스 현황을 확인할 수 있습니다.
          </p>
        </div>
      )}

      {/* 모집 종료 탭 헤더 */}
      {activeTab === "apply_done" && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontFamily: F, margin: "0 0 6px" }}>
            모집 종료 프로젝트
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", fontFamily: F, margin: 0 }}>
            모집이 마감된 프로젝트의 지원 결과를 확인할 수 있습니다.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {activeTab === "apply_active" && (
          <>
            {MOCK_ACTIVE_PROJS.map(p => (
              <ActiveProjCard key={p.id} proj={p} onViewPartner={openApplicantModal}
                onViewProject={setSelectedProj} getStatus={getStatus} />
            ))}
            {MOCK_ACCEPTED_PROJS.map(p => (
              <AcceptedProjCard key={p.id} proj={p} onViewPartner={openApplicantModal} getStatus={getStatus} />
            ))}
          </>
        )}
        {activeTab === "apply_done" && (
          MOCK_CLOSED_PROJS.map(p => <ClosedProjCard key={p.id} proj={p} onViewPartner={setSelectedPartner} />)
        )}
      </div>
    </div>
  );
}

const MOCK_PARTNERS_DETAIL = [{
    title: "AI/ML 엔지니어",
    rating: 5.0,
    liked: true,
    tags: ["AI/ML", "Python", "PyTorch"],
    desc: "데이터 분석 및 딥러닝 모델 고도화 전문가입니다. 복잡한 문제를 효율적인 알고리즘으로 해결합니다.",
    careers: [
      { company: "Samsung SDS", role: "AI Research Engineer", period: "2020.04 ~ 현재", desc: "딥러닝 모델 개발 및 MLOps 파이프라인 구축" },
    ],
    educations: [
      { school: "서울대학교", major: "컴퓨터공학과", degree: "석사", year: "2020" },
    ],
    reviews: [
      { reviewer: "MedTech Inc", rating: 5, comment: "AI 모델 정확도를 20% 이상 향상시켜 주셨습니다. 최고의 파트너입니다.", date: "2024.03" },
    ],
    portfolioItems: [
      { title: "의료 이미지 분석 AI", tech: ["PyTorch", "Python", "Docker"], desc: "CT 이미지 병변 탐지 모델 개발 (F1 Score 0.97)" },
    ],
  },
];

/* ── 파트너 스킬 태그 색상 맵 ──────────────────────────────── */
const PARTNER_TAG_COLORS = {
  "Full-stack": { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
  "React":      { bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF" },
  "Node.js":    { bg: "#F0FDF4", border: "#86EFAC", text: "#166534" },
  "AI/ML":      { bg: "#F5F3FF", border: "#C4B5FD", text: "#5B21B6" },
  "Python":     { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
  "PyTorch":    { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
  "Vue.js":     { bg: "#F0FDF4", border: "#86EFAC", text: "#166534" },
  "TypeScript": { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
  "AWS":        { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  "Docker":     { bg: "#1E293B", border: "#1E293B", text: "#FFFFFF" },
};
function PartnerTag({ label }) {
  const c = PARTNER_TAG_COLORS[label] || { bg: "#F1F5F9", border: "#E2E8F0", text: "#475569" };
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 99,
      background: c.bg, border: "1px solid " + c.border,
      fontSize: 12, fontWeight: 600, color: c.text, fontFamily: F,
    }}>{label}</span>
  );
}

function ProjectDetailPopup({ proj, onClose }) {
  const aiMatch = proj.id === 1 ? "93%" : "87%";
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  
  const requirements = [
    proj.tags.slice(0, 2).join("/") + " 등 관련 기술 실무 경험 " + (proj.level === "시니어" ? "3년 이상" : proj.level === "미들" ? "2년 이상" : "1년 이상"),
    proj.title + " 도메인 프로젝트 수행 경험 우대",
    "원활한 커뮤니케이션 능력 보유자",
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20,
          width: "min(880px, 94vw)", maxHeight: "88vh",
          overflowY: "auto", position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        <div style={{
          padding: "20px 28px 16px", position: "sticky", top: 0, background: "white",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4",
              color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F,
            }}>{proj.badge}</span>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: (proj.workPref === "외주" || proj.workPref === "상주") ? "#FEF2F2" : "#FEF7ED",
              color: (proj.workPref === "외주" || proj.workPref === "상주") ? "#DC2626" : "#7C2D12", fontFamily: F,
            }}>{proj.workPref || "상주"}</span>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: "#F0FDF4", color: "#16A34A", fontFamily: F,
            }}>AI Match {aiMatch}</span>
          </div>
          <h2 style={{ fontSize: 25, fontWeight: 900, color: "#0F172A", margin: 0, fontFamily: F, paddingRight: 36, lineHeight: 1.2 }}>{proj.title}</h2>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 18, background: "none", border: "none",
              cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px",
            }}
          >✕</button>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, fontFamily: F, marginBottom: 4 }}>예상 견적</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1E293B", fontFamily: F }}>{proj.budget}</div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, fontFamily: F, marginBottom: 4 }}>예상 기간</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1E293B", fontFamily: F }}>{proj.period}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>프로젝트 개요</span>
          </div>
          <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px", fontFamily: F, lineHeight: 1.8 }}>{proj.desc}</p>

          <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>필요 기술 스택</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {proj.tags.map(t => (
              <span key={t} style={{
                fontSize: 13, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", 
                border: "1px solid #BFDBFE", borderRadius: 8, padding: "5px 14px", fontFamily: F,
              }}>{t.replace("#", "")}</span>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>근무 환경 및 팀 구성</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {[
              "팀 협업 도구(Slack, Notion, Jira) 사용 환경",
              "주간 스프린트 리뷰 및 회고 참여", 
              "계약 만료 후 연장 협의 가능",
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ color: "#3B82F6", fontWeight: 900, marginTop: 1 }}>✔</span>
                <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: F }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>근무 환경 및 모집 요건</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 12 }}>
            {[
              { label: "모집 인원", value: "2명 (프론트엔드 1, 백엔드 1)" },
              { label: "근무 형태", value: proj.workPref === "외주" ? "원격 외주 (주 1회 오프라인 미팅 권장)" : "원격 근무 (주 1회 오프라인 미팅 권장)" },
              { label: "계약 기간", value: proj.period },
              { label: "모집 마감", value: <span style={{ color: "#EF4444", fontWeight: 700 }}>{(proj.deadline || "").replace("마감 ", "").replace("마감 임박 ", "") || "2026.04.30"}</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4, fontFamily: F }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10, fontFamily: F }}>자격 요건</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {requirements.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#94A3B8", flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: F }}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: proj.avatarColor || "#4BAA7B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "white", fontFamily: F, flexShrink: 0 }}>
              {(proj.clientId || "CL").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>@{proj.clientId || "client_00000"}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>클라이언트 신뢰도 4.9/5.0</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {(proj.verifications || ["본인인증", "사업자등록증"]).map((v, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#ECFDF5", borderRadius: 999, padding: "3px 10px", fontFamily: F }}>{v}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 7가지 협의사항 모달 */}
      {showAgreementModal && (
        <div onClick={() => setShowAgreementModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "min(600px, 90vw)", maxHeight: "80vh", overflowY: "auto", background: "white", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>계약 세부 협의 항목</h3>
              <button onClick={() => setShowAgreementModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "1. 작업 범위",
                "2. 최종 전달물 정의서", 
                "3. 마감 일정 및 마일스톤",
                "4. 총 금액",
                "5. 수정 가능 범위",
                "6. 완료 기준",
                "7. 추가 특약 (선택)"
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", fontFamily: F }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function PartnerDetailPopup({ partner, onClose, backdrop = "rgba(0,0,0,0.5)" }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: backdrop,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20,
          width: "min(720px, 94vw)", maxHeight: "88vh",
          overflowY: "auto", position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", gap: 20,
          position: "sticky", top: 0, background: "white", zIndex: 2,
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{partner.name}</div>
            <div style={{ fontSize: 13, color: "#64748B", fontFamily: F, fontWeight: 600, marginTop: 2 }}>{partner.title || "개발 파트너"}</div>
            <div style={{ fontSize: 14, color: "#FBBF24", fontFamily: F, marginTop: 4 }}>
              {"★".repeat(Math.floor(partner.rating))} <span style={{ color: "#64748B", fontWeight: 700 }}>{partner.rating}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 18, background: "none", border: "none",
            cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px",
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 보유 기술 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>보유 기술</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {partner.tags.map(t => <PartnerTag key={t} label={t} />)}
            </div>
          </div>

          {/* 자기소개 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>자기소개</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.7, background: "#F8FAFC", borderRadius: 10, padding: "12px 16px", border: "1px solid #E2E8F0" }}>{partner.desc}</p>
          </div>

          {/* 경력 */}
          {partner.careers && partner.careers.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>💼 경력</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {partner.careers.map((c, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{c.company}</span>
                        <span style={{ fontSize: 13, color: "#64748B", fontFamily: F, marginLeft: 8 }}>{c.role}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginLeft: 8 }}>{c.period}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학력 */}
          {partner.educations && partner.educations.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>🎓 학력</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {partner.educations.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", borderRadius: 12, padding: "12px 18px", border: "1px solid #E2E8F0" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎓</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{e.school}</div>
                      <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{e.major} · {e.degree} · {e.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 포트폴리오 */}
          {partner.portfolioItems && partner.portfolioItems.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>📋 포트폴리오</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {partner.portfolioItems.map((p, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 6 }}>{p.title}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                      {p.tech.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontFamily: F }}>{t}</span>)}
                    </div>
                    <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: F, lineHeight: 1.5 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 클라이언트 리뷰 */}
          {partner.reviews && partner.reviews.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>⭐ 클라이언트 리뷰</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {partner.reviews.map((r, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{r.reviewer}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#FBBF24", fontFamily: F }}>★ {r.rating}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F }}>{r.date}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 협업 제안 버튼 */}
          <button style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)",
            color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F,
          }}>협업 제안하기</button>
        </div>
      </div>
    </div>
  );
}

function InterestsTab({ onProposePartner }) {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // 실 API 기반 찜 상태
  const interestedProjectIds  = useStore(s => s.interestedProjectIds);
  const interestedPartnerIds  = useStore(s => s.interestedPartnerIds);
  const loadInterests          = useStore(s => s.loadInterests);
  const toggleProjectInterest  = useStore(s => s.toggleProjectInterest);
  const togglePartnerInterest  = useStore(s => s.togglePartnerInterest);

  useEffect(() => { loadInterests(); }, [loadInterests]);

  // 찜한 ID로 실제 프로젝트/파트너 상세 fetch
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [displayedPartners, setDisplayedPartners] = useState([]);

  useEffect(() => {
    let active = true;
    if (interestedProjectIds.length === 0) { setDisplayedProjects([]); return; }
    Promise.all(interestedProjectIds.map(id =>
      projectsApi.detail(id).then(toCardProject).catch(() => null)
    )).then(results => {
      if (active) setDisplayedProjects(results.filter(Boolean));
    });
    return () => { active = false; };
  }, [interestedProjectIds]);

  useEffect(() => {
    let active = true;
    if (interestedPartnerIds.length === 0) { setDisplayedPartners([]); return; }
    Promise.all(interestedPartnerIds.map(id =>
      partnersApi.detail(id).then(toCardPartner).catch(() => null)
    )).then(results => {
      if (active) setDisplayedPartners(results.filter(Boolean));
    });
    return () => { active = false; };
  }, [interestedPartnerIds]);

  const EmptyState = ({ label, onGo }) => (
    <div style={{
      padding: "40px 20px", textAlign: "center",
      border: "1.5px dashed #E2E8F0", borderRadius: 14, background: "#F8FAFC",
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🤍</div>
      <p style={{ fontSize: 14, color: "#64748B", fontFamily: F, margin: "0 0 14px" }}>
        아직 찜한 {label}이 없어요
      </p>
      <button onClick={onGo} style={{
        padding: "8px 20px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
        color: "white", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
      }}>둘러보기 →</button>
    </div>
  );

  return (
    <div>
      {selectedProject && <ProjectDetailPopup proj={selectedProject} onClose={() => setSelectedProject(null)} />}
      {selectedPartner && (
        <PartnerProfileModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onPropose={(partner) => { setSelectedPartner(null); onProposePartner?.(partner); }}
        />
      )}
      {/* 관심 프로젝트 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>관심 프로젝트</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>관심 프로젝트로 추가한 프로젝트를 확인할 수 있습니다.</p>
        </div>
        <button onClick={() => navigate("/project_search")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600,
          whiteSpace: "nowrap", padding: 0,
        }}>전체 / AI 추천 프로젝트 보기 &gt;</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 56 }}>
        {displayedProjects.length === 0 && (
          <EmptyState label="프로젝트" onGo={() => navigate("/project_search")} />
        )}
        {displayedProjects.map(proj => (
          <div key={proj.id} style={{
            border: "1.5px solid #F1F5F9", borderRadius: 14,
            padding: "18px 22px", background: "white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4",
                  color: proj.badge === "유료" ? "#3B82F6" : "#16A34A",
                  fontFamily: F, flexShrink: 0,
                }}>{proj.badge}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
                <button
                  onClick={() => toggleProjectInterest(proj.id).catch(() => {})}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
                >🩷</button>
              </div>
              <button
                onClick={() => setSelectedProject(proj)}
                style={{
                padding: "8px 22px", borderRadius: 10, border: "none",
                background: "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: F, flexShrink: 0, marginLeft: 16,
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
                onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
              >상세보기</button>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {proj.tags.map(t => (
                <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>예상 기간: {proj.period}&nbsp;&nbsp;예상 금액: {proj.budget}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: proj.deadlineColor, fontFamily: F }}>{proj.deadline}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 관심 파트너스 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>관심 파트너스</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>관심 파트너로 추가한 전문가들을 확인하고 바로 협업을 제안해 보세요.</p>
        </div>
        <button onClick={() => navigate("/partner_search")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600,
          whiteSpace: "nowrap", padding: 0,
        }}>전체 파트너 보기 &gt;</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayedPartners.length === 0 && (
          <EmptyState label="파트너" onGo={() => navigate("/partner_search")} />
        )}
        {displayedPartners.map(partner => (
          <div key={partner.id} style={{
            border: "1.5px solid #F1F5F9", borderRadius: 14,
            padding: "18px 22px", background: "white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex", alignItems: "flex-start", gap: 16,
          }}>
            {/* 아바타 */}
            <div style={{
              width: 60, height: 60, borderRadius: 12, flexShrink: 0,
              background: "#F1F5F9", border: "1.5px solid #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#94A3B8"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#94A3B8"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{partner.name}</span>
                  <span style={{ fontSize: 13, color: "#FBBF24", fontFamily: F }}>★ {partner.rating}</span>
                  <button
                    onClick={() => togglePartnerInterest(partner.id).catch(() => {})}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
                  >🩷</button>
                </div>
                <button
                  onClick={() => setSelectedPartner(partner)}
                  style={{
                  padding: "8px 22px", borderRadius: 10, border: "none",
                  background: "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: F, flexShrink: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
                  onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
                >상세보기</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {partner.tags.map(t => (
                  <PartnerTag key={t} label={t} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.6 }}>{partner.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ProjectManageTab (진행 프로젝트 관리) ──────────────────── */
const MOCK_MANAGE_PROJECTS = [
  {
    id: 1, badge: "유료",
    title: "AI 기반 지능형 큐레이터 플랫폼 고도화",
    tags: [("AI/ML"), ("Python"), ("Fintech")],
    progress: 68, progressColor: "#3B82F6",
    overallStatus: null,
    milestones: [
      { num: 1, title: "아키텍처 설계",     desc: "데이터 파이프라인 구조 및 API 명세서 확정",                           status: "COMPLETED"   },
      { num: 2, title: "모델 파인튜닝",     desc: "LLM 기반 추천 엔진 성능 최적화 진행 중 (Target Accuracy 92%)",   status: "IN_PROGRESS" },
      { num: 3, title: "UI 통합 및 테스트", desc: "프론트엔드 연동 및 최종 QA 배포",                                  status: "PENDING"     },
    ],
    client: { name: "Alpha FinTech",  rating: 4.8, reviews: 24 },
  },
  {
    id: 2, badge: "무료",
    title: "E-commerce Platform UX/UI Redesign",
    tags: [("UX/UI"), ("Flutter")],
    progress: 32, progressColor: "#22C55E",
    overallStatus: null,
    milestones: [
      { num: 1, title: "Wireframe Design",      desc: "사용자 흐름 분석 및 고수준 와이어프레임 설계",      status: "COMPLETED"   },
      { num: 2, title: "Mobile UI Prototypes",  desc: "인터랙티브 프로토타입 제작 및 사용자 테스트",     status: "IN_PROGRESS" },
      { num: 3, title: "Admin Panel Dev",        desc: "백엔드 대시보드 연동 및 관리 도구 개발",           status: "PENDING"     },
    ],
    client: { name: "Blue Retail Co.", rating: 4.9, reviews: 12 },
  },
  {
    id: 3, badge: "유료",
    title: "Bitcoin Auto-Trading System Development",
    tags: [("Blockchain"), ("Fintech"), ("Python")],
    progress: 0, progressColor: "#94A3B8",
    overallStatus: "PLANNED",
    milestones: [
      { num: 1, title: "Core Logic Design", desc: "거래 알고리즘 및 API 연동 아키텍처 설계 중", status: "IN_PROGRESS" },
    ],
    client: { name: "Crypto Systems", rating: 5.0, reviews: 8 },
  },
];

function MilestoneRow({ ms }) {
  const isCompleted  = ms.status === "COMPLETED";
  const isInProgress = ms.status === "IN_PROGRESS";
  const borderColor  = isCompleted ? "#DBEAFE" : isInProgress ? "#BFDBFE" : "#F1F5F9";
  const iconBg       = isCompleted ? "#1D4ED8" : isInProgress ? "#3B82F6" : "#CBD5E1";
  const statusLabel  = isCompleted ? "COMPLETED" : isInProgress ? "IN PROGRESS" : "PENDING";
  const statusColor  = isCompleted ? "#16A34A"   : isInProgress ? "#1D4ED8"     : "#94A3B8";
  return (
    <div style={{
      border: `1.5px solid ${borderColor}`, borderRadius: 10,
      padding: "12px 16px", marginBottom: 8,
      background: isInProgress ? "#F8FBFF" : "white",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isCompleted  && <span style={{ color: "white", fontSize: 14, fontWeight: 700 }}>✓</span>}
        {isInProgress && <span style={{ color: "white", fontSize: 14 }}>⊙</span>}
        {!isCompleted && !isInProgress && <span style={{ color: "white", fontSize: 12 }}>○</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>
            Milestone {ms.num}: {ms.title}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, fontFamily: F, letterSpacing: "0.04em" }}>
            {statusLabel}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: F, lineHeight: 1.5 }}>{ms.desc}</p>
      </div>
    </div>
  );
}

/* ── ProjectDetailDash 데이터 ─────────────────────────────── */
const PROJECT_DETAIL = {
  title: "AI 기반 지능형 Trading 감지 시스템 성능 향상",
  desc: "Trading의 행동 패턴을 분석하여 전략성능을 향상하는 AI 엔진 고도화 프로젝트입니다.",
  statusLabel: "진행 중", dDay: "D-45",
  currentMilestone: {
    title: "Core API 제출이 필요합니다",
    desc: "사용자의 행동 패턴을 분석하여 맞춤형 콘텐츠를 추천하는 AI 엔진 고도화 프로젝트입니다.",
    tags: ["React", "Node.js", "PostgreSQL"], progress: 40,
  },
  phases: [
    { num: 1, label: "Planning",    date: "2024.03.01", status: "done"    },
    { num: 2, label: "Development", date: "2024.03.11", status: "active"  },
    { num: 3, label: "Review",      date: "2024.05.20", status: "pending" },
    { num: 4, label: "Complete",    date: "2024.07.15", status: "pending" },
  ],
  client: { name: "Alex Miller", company: "Future Soft Tech", rating: 4.9 },
  agreementItems: ["작업 범위","최종 전달물","일정 및 미감일","총 금액","수정 가능 범위","완료 기준","추가 요청 / 범위 변경 규칙"],
  detailMilestones: [
    { badge: "완료",    title: "UI Design System",      start: "2024.03.01", end: "2024.03.10", extra: "산출물 제출: 2024.03.12", statusLabel: "Completed", statusColor: "#16A34A", btnLabel: "승인결과 확인",   btnStyle: "outline", escrow: { status: "정산 완료",       amount: "2,500,000" } },
    { badge: "진행 중", title: "Core API Development",  start: "2024.03.11", end: "2024.03.25", extra: "상태: D-3",               statusLabel: "Ongoing",   statusColor: "#1D4ED8", btnLabel: "제출사항 보기",  btnStyle: "primary", escrow: { status: "에스크로 보관 중", amount: "4,000,000" } },
    { badge: "재작업",  title: "Authentication Module", start: "2024.03.05", end: "2024.03.15", extra: "상태: 마감 임박",          statusLabel: "Rework",    statusColor: "#EF4444", btnLabel: "반려요청 완료", btnStyle: "danger",  escrow: { status: "결제 대기",       amount: "3,500,000" } },
  ],
  meeting: { date: "2024년 5월 18일 · 14:00", location: "Virtual (Zoom)", agenda: "API 명세서 최종 검토 및 개발 일정 조율", frequency: "정기: 주 1회" },
  files: [
    { icon: "pdf", name: "API_Spec_V2.pdf",         sender: "DevTeam-A",  date: "2024.03.14", size: "2.4 MB / PDF",  action: "download", message: "최신 API 명세서입니다. 3장 인증 부분 참고해주세요." },
    { icon: "fig", name: "Design_System_Draft.fig", sender: "Designer-K", date: "2024.03.12", size: "15 MB / FIG",   action: "download", message: "" },
  ],
  links: [
    { title: "Figma 디자인 시스템", url: "https://figma.com/file/abc123", addedBy: "DevTeam-A", date: "2024.03.14", description: "UI 컴포넌트 및 디자인 가이드라인이 정리된 Figma 파일입니다." },
    { title: "GitHub 저장소", url: "https://github.com/project/repo", addedBy: "Dev-Lead", date: "2024.03.10", description: "프로젝트 소스 코드 저장소입니다. main 브랜치 기준으로 개발 중입니다." },
    { title: "노션 프로젝트 문서", url: "https://notion.so/project-doc", addedBy: "PM-K", date: "2024.03.08", description: "" },
  ],
  alarms: [
    { bg: "#FFFBEB", border: "#FDE68A", icon: "📅", title: "Meeting Proposal Received",  desc: "Re: Architecture Review · Tomorrow 10 AM", btns: [{ label: "승인", s: "primary" },{ label: "거절", s: "danger" }] },
    { bg: "#EFF6FF", border: "#BFDBFE", icon: "📊", title: "Milestone Review Request",   desc: "Task: Core API Module needs approval",      btns: [{ label: "결과물 확인하기", s: "success", isReview: true }] },
    { bg: "#F8FAFC", border: "#E2E8F0", icon: "☁️", title: "File Received",              desc: "Project_Contract_Signed.pdf was uploaded",  btns: [{ label: "파일 보기", s: "link" }] },
  ],
};
/* ── 마일스톤 버튼 (hover 포함, 가로/세로 통일) ── */
function MilestoneBtn({ label, btnStyle }) {
  const [hov, setHov] = useState(false);
  const base = {
    width: 90, height: 36, borderRadius: 9,
    border: "none", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: F,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
    flexShrink: 0,
  };
  const styles = {
    outline: { bg: "#D1FAE5", bgHov: "#A7F3D0", color: "#065F46" },
    primary: { bg: "#DBEAFE", bgHov: "#BFDBFE", color: "#1E3A5F" },
    danger:  { bg: "#FEE2E2", bgHov: "#FECACA", color: "#DC2626" },
  };
  const s = styles[btnStyle] || styles.outline;
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, background: hov ? s.bgHov : s.bg, color: s.color }}
    >{label}</button>
  );
}

const MS_BADGE_COLORS = {
  "완료":    { bg: "#F0FFF4", border: "#86EFAC", text: "#16A34A" },
  "진행 중": { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8" },
  "재작업":  { bg: "#FFF1F2", border: "#FECDD3", text: "#EF4444" },
};

/* ── 알람 버튼 (hover 포함) ── */
function AlarmBtn({ label, s, onClick }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { bg: "#DBEAFE", bgHov: "#BFDBFE", color: "#1E3A5F" },
    danger:  { bg: "#FEE2E2", bgHov: "#FECACA", color: "#DC2626" },
    link:    { bg: "#F3E8FF", bgHov: "#DDD6FE", color: "#6D28D9" },
    success: { bg: "#D1FAE5", bgHov: "#A7F3D0", color: "#065F46" },
  };
  const st = styles[s] || styles.primary;
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: "6px 16px", borderRadius: 8, border: "none",
        background: hov ? st.bgHov : st.bg, color: st.color,
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F,
        transition: "background 0.15s",
      }}
    >{label}</button>
  );
}

const ESCROW_STYLES = {
  "결제 대기":        { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: "⏳" },
  "에스크로 보관 중": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: "🔒" },
  "납품 검수 중":     { bg: "#F5F3FF", color: "#5B21B6", border: "#C4B5FD", icon: "🔍" },
  "정산 완료":        { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC", icon: "✅" },
};

function EscrowPayModal({ msTitle, amount, onClose, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 20, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: F, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)", padding: "22px 26px 20px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.8, marginBottom: 6 }}>🔒 에스크로 결제</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>결제 예치 확인</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "white", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>
        <div style={{ padding: "24px 26px" }}>
          <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 13, color: "#0369A1", lineHeight: 1.7, fontFamily: F }}>
              예치된 금액은 DevBridge 에스크로 계좌에 안전하게 보관됩니다.<br/>
              파트너가 결과물을 납품하고 <strong>클라이언트가 승인</strong>할 때까지 자동 지급되지 않습니다.
            </span>
          </div>
          <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 4 }}>대상 마일스톤</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{msTitle}</div>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, color: "#374151", fontFamily: F }}>예치 금액</span>
              <span style={{ fontSize: 21, fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>₩{amount}원</span>
            </div>
            <div style={{ padding: "0 16px 14px", fontSize: 13, color: "#94A3B8", fontFamily: F }}>※ 수수료 5.5% (VAT 포함) 별도 적용</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 22, padding: "10px", background: "#F8FAFC", borderRadius: 10 }}>
            {[["💳 결제", "#3B82F6"], ["→", "#CBD5E1"], ["🔒 보관", "#6366F1"], ["→", "#CBD5E1"], ["🔍 검수", "#8B5CF6"], ["→", "#CBD5E1"], ["✅ 정산", "#16A34A"]].map(([text, color], i) => (
              <span key={i} style={{ fontSize: i % 2 === 1 ? 14 : 13, fontWeight: i % 2 === 0 ? 700 : 400, color, fontFamily: F }}>{text}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button onClick={onClose}
              onMouseEnter={e => e.currentTarget.style.background="#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background="white"}
              style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "white", fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>
              취소
            </button>
            <button onClick={onConfirm}
              onMouseEnter={e => e.currentTarget.style.background="linear-gradient(135deg,#2563eb,#4338ca)"}
              onMouseLeave={e => e.currentTarget.style.background="linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)"}
              style={{ padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)", fontSize: 15, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>
              🔒 에스크로 예치하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneReviewModal({ onClose, onApprove }) {
  const [reviewText, setReviewText] = useState("");
  const [copyToast, setCopyToast] = useState(false);
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {copyToast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#1E293B", color: "white", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F, zIndex: 10001, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", pointerEvents: "none" }}>
          ✅ 복사되었습니다
        </div>
      )}
      <div style={{ background: "white", borderRadius: 20, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: F }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 26px 16px", borderBottom: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>마일스톤 검토 요청</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 21, color: "#94A3B8", lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* 상단 카드 */}
          <div style={{ background: "#F0F5FF", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em" }}>MILESTONE #04</span>
              <span style={{ padding: "3px 10px", borderRadius: 99, background: "#E0E7FF", color: "#4F46E5", fontSize: 12, fontWeight: 700 }}>검토 대기 중</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#1E293B", marginBottom: 12 }}>보랜드 아이덴티티 및 가이드라인 구축</div>
            <div style={{ display: "flex", gap: 18, fontSize: 14, color: "#64748B" }}>
              <span>📅 2024.05.01 - 2024.05.15</span>
              <span>⏱ 잔여 2일</span>
            </div>
          </div>
          {/* 제출 파일 및 링크 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <span style={{ fontSize: 17 }}>📎</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>제출 파일 및 링크</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>Brand_Guideline_v1.2...</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>14.5 MB</div>
                  </div>
                </div>
                <button onClick={() => { const a = document.createElement("a"); a.href="#"; a.download="Brand_Guideline_v1.2.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                  onMouseEnter={e => e.currentTarget.style.color="#3B82F6"}
                  onMouseLeave={e => e.currentTarget.style.color="#94A3B8"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", transition: "color 0.15s", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </div>
              <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F0FFF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>Figma Design System</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>figma.com/file/...</div>
                  </div>
                </div>
                <button onClick={() => handleCopy("https://figma.com/file/abc123")}
                  onMouseEnter={e => e.currentTarget.style.color="#16A34A"}
                  onMouseLeave={e => e.currentTarget.style.color="#94A3B8"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", transition: "color 0.15s", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><path d="M10 14L21 3"/><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>
                </button>
              </div>
            </div>
          </div>
          {/* 파트너 메모 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <span style={{ fontSize: 17 }}>💬</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>파트너 메모</span>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
              "브랜드 가이드라인의 핵심 요소인 컴러 시스템과 타이포그래피 원칙을 재정립하였습니다. 특히 디지털 환경에서의 가독성을 최우선으로 고려하여 폰트 스케일을 조정했으며, 협업 도구에서 즉시 활용 가능한 에셈 링크를 첨부합니다. 검토 부탁드립니다."
            </div>
          </div>
          {/* 검토 결과 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 10 }}>검토 결과 결정</div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="반려 시 사유를 입력해주세요. 승인 시에는 생략 가능합니다."
              style={{ width: "100%", minHeight: 100, borderRadius: 10, border: "1.5px solid #E2E8F0", padding: "12px 14px", fontSize: 14, color: "#475569", fontFamily: F, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
            />
          </div>
        </div>
        {/* 액션 버튼 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 26px 24px" }}>
          <button
            onMouseEnter={e => e.currentTarget.style.background="#FEE2E2"}
            onMouseLeave={e => e.currentTarget.style.background="#FFF1F2"}
            style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #FECDD3", background: "#FFF1F2", fontSize: 15, fontWeight: 700, color: "#DC2626", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}>
            <span>←</span> 반려 (재작업 요청)
          </button>
          <button
            onClick={() => { onApprove?.(); onClose(); }}
            onMouseEnter={e => e.currentTarget.style.background="#DBEAFE"}
            onMouseLeave={e => e.currentTarget.style.background="#EFF6FF"}
            style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #BFDBFE", background: "#EFF6FF", fontSize: 15, fontWeight: 700, color: "#1D4ED8", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> 승인 완료
          </button>
        </div>
      </div>
    </div>
  );
}


const CONTRACT_MODAL_DEFS = [
  { key: "scope",       label: "1.  작업 범위",             Component: ScopeModal },
  { key: "deliverable", label: "2. 최종 전달물 정의서",     Component: DeliverablesModal },
  { key: "schedule",    label: "3. 마감 일정 및 마일스톤", Component: ScheduleModal },
  { key: "payment",     label: "4. 총 금액",               Component: PaymentModal },
  { key: "revision",    label: "5. 수정 가능 범위",         Component: RevisionModal },
  { key: "completion",  label: "6. 완료 기준",              Component: CompletionModal },
  { key: "terms",       label: "7. 추가 특약 (선택)",       Component: SpecialTermsModal },
];
const INITIAL_CONTRACT_STATUSES = {
  scope: "협의완료",
  deliverable: "협의완료",
  schedule: "협의완료",
  payment: "협의완료",
  revision: "협의완료",
  completion: "협의완료",
  terms: "논의 중",
};
function contractStatusStyle(s) {
  if (s === "논의 중") return { bg: "#FEF3C7", text: "#D97706" };
  if (s === "제안됨")  return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (s === "확정")    return { bg: "#DCFCE7", text: "#16A34A" };
  if (s === "협의완료") return { bg: "#DCFCE7", text: "#16A34A" };
  return { bg: "#F1F5F9", text: "#64748B" };
}

const isAgreementCompleted = (s) => s === "확정" || s === "협의완료";

function EscrowDetailModal({ ms, eStatus, projectName, onClose }) {
  const es = ESCROW_STYLES[eStatus] || ESCROW_STYLES["결제 대기"];
  const isSettled = eStatus === "정산 완료";
  const rows = [
    { label: "프로젝트", value: projectName },
    { label: "마일스톤", value: ms.title },
    { label: "진행 기간", value: `${ms.start} ~ ${ms.end}` },
    ...(isSettled ? [{ label: "정산 완료일", value: ms.end, highlight: true }] : []),
    { label: "에스크로 금액", value: `₩${ms.escrow?.amount}`, bold: true },
  ];
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ background: "white", borderRadius: 20, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: F, overflow: "hidden" }}>
        <div style={{ background: isSettled ? "linear-gradient(135deg,#065F46,#059669)" : "linear-gradient(135deg,#1e3a5f,#1e40af)", padding: "20px 24px 18px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.8, marginBottom: 6, fontFamily: F }}>🔒 에스크로 상세 정보</div>
              <div style={{ fontSize: 19, fontWeight: 800, fontFamily: F }}>{ms.title}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "white", fontSize: 19, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>
        <div style={{ padding: "22px 24px 20px" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500, fontFamily: F }}>{r.label}</span>
              <span style={{ fontSize: r.bold ? 15 : 14, fontWeight: r.bold ? 800 : 600, color: r.highlight ? "#059669" : r.bold ? "#1D4ED8" : "#1E293B", fontFamily: F }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0 4px" }}>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500, fontFamily: F }}>상태</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: es.color, background: es.bg, border: `1px solid ${es.border}`, borderRadius: 99, padding: "3px 10px", fontFamily: F }}>{es.icon} {eStatus}</span>
          </div>
          <button
            onClick={onClose}
            style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f1f5f9,#e0e7ff)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F }}
          >닫기</button>
        </div>
      </div>
    </div>
  );
}

function ProjectDetailDash({ projectName, onBack, onGoSchedule, onGoMeeting }) {
  const d = PROJECT_DETAIL;
  const [fileTab, setFileTab] = useState("files");
  const [copyToast, setCopyToast] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [openContractModal, setOpenContractModal] = useState(null);
  const [contractItemStatuses, setContractItemStatuses] = useState(INITIAL_CONTRACT_STATUSES);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState(d.files);
  const [linkList, setLinkList] = useState(d.links);
  const [linkForm, setLinkForm] = useState({ url: "", title: "", desc: "" });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef(null);
  const [escrowStatuses, setEscrowStatuses] = useState(
    () => Object.fromEntries(d.detailMilestones.map((ms, i) => [i, ms.escrow?.status || "결제 대기"]))
  );
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [escrowTargetIdx, setEscrowTargetIdx] = useState(null);
  const [escrowDetailIdx, setEscrowDetailIdx] = useState(null);
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };
  return (
    <div style={{ position: "relative" }}>
      {showReviewModal && <MilestoneReviewModal
        onClose={() => setShowReviewModal(false)}
        onApprove={() => {
          const idx = Object.keys(escrowStatuses).find(k => escrowStatuses[k] === "납품 검수 중");
          if (idx !== undefined) setEscrowStatuses(prev => ({ ...prev, [idx]: "정산 완료" }));
        }}
      />}
      {showEscrowModal && escrowTargetIdx !== null && (
        <EscrowPayModal
          msTitle={d.detailMilestones[escrowTargetIdx]?.title}
          amount={d.detailMilestones[escrowTargetIdx]?.escrow?.amount || "0"}
          onClose={() => { setShowEscrowModal(false); setEscrowTargetIdx(null); }}
          onConfirm={() => { setEscrowStatuses(prev => ({ ...prev, [escrowTargetIdx]: "에스크로 보관 중" })); setShowEscrowModal(false); setEscrowTargetIdx(null); }}
        />
      )}
      {copyToast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#1E293B", color: "white", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", pointerEvents: "none" }}>
          ✅ 복사되었습니다
        </div>
      )}
      {/* ── 외부 링크 추가 모달 ── */}
      {showAddLinkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddLinkModal(false)}>
          <div style={{ background: "white", borderRadius: 20, padding: "36px 36px 28px", width: 480, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>외부 링크 추가</h3>
                <p style={{ fontSize: 14, color: "#64748B", margin: 0, fontFamily: F }}>프로젝트와 관련된 유용한 자료나 외부 문서 링크를 공유하세요.</p>
              </div>
              <button onClick={() => setShowAddLinkModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 25, color: "#94A3B8", lineHeight: 1, padding: "0 0 0 16px" }}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6, fontFamily: F }}>링크 URL <span style={{ color: "#EF4444" }}>*</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", background: "#FAFAFA" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <input value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} placeholder="https://" style={{ flex: 1, border: "none", background: "none", fontSize: 15, fontFamily: F, outline: "none", color: "#374151" }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6, fontFamily: F }}>링크 제목 <span style={{ color: "#EF4444" }}>*</span></label>
              <input value={linkForm.title} onChange={e => setLinkForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 디자인 가이드라인, 레퍼런스 문서 등" style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", fontSize: 15, fontFamily: F, outline: "none", color: "#374151", background: "#FAFAFA", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6, fontFamily: F }}>설명 (선택)</label>
              <textarea value={linkForm.desc} onChange={e => setLinkForm(f => ({ ...f, desc: e.target.value }))} rows={4} placeholder="링크에 대한 간단한 설명을 입력해주세요..." style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", fontSize: 15, fontFamily: F, outline: "none", color: "#374151", background: "#FAFAFA", boxSizing: "border-box", resize: "none" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", marginBottom: 24 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span style={{ fontSize: 13, color: "#3B82F6", fontFamily: F, lineHeight: 1.6 }}>추가된 링크는 프로젝트 팀 모두가 확인할 수 있습니다. 중요한 보안 정보가 포함된 외부 링크 공유 시 주의해 주세요.</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (!linkForm.url || !linkForm.title) return;
                  const today = new Date();
                  const ds = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
                  setLinkList(prev => [...prev, { title: linkForm.title, url: linkForm.url, description: linkForm.desc, addedBy: "나", date: ds }]);
                  setLinkForm({ url: "", title: "", desc: "" });
                  setShowAddLinkModal(false);
                  setFileTab("links");
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── 파일 전송 모달 ── */}
      {showFileUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowFileUploadModal(false); setUploadFiles([]); setUploadMsg(""); }}>
          <div style={{ background: "white", borderRadius: 20, padding: "36px 36px 28px", width: 520, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.22)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>파일 전송하기</h3>
              <button onClick={() => { setShowFileUploadModal(false); setUploadFiles([]); setUploadMsg(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 25, color: "#94A3B8", lineHeight: 1 }}>×</button>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={e => { const sel = Array.from(e.target.files); setUploadFiles(prev => [...prev, ...sel.map(file => ({ name: file.name, size: (file.size/1024/1024).toFixed(1)+" MB", progress: 100 }))]); e.target.value = ""; }} />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.background = "#EFF6FF"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#FAFAFA"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#FAFAFA"; const dropped = Array.from(e.dataTransfer.files); setUploadFiles(prev => [...prev, ...dropped.map(file => ({ name: file.name, size: (file.size/1024/1024).toFixed(1)+" MB", progress: 100 }))]); }}
              style={{ border: "2px dashed #E5E7EB", borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: "#FAFAFA", marginBottom: 20, transition: "border-color 0.15s, background 0.15s" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 15, fontFamily: F, color: "#1E293B" }}>여기로 파일을 끌어오거나 <span style={{ color: "#3B82F6", fontWeight: 600 }}>클릭하여 선택</span>하세요</p>
              <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", fontFamily: F }}>지원 형식: PDF, DOCX, JPG, PNG (최대 50MB)</p>
            </div>
            {uploadFiles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: F, marginBottom: 10 }}>첨부된 파일 ({uploadFiles.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploadFiles.map((uf, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 19 }}>📄</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", fontFamily: F, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uf.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{uf.size}</span>
                          <span style={{ fontSize: 13, color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>• 완료</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#E5E7EB" }}><div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#3B82F6" }} /></div>
                        </div>
                      </div>
                      <button onClick={() => setUploadFiles(prev => prev.filter((_,j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#94A3B8", flexShrink: 0 }}>🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: F, marginBottom: 6 }}>전달 메시지 (선택 사항)</div>
              <textarea value={uploadMsg} onChange={e => setUploadMsg(e.target.value)} rows={3} placeholder="전달할 내용이나 참고사항을 입력하세요..." style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 14px", fontSize: 15, fontFamily: F, outline: "none", color: "#374151", background: "#FAFAFA", boxSizing: "border-box", resize: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (uploadFiles.length === 0) return;
                  const today = new Date();
                  const ds = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
                  const newFs = uploadFiles.map(uf => ({ icon: uf.name.toLowerCase().endsWith(".pdf") || uf.name.toLowerCase().endsWith(".docx") ? "pdf" : "fig", name: uf.name, sender: "나", date: ds, size: uf.size, message: uploadMsg || "" }));
                  setFileList(prev => [...prev, ...newFs]);
                  setUploadFiles([]);
                  setUploadMsg("");
                  setShowFileUploadModal(false);
                  setFileTab("files");
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                전송하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── 링크 상세 팝업 ── */}
      {selectedLink && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedLink(null)}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 36px", width: 440, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>링크 정보</h3>
              <button onClick={() => setSelectedLink(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 25, color: "#94A3B8", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 23 }}>🔗</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#3B82F6", fontFamily: F }}>{selectedLink.title}</span>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, marginBottom: 4 }}>URL</div>
              <a href={selectedLink.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#3B82F6", fontFamily: F, wordBreak: "break-all" }}>{selectedLink.url}</a>
            </div>
            {selectedLink.description && (
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, marginBottom: 4 }}>설명</div>
                <p style={{ fontSize: 14, color: "#374151", fontFamily: F, margin: 0, lineHeight: 1.6 }}>{selectedLink.description}</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748B", fontFamily: F }}>
              <span>추가자: <strong style={{ color: "#374151" }}>{selectedLink.addedBy}</strong></span>
              <span>날짜: <strong style={{ color: "#374151" }}>{selectedLink.date}</strong></span>
            </div>
          </div>
        </div>
      )}
      {/* ── 파일 상세 팝업 ── */}
      {selectedFile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedFile(null)}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 36px", width: 440, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>파일 상세</h3>
              <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 25, color: "#94A3B8", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#F8FAFC", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
              <span style={{ fontSize: 37 }}>{selectedFile.icon === "pdf" ? "📄" : "🖼"}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 2 }}>{selectedFile.name}</div>
                <div style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{selectedFile.size}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#64748B", fontFamily: F, marginBottom: selectedFile.message ? 16 : 0 }}>
              <span>전송자: <strong style={{ color: "#374151" }}>{selectedFile.sender}</strong></span>
              <span>날짜: <strong style={{ color: "#374151" }}>{selectedFile.date}</strong></span>
            </div>
            {selectedFile.message && (
              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", marginTop: 16 }}>
                <div style={{ fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 700, marginBottom: 4 }}>전달 메시지</div>
                <p style={{ fontSize: 14, color: "#374151", fontFamily: F, margin: 0, lineHeight: 1.6 }}>{selectedFile.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* breadcrumb + 제목 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: "#94A3B8", fontFamily: F, marginBottom: 8 }}>
          <span style={{ cursor: "pointer", color: "#3B82F6" }} onClick={onBack}>Dashboard</span>{" / "}
          <span>Project Progress</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: "#1E293B", margin: "0 0 6px", fontFamily: F }}>{projectName || d.title}</h2>
            <p style={{ fontSize: 14.5, color: "#64748B", margin: 0, fontFamily: F }}>{d.desc}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "#F0FFF4", border: "1px solid #BBF7D0" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#16A34A", fontFamily: F }}>{d.statusLabel} · {d.dDay}</span>
            </div>
            <button
              onClick={() => onGoMeeting?.()}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(99,102,241,0.28)"; }}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 3px 10px rgba(99,102,241,0.28)", transition: "background 0.15s, box-shadow 0.15s" }}>
              미팅으로 이동하기
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {/* ── 왼쪽 메인 ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 협의 항목 모달 - 제목/부제목 아래, 왼쪽 메인 영역 상단 */}
          {openContractModal && (() => {
            const def = CONTRACT_MODAL_DEFS.find(m => m.key === openContractModal);
            const ModalComp = def?.Component;
            if (!ModalComp) return null;
            return (
              <ModalComp
                inline={true}
                onClose={() => setOpenContractModal(null)}
                onSubmit={() => { setContractItemStatuses(prev => ({ ...prev, [openContractModal]: "제안됨" })); setOpenContractModal(null); }}
                onAccept={() => { setContractItemStatuses(prev => ({ ...prev, [openContractModal]: "확정" })); setOpenContractModal(null); }}
                showHeaderStatusBadge={false}
                moduleStatus={contractItemStatuses[openContractModal]}
              />
            );
          })()}

          {/* 현재 마일스톤 + Progress + Phase stepper */}
          <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "20px 22px", background: "white" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: "0 0 6px", fontFamily: F }}>
              두번째 마일스톤 ✅ {d.currentMilestone.title}
            </h3>
            <p style={{ fontSize: 14.5, color: "#64748B", margin: "0 0 14px", fontFamily: F, lineHeight: 1.6 }}>{d.currentMilestone.desc}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {d.currentMilestone.tags.map(t => (
                <span key={t} style={{ padding: "4px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 13.5, color: "#475569", fontFamily: F }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: "#3B82F6", fontFamily: F }}>Progress Status</span>
              <span style={{ fontSize: 19.5, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{d.currentMilestone.progress}%</span>
            </div>
            <div style={{ width: "100%", height: 8, borderRadius: 99, background: "#F1F5F9", marginBottom: 24, overflow: "hidden" }}>
              <div style={{ width: `${d.currentMilestone.progress}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }} />
            </div>
            {/* Phase stepper */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: 17, left: "10%", right: "10%", height: 2, background: "#E2E8F0", zIndex: 0 }} />
              {d.phases.map(ph => {
                const isDone = ph.status === "done"; const isActive = ph.status === "active";
                return (
                  <div key={ph.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: isDone ? "#3B82F6" : isActive ? "white" : "#F1F5F9", border: isActive ? "2.5px solid #3B82F6" : isDone ? "none" : "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, fontWeight: 700, color: isDone ? "white" : isActive ? "#3B82F6" : "#94A3B8", boxShadow: isDone || isActive ? "0 2px 8px rgba(59,130,246,0.18)" : "none" }}>{ph.num}</div>
                    <span style={{ fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: isActive ? "#3B82F6" : isDone ? "#374151" : "#94A3B8", fontFamily: F, marginTop: 6, textAlign: "center" }}>{ph.label}</span>
                    <span style={{ fontSize: 12.5, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>{ph.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 클라이언트 */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "14px 22px", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#94A3B8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#94A3B8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{d.client.name}</div>
                <div style={{ fontSize: 13.5, color: "#64748B", fontFamily: F }}>{d.client.company}</div>
              </div>
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: "#1E293B", fontFamily: F }}>
              <span style={{ color: "#F59E0B" }}>★</span> {d.client.rating}{" "}
              <span style={{ fontWeight: 400, fontSize: 14.5, color: "#64748B" }}>Rating</span>
            </div>
          </div>

          {/* 마일스톤 진행 */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "20px 22px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>마일스톤 진행</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13.5, color: "#3B82F6", fontFamily: F, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>🔄 변경 내역</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.detailMilestones.map((ms, i) => {
                const bc = MS_BADGE_COLORS[ms.badge] || { bg: "#F1F5F9", border: "#E2E8F0", text: "#475569" };
                const eStatus = escrowStatuses[i] || "결제 대기";
                const es = ESCROW_STYLES[eStatus] || ESCROW_STYLES["결제 대기"];
                return (
                  <div key={i} style={{ border: `1.5px solid ${eStatus === "정산 완료" ? "#BBF7D0" : eStatus === "납품 검수 중" ? "#C4B5FD" : "#F1F5F9"}`, borderRadius: 10, padding: "14px 18px", background: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: bc.bg, border: `1px solid ${bc.border}`, color: bc.text, fontFamily: F }}>{ms.badge}</span>
                          <span style={{ fontSize: 14.5, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{ms.title}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "#64748B", fontFamily: F, display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <span>시작일: <strong style={{ color: "#374151" }}>{ms.start}</strong></span>
                          <span>마감일: <strong style={{ color: "#374151" }}>{ms.end}</strong></span>
                          <span style={{ color: ms.badge !== "완료" ? "#EF4444" : "#374151" }}>{ms.extra}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: ms.statusColor, fontFamily: F, minWidth: 60, textAlign: "right" }}>{ms.statusLabel}</span>
                        <MilestoneBtn label={ms.btnLabel} btnStyle={ms.btnStyle} />
                      </div>
                    </div>
                    {/* 에스크로 상태 바 */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: es.bg, border: `1px solid ${es.border}` }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: es.color, fontFamily: F, display: "flex", alignItems: "center", gap: 5 }}>
                        {es.icon} {eStatus}
                        <span style={{ fontWeight: 500, color: "#64748B", marginLeft: 6, fontSize: 11.5 }}>₩{ms.escrow?.amount}원</span>
                      </span>
                      {eStatus === "결제 대기" && (
                        <button onClick={() => { setEscrowTargetIdx(i); setShowEscrowModal(true); }}
                          onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                          onMouseLeave={e => e.currentTarget.style.opacity="1"}
                          style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                          결제 예치하기
                        </button>
                      )}
                      {eStatus === "에스크로 보관 중" && (
                        <span style={{ fontSize: 11.5, color: "#64748B", fontFamily: F }}>⏳ 파트너 작업 진행 중...</span>
                      )}
                      {eStatus === "납품 검수 중" && (
                        <button onClick={() => setShowReviewModal(true)}
                          onMouseEnter={e => e.currentTarget.style.background="#D1FAE5"}
                          onMouseLeave={e => e.currentTarget.style.background="#F0FDF4"}
                          style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #86EFAC", background: "#F0FDF4", color: "#15803D", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>
                          결과물 검수
                        </button>
                      )}
                      {eStatus === "정산 완료" && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", fontFamily: F }}>✅ 정산 지급 완료</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Files */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "20px 22px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 0 }}>
                {[["files","Files"],["links","External Links"]].map(([key, label]) => (
                  <button key={key} onClick={() => setFileTab(key)} style={{ padding: "4px 16px 10px", border: "none", background: "none", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: F, color: fileTab === key ? "#3B82F6" : "#94A3B8", borderBottom: fileTab === key ? "2.5px solid #3B82F6" : "2.5px solid transparent" }}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowAddLinkModal(true)}
                  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#e8ecf0,#dde3ea)"}
                  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#f4f6f8,#e8ecf0)"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "linear-gradient(135deg,#f4f6f8,#e8ecf0)", fontSize: 12.5, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>🔗 링크 추가</button>
                <button
                  onClick={() => setShowFileUploadModal(true)}
                  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#93c5fd,#60a5fa)"}
                  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#bfdbfe,#93c5fd)"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#bfdbfe,#93c5fd)", color: "#1e3a5f", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>↑ 파일 전송</button>
              </div>
            </div>
            {fileTab === "files" ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  {["FILENAME","SENDER","DATE","SIZE/TYPE","다운로드"].map(h => (
                    <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: "0.05em" }}>{h}</span>
                  ))}
                </div>
                {fileList.map((f, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", padding: "13px 12px", borderBottom: i < fileList.length - 1 ? "1px solid #F8FAFC" : "none", alignItems: "center" }}>
                    <div onClick={() => setSelectedFile(f)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#1E293B", fontFamily: F, cursor: "pointer" }}><span style={{ fontSize: 16 }}>{f.icon === "pdf" ? "📄" : "🖼"}</span>{f.name}</div>
                    <span style={{ fontSize: 13.5, color: "#475569", fontFamily: F }}>{f.sender}</span>
                    <span style={{ fontSize: 13.5, color: "#475569", fontFamily: F }}>{f.date}</span>
                    <span style={{ fontSize: 13.5, color: "#475569", fontFamily: F }}>{f.size}</span>
                    <button
                      onClick={() => { const a = document.createElement("a"); a.href = "#"; a.download = f.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#3B82F6"; e.currentTarget.style.transform = "scale(1.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.transform = "scale(1)"; }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748B", transition: "color 0.15s, transform 0.15s" }}>⬇</button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 60px", padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  {["링크 이름","추가자","날짜","복사"].map(h => (
                    <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: "0.05em" }}>{h}</span>
                  ))}
                </div>
                {linkList.map((lk, i) => (
                  <div key={i}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 60px", padding: "13px 12px", borderBottom: i < linkList.length - 1 ? "1px solid #F8FAFC" : "none", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#3B82F6", fontFamily: F, fontWeight: 600 }}>
                      <span style={{ fontSize: 15 }}>🔗</span>
                      <span onClick={() => setSelectedLink(lk)} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline" }}>{lk.title}</span>
                    </div>
                    <span style={{ fontSize: 13.5, color: "#475569", fontFamily: F }}>{lk.addedBy}</span>
                    <span style={{ fontSize: 13.5, color: "#475569", fontFamily: F }}>{lk.date}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleCopyLink(lk.url); }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#3B82F6"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8", transition: "color 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alarms */}
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F, margin: "0 0 14px" }}>Recent Alarms</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {d.alarms.map((alarm, i) => (
                <div key={i} style={{ background: alarm.bg, border: `1.5px solid ${alarm.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{alarm.icon}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 4 }}>{alarm.title}</div>
                  <div style={{ fontSize: 12.5, color: "#64748B", fontFamily: F, marginBottom: 0, lineHeight: 1.5, flex: 1 }}>{alarm.desc}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                    {alarm.btns.map((btn, j) => (
                      <AlarmBtn key={j} label={btn.label} s={btn.s} onClick={btn.isReview ? () => setShowReviewModal(true) : undefined} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 오른쪽 사이드바 ── */}
        <div style={{ width: 296, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 협의 항목 요약 */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "8px 5px", background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>계약 세부 협의 항목</h4>
              </div>
              {(() => {
                const cnt = Object.values(contractItemStatuses).filter(isAgreementCompleted).length;
                return <span style={{ fontSize: 11, fontWeight: 700, color: cnt === 7 ? "#16A34A" : "#3B82F6", background: cnt === 7 ? "#F0FDF4" : "#EFF6FF", border: `1px solid ${cnt === 7 ? "#BBF7D0" : "#BFDBFE"}`, borderRadius: 99, padding: "2px 8px", fontFamily: F }}>진행률 {Math.round((cnt / 7) * 100)}%</span>;
              })()}
            </div>
            {CONTRACT_MODAL_DEFS.map((m) => {
              const ss = contractStatusStyle(contractItemStatuses[m.key]);
              return (
                <div
                  key={m.key}
                  onClick={() => setOpenContractModal(m.key)}
                  onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px", borderRadius: 6, marginBottom: 1, cursor: "pointer", transition: "background 0.15s", border: "1px solid transparent" }}
                >
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, fontFamily: F }}>{m.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ss.text, background: ss.bg, borderRadius: 99, padding: "2px 7px", fontFamily: F, flexShrink: 0 }}>{contractItemStatuses[m.key]}</span>
                    <span style={{ fontSize: 15, color: "#C4C9D4" }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Project Meeting */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "8px 5px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>Project Meeting</span>
              <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: F }}>{d.meeting.frequency}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#374151", fontFamily: F }}><span style={{ flexShrink: 0 }}>📅</span><span>{d.meeting.date}</span></div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#374151", fontFamily: F }}><span style={{ flexShrink: 0 }}>📍</span><span>{d.meeting.location}</span></div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#64748B", fontFamily: F, lineHeight: 1.4 }}><span style={{ flexShrink: 0 }}>📋</span><span>{d.meeting.agenda}</span></div>
            </div>
            <button
              onClick={() => onGoSchedule?.()}
              onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#c7d2fe,#a5b4fc)"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#f1f5f9,#e0e7ff)"}
              style={{ width: "100%", padding: "6px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f1f5f9,#e0e7ff)", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s" }}>
             스케줄 캘린더 이동
            </button>
          </div>
          {/* 에스크로 현황 */}
          <div style={{ border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "8px 5px", background: "linear-gradient(160deg,#EFF6FF,#F5F3FF)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <span style={{ fontSize: 15 }}>🔒</span>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>에스크로 현황</h4>
            </div>
            {d.detailMilestones.map((ms, i) => {
              const eStatus = escrowStatuses[i] || "결제 대기";
              const es = ESCROW_STYLES[eStatus] || ESCROW_STYLES["결제 대기"];
              return (
                <div
                  key={i}
                  onClick={() => setEscrowDetailIdx(i)}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,246,255,0.8)"; e.currentTarget.style.borderRadius = "8px"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderRadius = "0"; }}
                  style={{ cursor: "pointer", padding: "6px 3px", transition: "background 0.15s", borderBottom: i < d.detailMilestones.length - 1 ? "1px solid #E0EAFF" : "none" }}
                >
                  <div style={{ fontSize: 12, color: "#64748B", fontFamily: F, marginBottom: 4, lineHeight: 1.4 }}>{ms.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: es.color, background: es.bg, border: `1px solid ${es.border}`, borderRadius: 99, padding: "2px 8px", fontFamily: F }}>{es.icon} {eStatus}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>₩{ms.escrow?.amount}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid #BFDBFE", marginTop: 8, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: F }}>총 계약금</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>₩10,000,000</span>
            </div>
          </div>
        </div>
      </div>
      {escrowDetailIdx !== null && (
        <EscrowDetailModal
          ms={d.detailMilestones[escrowDetailIdx]}
          eStatus={escrowStatuses[escrowDetailIdx] || "결제 대기"}
          projectName={projectName}
          onClose={() => setEscrowDetailIdx(null)}
        />
      )}
    </div>
  );
}

function ProjectManageTab({ onGoSchedule, initialSelectedId, onOpenProjectMeeting }) {
  return (
    <ProjectManageTabLive
      role="CLIENT"
      initialSelectedId={initialSelectedId}
      onGoSchedule={onGoSchedule}
      onOpenProjectMeeting={onOpenProjectMeeting}
    />
  );
}

/* ── GuaranteeTab (데브 브릿지 안심 계약) ─────────────────── */
function GuaranteeTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 6px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        데브브릿지 안심계약
      </h2>
      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px", fontFamily: F, lineHeight: 1.7 }}>
        안전하고 편리한 IT 아웃소싱 환경을 위한 대금보호, 표준계약서, 전담 매니저 지원.
      </p>
      <div style={{
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
      }}>
        <img src={contractionImg} alt="데브브릿지 안심계약" style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  );
}

/* ── PortfolioAddTab ─────────────────────────────────────────── */
const MOCK_ONGOING_FOR_PORTFOLIO = [
  {
    id: 1, badge: "유료",
    title: "AI 기반 이상 거래 탐지 시스템 고도화",
    desc: "금융 데이터 분석을 통한 실시간 이상 거래 탐지 모델 최적화 및 API 개발",
    tags: ["#AI/ML", "#Python", "#Fintech"],
    endDate: "2024.11.20", period: "3개월",
  },
  {
    id: 2, badge: "무료",
    title: "이커머스 플랫폼 모바일 앱 리뉴얼",
    desc: "사용자 경험 중심의 UI/UX 개편 및 Flutter 기반 크로스 플랫폼 앱 개발",
    tags: ["#Mobile", "#Web", "#Flutter"],
    endDate: "2024.11.18", period: "4개월",
  },
];

const MOCK_SELECTED_FOR_PORTFOLIO = [
  {
    id: 1,
    satisfaction: "조금 불만족했어요",
    satisfBg: "#FFF7ED", satisfBorder: "#FED7AA", satisfColor: "#C2410C",
    title: "블록체인 기반 공급망 관리 시스템 구축",
    desc: "물류 프로세스 투명성 확보를 위한 이더리움 기반 스마트 컨트랙트 개발",
    tags: ["#Blockchain", "#Solidity"],
    endDate: "2024.11.01", writeDate: "2024.11.05",
    commentText: "더 발전할 수 있게 코멘트를 남겨주셨어요",
    commentColor: "#F97316",
    added: false,
  },
  {
    id: 2,
    satisfaction: "너무 만족했어요",
    satisfBg: "#ECFDF5", satisfBorder: "#A7F3D0", satisfColor: "#065F46",
    title: "메타버스 협업 툴 시각화 모듈 개발",
    desc: "Three.js를 활용한 웹 기반 3D 데이터 시각화 엔진 고도화 및 최적화",
    tags: ["#Three.js", "#WebGL"],
    endDate: "2024.10.15", writeDate: "2024.10.20",
    commentText: "별점만 있고 남겨진 코멘트가 없어요",
    commentColor: "#94A3B8",
    added: true,
  },
  {
    id: 3,
    satisfaction: "매우 훌륭했어요",
    satisfBg: "#F0FDFA", satisfBorder: "#99F6E4", satisfColor: "#0F766E",
    title: "Global Finance App",
    desc: "다양한 통화 지원 및 실시간 자산 관리 기능을 갖춘 글로벌 핀테크 모바일 애플리케이션",
    tags: ["#React-Native", "#Fintech"],
    endDate: "2024.09.28", writeDate: "2024.10.05",
    commentText: "최고의 파트너라는 극찬을 받았습니다",
    commentColor: "#0F766E",
    added: true,
  },
  {
    id: 4,
    satisfaction: "협업이 즐거웠어요",
    satisfBg: "#F5F3FF", satisfBorder: "#C4B5FD", satisfColor: "#5B21B6",
    title: "AI Logistics Dashboard",
    desc: "물류 공급망 최적화를 위한 AI 기반 예측 분석 및 대화형 데이터 시각화 대시보드",
    tags: ["#Python", "#Data-Viz"],
    endDate: "2024.08.12", writeDate: "2024.08.20",
    commentText: "깔끔한 인터페이스에 만족하셨습니다",
    commentColor: "#94A3B8",
    added: false,
  },
];

/* ── 포트폴리오 토글 스위치 ── */
function ToggleSwitch({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 99,
        background: on ? "#3B82F6" : "#D1D5DB",
        position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

function PortfolioAddTab() {
  const navigate = useNavigate();
  const [ongoingAdded, setOngoingAdded] = useState(
    Object.fromEntries(MOCK_ONGOING_FOR_PORTFOLIO.map(p => [p.id, true]))
  );
  const [selectedAdded, setSelectedAdded] = useState(
    Object.fromEntries(MOCK_SELECTED_FOR_PORTFOLIO.map(p => [p.id, p.added]))
  );

  return (
    <div>
      {/* ── 섹션 1: 진행 중인 프로젝트 ── */}
      <div style={{ marginBottom: 52 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              진행 중인 추가할 수 있는 Projects
            </h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, fontFamily: F, lineHeight: 1.6 }}>
              현재 수행중인 프로젝트 목록입니다. 프로젝트 대시보드 버튼을 클릭해서 상세 진행관리 대시보드를 확인하실 수 있습니다.
            </p>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0, flexShrink: 0 }}>
            전체 진행한 프로젝트 보기 &gt;
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1.5px solid #F1F5F9", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {MOCK_ONGOING_FOR_PORTFOLIO.map((proj, idx) => {
            const isLast = idx === MOCK_ONGOING_FOR_PORTFOLIO.length - 1;
            return (
              <div key={proj.id} style={{ padding: "20px 22px", background: "white", borderBottom: isLast ? "none" : "1.5px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F, flexShrink: 0 }}>{proj.badge}</span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
                  </div>
                  {/* 버튼 + 토글 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, marginLeft: 20 }}>
                    <button style={{ padding: "10px 26px", borderRadius: 10, border: "none", background: "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
                      onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
                    onClick={() => navigate("/portfolio_detail_editor", { state: { projectTitle: proj.title, projectId: proj.id } })}
                    >상세 작성 하기</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>포트폴리오에 추가</span>
                      <ToggleSwitch on={ongoingAdded[proj.id]} onChange={v => setOngoingAdded(p => ({ ...p, [proj.id]: v }))} />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>
                  완료일: {proj.endDate}&nbsp;&nbsp;총 기간: {proj.period}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 섹션 2: Selected Projects ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Selected Projects
            </h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, fontFamily: F, lineHeight: 1.6 }}>
              클라이언트가 작성을 완료한 후기들입니다. 다른 클라이언트들에게 전달되어 파트너의 신뢰도를 높여줍니다.
            </p>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0, flexShrink: 0 }}>
            전체 작성 내역 보기 &gt;
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1.5px solid #F1F5F9", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {MOCK_SELECTED_FOR_PORTFOLIO.map((proj, idx) => {
            const isLast = idx === MOCK_SELECTED_FOR_PORTFOLIO.length - 1;
            return (
              <div key={proj.id} style={{ padding: "20px 22px", background: "white", borderBottom: isLast ? "none" : "1.5px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: proj.satisfBg, border: `1px solid ${proj.satisfBorder}`, color: proj.satisfColor, fontFamily: F, flexShrink: 0, whiteSpace: "nowrap" }}>{proj.satisfaction}</span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
                  </div>
                  {/* 버튼 + 토글 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, marginLeft: 20 }}>
                    <button style={{ padding: "10px 26px", borderRadius: 10, border: "none", background: "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
                      onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
                    onClick={() => navigate("/portfolio_detail_editor", { state: { projectTitle: proj.title, projectId: proj.id } })}
                    >상세 작성하기</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>포트폴리오에 추가</span>
                      <ToggleSwitch on={selectedAdded[proj.id]} onChange={v => setSelectedAdded(p => ({ ...p, [proj.id]: v }))} />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>
                    완료일: {proj.endDate}&nbsp;&nbsp;작성일: {proj.writeDate}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: proj.commentColor, fontFamily: F }}>{proj.commentText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── EvaluationTab (평가 대기 프로젝트) ────────────────────── */
const MOCK_EVAL_PENDING = [
  {
    id: 1,
    badge: "유료",
    title: "AI 기반 이상 거래 탐지 시스템 고도화",
    desc: "금융 데이터 분석을 통한 실시간 이상 거래 탐지 모델 최적화 및 API 개발",
    tags: ["#AI/ML", "#Python", "#Fintech"],
    endDate: "2024.11.20",
    duration: "3개월",
    deadlineD: "D-5",
    revieweeName: "김지훈",
    revieweeInitial: "김",
    revieweeAvatarColor: "#6366F1",
    budget: "₩12,000,000",
  },
  {
    id: 2,
    badge: "무료",
    title: "이커머스 플랫폼 모바일 앱 리뉴얼",
    desc: "사용자 경험 중심의 UI/UX 개편 및 Flutter 기반 크로스 플랫폼 앱 개발",
    tags: ["#Mobile", "#Web", "#Flutter"],
    endDate: "2024.11.18",
    duration: "4개월",
    deadlineD: "D-3",
    revieweeName: "이소연",
    revieweeInitial: "이",
    revieweeAvatarColor: "#0EA5E9",
    budget: "₩8,000,000",
  },
];

const MOCK_RECEIVED_REVIEWS = [
  {
    id: 1,
    badge: "유료",
    satisfactionLabel: "조금 불만족 했어요",
    satisfactionBg: "#FFF7ED",
    satisfactionBorder: "#FED7AA",
    satisfactionColor: "#C2410C",
    title: "블록체인 기반 공급망 관리 시스템 구축",
    desc: "물류 프로세스 투명성 확보를 위한 이더리움 기반 스마트 컨트랙트 개발",
    tags: ["#Blockchain", "#Solidity", "#Node.js"],
    endDate: "2024.11.01",
    reviewDate: "2024.11.05",
    commentText: "더 발전할 수 있게 코멘트를 남겨주셨어요",
    commentColor: "#F97316",
    reviewerName: "박성민",
    reviewerInitial: "박",
    reviewerAvatarColor: "#10B981",
    rating: 3.5,
    expertise: 3.5,
    schedule: 4.0,
    communication: 3.0,
    proactivity: 3.5,
    budget: "₩15,000,000",
    duration: "3개월",
    reviewText: "기술적 역량은 충분하지만, 일부 커뮤니케이션에서 개선이 필요합니다. 더 발전할 수 있을 것 같아 기대됩니다.",
  },
  {
    id: 2,
    badge: "유료",
    satisfactionLabel: "너무 만족했어요",
    satisfactionBg: "#F0FDF4",
    satisfactionBorder: "#BBF7D0",
    satisfactionColor: "#16A34A",
    title: "메타버스 협업 툴 시각화 모듈 개발",
    desc: "Three.js를 활용한 웹 기반 3D 데이터 시각화 엔진 고도화 및 최적화",
    tags: ["#Unity", "#3D", "#Optimization"],
    endDate: "2024.10.15",
    reviewDate: "2024.10.20",
    commentText: "별점만 있고 남겨진 코멘트가 없어요",
    commentColor: "#94A3B8",
    reviewerName: "최유나",
    reviewerInitial: "최",
    reviewerAvatarColor: "#F59E0B",
    rating: 5.0,
    expertise: 5.0,
    schedule: 5.0,
    communication: 5.0,
    proactivity: 5.0,
    budget: "₩25,000,000",
    duration: "4개월",
    reviewText: "어려운 기술적 요구사항도 척척 해결해주셨습니다. 3D 렌더링 최적화 부분에서 보여주신 실력이 정말 대단하십니다. 강력 추천합니다!",
  },
];

const MOCK_EXPIRED_REVIEWS = [
  {
    id: 1,
    title: "실시간 스트리밍 앱 최적화 및 안정화",
    desc: "대규모 동시 접속자 처리를 위한 백엔드 구조 개편 및 트래픽 제어 알고리즘 적용",
    tags: ["#Streaming", "#Go", "#Redis"],
    endDate: "2024.11.10",
  },
];

function EvalPendingCard({ proj, onWrite }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "20px 24px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 20 }}>
        {/* 왼쪽 콘텐츠 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F, flexShrink: 0 }}>{proj.badge}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px", fontFamily: F, lineHeight: 1.6 }}>{proj.desc}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {proj.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>
            완료일: {proj.endDate}&nbsp;&nbsp;&nbsp;총 기간: {proj.duration}
          </div>
        </div>
        {/* 오른쪽: 버튼(상단) + 기한(하단) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
          <button
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={() => onWrite(proj)}
            style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: hov ? "#BFDBFE" : "#DBEAFE", color: "#1E3A5F", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "background 0.15s", whiteSpace: "nowrap" }}
          >후기 작성하기</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1E3A5F", fontFamily: F }}>평가 기한 {proj.deadlineD}</span>
        </div>
      </div>
    </div>
  );
}

function ReceivedReviewCard({ review, onView }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "20px 24px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 20 }}>
        {/* 왼쪽 콘텐츠 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: review.satisfactionBg, border: `1px solid ${review.satisfactionBorder}`, color: review.satisfactionColor, fontFamily: F, flexShrink: 0 }}>{review.satisfactionLabel}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{review.title}</span>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px", fontFamily: F, lineHeight: 1.6 }}>{review.desc}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {review.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>
            완료일: {review.endDate}&nbsp;&nbsp;&nbsp;작성일: {review.reviewDate}
          </div>
        </div>
        {/* 오른쪽: 버튼(상단) + 코멘트(하단) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0, maxWidth: 200 }}>
          <button
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={() => onView(review)}
            style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: hov ? "#FDE68A" : "#FEF3C7", color: "#92400E", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "background 0.15s", whiteSpace: "nowrap" }}
          >후기 확인하기</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: review.commentColor, fontFamily: F, textAlign: "right", lineHeight: 1.5 }}>{review.commentText}</span>
        </div>
      </div>
    </div>
  );
}

function ExpiredReviewCard({ proj }) {
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "20px 24px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 20 }}>
        {/* 왼쪽 콘텐츠 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#64748B", fontFamily: F, flexShrink: 0 }}>기간 만료</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#94A3B8", fontFamily: F }}>{proj.title}</span>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 12px", fontFamily: F, lineHeight: 1.6 }}>{proj.desc}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {proj.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#94A3B8", fontFamily: F }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>종료일: {proj.endDate}</div>
        </div>
        {/* 오른쪽 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
          <button style={{ padding: "9px 24px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#F1F5F9", color: "#94A3B8", fontSize: 14, fontWeight: 600, cursor: "default", fontFamily: F, whiteSpace: "nowrap" }}>종료됨</button>
          <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>작성 기간 종료</span>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, max = 5 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 36 36" style={{ opacity: i < Math.round(value) ? 1 : 0.22, filter: i < Math.round(value) ? "drop-shadow(0 1px 2px rgba(251,191,36,0.4))" : "none" }}>
          <path d="M18 2.5c.6 0 1.1.4 1.4.9l4 8.2 9 1.3c.6.1 1 .5 1.2 1 .1.5-.1 1.1-.5 1.4l-6.5 6.4 1.5 9c.1.5-.1 1.1-.5 1.4-.5.3-1 .4-1.5.1L18 28.1l-8.1 4.3c-.5.3-1 .2-1.5-.1-.4-.3-.6-.9-.5-1.4l1.5-9L3 15.5c-.4-.4-.6-.9-.5-1.4.2-.5.6-.9 1.2-1l9-1.3 4-8.2c.3-.6.8-1 1.3-1z" fill="#FBBF24" stroke="#F59E0B" strokeWidth=".8" strokeLinejoin="round" />
        </svg>
      ))}
      <span style={{ color: "#1E293B", fontWeight: 700, fontSize: 14, marginLeft: 4, fontFamily: F }}>{value.toFixed(1)}</span>
    </span>
  );
}

function ViewReviewPopup({ review, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(680px, 92vw)", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #F1F5F9", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: review.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: review.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F }}>{review.badge}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{review.title}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px", marginLeft: 12 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: review.reviewerAvatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, fontFamily: F, flexShrink: 0 }}>{review.reviewerInitial}</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{review.reviewerName}</span>
            <StarRating value={review.rating} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginLeft: 4 }}>{review.endDate} 완료</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {review.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 20 }}>
            {[{ label: "전문성", val: review.expertise }, { label: "일정 준수", val: review.schedule }, { label: "소통 능력", val: review.communication }, { label: "적극성", val: review.proactivity }].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8", fontFamily: F }}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>BUDGET</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>💰 {review.budget}</div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>DURATION</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>📅 {review.duration}</div>
            </div>
          </div>
          {review.reviewText && (
            <div style={{ background: "#F8FBFF", borderRadius: 10, borderLeft: "4px solid #BFDBFE", padding: "16px 18px" }}>
              <div style={{ fontSize: 20, color: "#93C5FD", lineHeight: 1, marginBottom: 6 }}>❝</div>
              <p style={{ fontSize: 14, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.8, fontStyle: "italic" }}>{review.reviewText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewWrittenReviewPopup({ review, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(680px, 92vw)", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #F1F5F9", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#D1FAE5", border: "1px solid #6EE7B7", color: "#065F46", fontFamily: F }}>작성완료</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{review.title}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={onEdit} onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"} onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "#EFF6FF", color: "#1D4ED8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>✏️ 수정하기</button>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px" }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: review.reviewerAvatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, fontFamily: F, flexShrink: 0 }}>{review.reviewerInitial}</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{review.reviewerName}</span>
            <StarRating value={review.rating} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginLeft: 4 }}>{review.endDate} 완료</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {review.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 20 }}>
            {[{ label: "전문성", val: review.expertise }, { label: "일정 준수", val: review.schedule }, { label: "소통 능력", val: review.communication }, { label: "적극성", val: review.proactivity }].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8", fontFamily: F }}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>BUDGET</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>💰 {review.budget}</div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>DURATION</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>📅 {review.duration}</div>
            </div>
          </div>
          {review.reviewText ? (
            <div style={{ background: "#F8FBFF", borderRadius: 10, borderLeft: "4px solid #BFDBFE", padding: "16px 18px" }}>
              <div style={{ fontSize: 20, color: "#93C5FD", lineHeight: 1, marginBottom: 6 }}>❝</div>
              <p style={{ fontSize: 14, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.8, fontStyle: "italic" }}>{review.reviewText}</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8", fontSize: 13, fontFamily: F }}>작성된 코멘트가 없어요</div>
          )}
        </div>
      </div>
    </div>
  );
}

function WriteReviewPopup({ proj, onClose, onSubmit, initialScores, initialReviewText, isEdit }) {
  const [scores, setScores] = useState(initialScores || { expertise: 0, schedule: 0, communication: 0, proactivity: 0 });
  const [hoverScores, setHoverScores] = useState({ expertise: 0, schedule: 0, communication: 0, proactivity: 0 });
  const [reviewText, setReviewText] = useState(initialReviewText || "");
  const [submitted, setSubmitted] = useState(false);
  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
  const canSubmit = Object.values(scores).every(v => v > 0);
  const scoreLabels = [
    { key: "expertise", label: "전문성" },
    { key: "schedule", label: "일정 준수" },
    { key: "communication", label: "소통 능력" },
    { key: "proactivity", label: "적극성" },
  ];
  if (submitted) return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(440px, 88vw)", padding: "40px 36px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: "0 0 8px", fontFamily: F }}>{isEdit ? "후기가 수정되었습니다!" : "후기가 등록되었습니다!"}</h3>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px", fontFamily: F }}>{isEdit ? "수정해 주셔서 감사합니다." : "소중한 후기 감사합니다. 파트너 신뢰도에 반영됩니다."}</p>
        <button onClick={() => { onSubmit({ projId: proj.id, badge: proj.badge, title: proj.title, tags: proj.tags, reviewerAvatarColor: proj.revieweeAvatarColor, reviewerInitial: proj.revieweeInitial, reviewerName: proj.revieweeName, rating: avgScore, endDate: proj.endDate, expertise: scores.expertise, schedule: scores.schedule, communication: scores.communication, proactivity: scores.proactivity, budget: proj.budget, duration: proj.duration, reviewText }); onClose(); }} style={{ padding: "12px 36px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F }}>확인</button>
      </div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(620px, 92vw)", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #F1F5F9", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F }}>{proj.badge}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{proj.title}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px", marginLeft: 12 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: proj.revieweeAvatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, fontFamily: F, flexShrink: 0 }}>{proj.revieweeInitial}</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.revieweeName}</span>
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>완료일 {proj.endDate}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {proj.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 12 }}>항목별 평가 <span style={{ color: "#EF4444" }}>*</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
              {scoreLabels.map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{label}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} onClick={() => setScores(p => ({ ...p, [key]: star }))} onMouseEnter={() => setHoverScores(p => ({ ...p, [key]: star }))} onMouseLeave={() => setHoverScores(p => ({ ...p, [key]: 0 }))} style={{ cursor: "pointer", transition: "transform 0.15s", display: "inline-flex" }}>
                        <svg width="26" height="26" viewBox="0 0 36 36"><path d="M18 2.5c.6 0 1.1.4 1.4.9l4 8.2 9 1.3c.6.1 1 .5 1.2 1 .1.5-.1 1.1-.5 1.4l-6.5 6.4 1.5 9c.1.5-.1 1.1-.5 1.4-.5.3-1 .4-1.5.1L18 28.1l-8.1 4.3c-.5.3-1 .2-1.5-.1-.4-.3-.6-.9-.5-1.4l1.5-9L3 15.5c-.4-.4-.6-.9-.5-1.4.2-.5.6-.9 1.2-1l9-1.3 4-8.2c.3-.6.8-1 1.3-1z" fill={star <= (hoverScores[key] || scores[key]) ? "#FBBF24" : "#E2E8F0"} stroke={star <= (hoverScores[key] || scores[key]) ? "#F59E0B" : "#CBD5E1"} strokeWidth=".8" strokeLinejoin="round" style={{ transition: "fill 0.15s, stroke 0.15s" }} /></svg>
                      </span>
                    ))}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", fontFamily: F, minWidth: 28, textAlign: "right" }}>{scores[key] > 0 ? scores[key].toFixed(1) : ""}</span>
                  </div>
                </div>
              ))}
            </div>
            {canSubmit && <div style={{ marginTop: 10, textAlign: "right", fontSize: 13, color: "#64748B", fontFamily: F }}>평균 점수: <span style={{ fontWeight: 700, color: "#1D4ED8" }}>{avgScore.toFixed(1)}</span></div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>BUDGET</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>💰 {proj.budget}</div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: 1, marginBottom: 4 }}>DURATION</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1E293B", fontFamily: F }}>📅 {proj.duration}</div>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 8 }}>후기 코멘트 <span style={{ color: "#94A3B8", fontWeight: 400 }}>(선택)</span></div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="프로젝트 협업 경험에 대한 솔직한 후기를 남겨주세요." style={{ width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: F, color: "#1E293B", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }} />
          </div>
          <button onClick={() => canSubmit && setSubmitted(true)} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: canSubmit ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)" : "#E2E8F0", color: canSubmit ? "white" : "#94A3B8", fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", fontFamily: F, transition: "background 0.2s" }}>후기 등록하기</button>
          {!canSubmit && <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", margin: "8px 0 0", fontFamily: F }}>항목별 별점을 모두 선택해주세요</p>}
        </div>
      </div>
    </div>
  );
}

function CompletedReviewCard({ review, onViewWritten }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #D1FAE5", borderRadius: 14, padding: "20px 24px", background: "#F0FDF4", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#D1FAE5", border: "1px solid #6EE7B7", color: "#065F46", fontFamily: F, flexShrink: 0 }}>작성완료</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{review.title}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {review.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>평균 별점: <span style={{ fontWeight: 600, color: "#FBBF24" }}>★ {review.rating.toFixed(1)}</span>&nbsp;&nbsp;&nbsp;완료일: {review.endDate}</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={() => onViewWritten(review)}
            style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: hov ? "#A7F3D0" : "#D1FAE5", color: "#065F46", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "background 0.15s", whiteSpace: "nowrap" }}
          >작성한 후기 확인</button>
        </div>
      </div>
    </div>
  );
}

function EvaluationTab() {
  const navigate = useNavigate();
  const [writeTarget, setWriteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [writtenReviews, setWrittenReviews] = useState([]);
  const [viewWrittenTarget, setViewWrittenTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const pendingProjs = MOCK_EVAL_PENDING.filter(p => !writtenReviews.find(r => r.projId === p.id));

  const handleSubmit = (reviewData) => {
    setWrittenReviews(prev => [...prev, reviewData]);
  };

  const handleUpdate = (reviewData) => {
    setWrittenReviews(prev => prev.map((r, i) => i === editTarget.idx ? reviewData : r));
    setEditTarget(null);
  };

  return (
    <div>
      {writeTarget && <WriteReviewPopup proj={writeTarget} onClose={() => setWriteTarget(null)} onSubmit={handleSubmit} />}
      {viewTarget && <ViewReviewPopup review={viewTarget} onClose={() => setViewTarget(null)} />}
      {viewWrittenTarget && (
        <ViewWrittenReviewPopup
          review={viewWrittenTarget.review}
          onClose={() => setViewWrittenTarget(null)}
          onEdit={() => {
            const r = viewWrittenTarget.review;
            setEditTarget({
              proj: { id: r.projId, badge: r.badge, title: r.title, tags: r.tags, revieweeAvatarColor: r.reviewerAvatarColor, revieweeInitial: r.reviewerInitial, revieweeName: r.reviewerName, endDate: r.endDate, budget: r.budget, duration: r.duration },
              idx: viewWrittenTarget.idx,
              initialScores: { expertise: r.expertise, schedule: r.schedule, communication: r.communication, proactivity: r.proactivity },
              initialReviewText: r.reviewText,
            });
            setViewWrittenTarget(null);
          }}
        />
      )}
      {editTarget && (
        <WriteReviewPopup proj={editTarget.proj} onClose={() => setEditTarget(null)} onSubmit={handleUpdate} initialScores={editTarget.initialScores} initialReviewText={editTarget.initialReviewText} isEdit />
      )}

      {/* ① 평가 대기 프로젝트 */}
      {pendingProjs.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>평가 대기 프로젝트</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>프로젝트 완료 후 파트너 및 프로젝트에 대한 평가와 후기를 남겨주세요.</p>
            </div>
            <button onClick={() => navigate("/project_search")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>전체 / AI 추천 프로젝트 보기 &gt;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingProjs.map(p => <EvalPendingCard key={p.id} proj={p} onWrite={setWriteTarget} />)}
          </div>
        </div>
      )}

      {/* ② 내가 받은 후기 */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>내가 받은 후기</h2>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>클라이언트가 작성을 완료한 후기들입니다. 다른 클라이언트들에게 전달되어 파트너의 신뢰도를 높여줍니다.</p>
          </div>
          <button onClick={() => navigate("/partner_search")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>전체 작성 내역 보기 &gt;</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_RECEIVED_REVIEWS.map(r => <ReceivedReviewCard key={r.id} review={r} onView={setViewTarget} />)}
        </div>
      </div>

      {/* ③ 작성한 후기 */}
      <div style={{ marginTop: 36 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px", fontFamily: F, background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 28%, #3B82F6 58%, #6366F1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>작성한 후기</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>내가 작성한 후기들을 모두 확인하고, 수정할 수 있습니다.</p>
        </div>
        {writtenReviews.length === 0 ? (
          <div style={{ borderRadius: 16, padding: "32px 28px", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #d1fae5 100%)", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>🌱</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#065F46", fontFamily: F, marginBottom: 4 }}>작성한 후기가 아직 없어요~</div>
              <div style={{ fontSize: 13, color: "#34D399", fontFamily: F, lineHeight: 1.6 }}>후기를 작성해 주시면 서로에게 도움이 된답니다! 😊</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {writtenReviews.map((r, idx) => (
              <CompletedReviewCard key={"written-" + idx} review={r} onViewWritten={(rev) => setViewWrittenTarget({ review: rev, idx })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FreeMeetingTab ─────────────────────────────────────────── */
const MOCK_CONTACTS = [
  {
    id: 1,
    name: "Alex Miller",
    project: "E-Commerce Platform Modernization",
    avatar: null,
    initials: "AM",
    time: "10:10 AM",
    lastMsg: "Absolutely. I've prepared a draft...",
    unread: 0,
    active: true,
    messages: [
      { id: 1,  from: "them", text: "Hello! Thanks for joining the 'Free Meeting' session. I've reviewed your proposal for the API layer refactoring.", time: "10:02 AM" },
      { id: 2,  from: "me",   text: "Hi Alex, glad to be here. Did you have any specific concerns about the migration timeline? I've factored in the legacy system dependencies.", time: "10:05 AM" },
      { id: 3,  from: "them", text: "The timeline looks solid. I'm actually more interested in the GraphQL implementation. Can we discuss the schema definition approach?", time: "10:07 AM", file: { name: "api_specs_v2.pdf", type: "pdf", size: "1.2 MB" } },
      { id: 4,  from: "me",   text: "Absolutely. I've prepared a draft schema using a domain-driven design pattern. I'll share the repo link in a moment.", time: "10:10 AM" },
      { id: 5,  from: "them", text: "That sounds great. One concern I have is about authentication — we're planning to support both OAuth2 and API key flows. Is that something you've handled before?", time: "10:13 AM" },
      { id: 6,  from: "me",   text: "Yes, I've implemented dual-auth strategies before. We can use a middleware layer to abstract the auth flow so it doesn't bleed into your business logic.", time: "10:15 AM" },
      { id: 7,  from: "them", text: "Perfect. Also, what's your thinking on error handling? Our current system has a lot of inconsistency there.", time: "10:18 AM" },
      { id: 8,  from: "me",   text: "I'd recommend standardizing around RFC 7807 — problem+json format. It makes error responses predictable across the whole API surface.", time: "10:20 AM" },
      { id: 9,  from: "them", text: "I like that. Let me pull up the current error logs so you can see what we're dealing with.", time: "10:22 AM" },
      { id: 10, from: "me",   text: "Take your time. While you do that — are there any performance SLAs we need to design around? Specific p99 latency targets?", time: "10:23 AM" },
      { id: 11, from: "them", text: "We're aiming for sub-200ms on the critical checkout path. Everything else can be a bit more lenient.", time: "10:26 AM" },
      { id: 12, from: "me",   text: "Got it. That's very achievable with proper indexing and a Redis caching layer on the product catalog. I can include that in the architecture doc.", time: "10:28 AM" },
      { id: 13, from: "them", text: "Sounds like a plan. One last thing — what does your availability look like for the next two months?", time: "10:30 AM" },
      { id: 14, from: "me",   text: "I can commit to around 30hrs/week starting mid-May. If the scope is well-defined early on, I could potentially start a week earlier.", time: "10:32 AM" },
      { id: 15, from: "them", text: "That works for us. I think we're aligned on the key points. Let's move into a more formal contract discussion.", time: "10:35 AM" },
    ],
    sharedFiles: [
      { type: "pdf", name: "api_specs_v2.pdf", size: "1.2 MB", date: "2026-04" },
      { type: "doc", name: "project_proposal.docx", size: "890 KB", date: "2026-04" },
    ],
    sharedImages: [],
    sharedLinks: ["https://github.com/alex/ecomm-schema", "https://notion.so/project-brief"],
  },
  {
    id: 2,
    name: "Sarah Chen",
    project: "Mobile Banking App",
    avatar: null,
    initials: "SC",
    time: "Yesterday",
    lastMsg: "The prototype looks great! Let's talk.",
    unread: 2,
    active: false,
    messages: [
      { id: 1, from: "them", text: "Hi! I just reviewed your portfolio. The mobile projects look really impressive.", time: "Yesterday 2:30 PM" },
      { id: 2, from: "me",   text: "Thanks Sarah! I'd love to discuss the Banking App requirements in more detail.", time: "Yesterday 2:45 PM" },
      { id: 3, from: "them", text: "The prototype looks great! Let's talk.", time: "Yesterday 3:00 PM" },
    ],
    sharedFiles: [],
    sharedImages: [],
    sharedLinks: [],
  },
  {
    id: 3,
    name: "Michael Kim",
    project: "Cloud Migration Strategy",
    avatar: null,
    initials: "MK",
    time: "Oct 20",
    lastMsg: "Sent you the latest architecture diagrams.",
    unread: 0,
    active: false,
    messages: [
      { id: 1, from: "me",   text: "Michael, here are my thoughts on the cloud migration plan.", time: "Oct 20 9:00 AM" },
      { id: 2, from: "them", text: "Sent you the latest architecture diagrams.", time: "Oct 20 9:30 AM", file: { name: "arch_diagram_v3.png", type: "img", size: "2.4 MB" } },
    ],
    sharedFiles: [{ type: "img", name: "arch_diagram_v3.png", size: "2.4 MB", date: "2026-03" }],
    sharedImages: [{ name: "arch_diagram_v3.png" }],
    sharedLinks: [],
  },
];

const FILE_ICON_COLORS = { pdf: "#E53935", doc: "#1565C0", img: "#2E7D32", default: "#5C6BC0" };

function FileBubble({ file }) {
  const color = FILE_ICON_COLORS[file.type] || FILE_ICON_COLORS.default;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "8px 12px", marginTop: 8, maxWidth: 200, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#93C5FD"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
    </div>
  );
}

function AvatarCircle({ initials, size = 40, avatar = null }) {
  const colors = { A: "#3B82F6", S: "#8B5CF6", M: "#10B981", default: "#64748B" };
  const safeInitials = (typeof initials === "string" && initials.trim()) ? initials.trim() : "?";
  const c = colors[safeInitials[0]] || colors.default;
  if (avatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `2px solid ${c}40`, flexShrink: 0, background: `${c}20` }}>
        <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${c}20`, border: `2px solid ${c}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: c, fontFamily: F }}>{safeInitials}</span>
    </div>
  );
}

const MEETING_COLLAB_ROLES = ["기획", "디자인/퍼블리싱", "FE 개발", "BE 개발"];

const CLIENT_MEETING_PROJECT_OPTIONS = [
  ...MOCK_INTEREST_PROJECTS,
  {
    id: 4,
    badge: "유료",
    title: "DevBridge 협업 매칭 플랫폼 2차 고도화",
    desc: "계약 협의, 실시간 미팅, 대시보드 경험을 고도화하는 후속 프로젝트입니다.",
    tags: ["#React", "#Spring", "#AI"],
    period: "5개월",
    budget: "3,200만원",
    deadline: "마감 D-7",
    deadlineColor: "#F59E0B",
  },
];

const CLIENT_MEETING_PROFILE_MAP = {
  "Alex Miller": {
    name: "Alex Miller",
    title: "백엔드·플랫폼 파트너",
    rating: 4.9,
    summary: "대규모 커머스 API 현대화와 인증, 성능 최적화 경험을 보유한 파트너입니다.",
    tags: ["Java", "Spring", "GraphQL", "AWS"],
    careers: [
      { company: "Future Soft Tech", role: "Lead Backend Engineer", period: "2021.03 ~ 현재", desc: "커머스 플랫폼 API 현대화와 트래픽 확장 설계를 리드했습니다." },
      { company: "Market Loop", role: "Platform Engineer", period: "2018.01 ~ 2021.02", desc: "인증 서버와 주문 처리 파이프라인 안정화 프로젝트를 수행했습니다." },
    ],
    educations: [
      { school: "University of Washington", major: "Computer Science", degree: "학사", year: "2017" },
    ],
    portfolioItems: [
      { title: "Commerce API Modernization", tech: ["Java", "Spring", "GraphQL"], desc: "모놀리식 주문 시스템을 GraphQL 기반 API 구조로 전환했습니다." },
      { title: "Cloud Auth Gateway", tech: ["AWS", "OAuth", "Redis"], desc: "대규모 인증 게이트웨이의 성능 병목을 개선했습니다." },
    ],
    reviews: [
      { reviewer: "North Retail", rating: 5.0, date: "2026.03", comment: "복잡한 API 요구사항을 구조적으로 정리하고 일정도 안정적으로 맞춰주셨습니다." },
      { reviewer: "Shopverse", rating: 4.8, date: "2025.12", comment: "문제 분석 속도가 빠르고 커뮤니케이션이 명확했습니다." },
    ],
  },
  "Sarah Chen": {
    name: "Sarah Chen",
    title: "모바일 제품 파트너",
    rating: 5.0,
    summary: "핀테크 앱 UX 개선과 모바일 프로토타이핑 리뷰 경험이 많은 파트너입니다.",
    tags: ["Flutter", "UX/UI", "Fintech", "Mobile"],
    careers: [
      { company: "NeoBank Studio", role: "Mobile Product Designer", period: "2020.07 ~ 현재", desc: "모바일 금융 앱 UX 개선과 사용자 리서치 기반 설계를 주도했습니다." },
    ],
    educations: [
      { school: "Parsons School of Design", major: "Interaction Design", degree: "석사", year: "2020" },
    ],
    portfolioItems: [
      { title: "Mobile Banking Flow Redesign", tech: ["Flutter", "Figma", "UX Research"], desc: "송금과 자산 조회 플로우를 단순화해 이탈률을 낮췄습니다." },
      { title: "Fintech Prototype System", tech: ["Prototype", "Design System"], desc: "금융 서비스 전용 디자인 시스템과 프로토타입을 구축했습니다." },
    ],
    reviews: [
      { reviewer: "Mint Capital", rating: 5.0, date: "2026.02", comment: "모바일 사용자 관점에서 세밀한 개선안을 제시해 주셨습니다." },
    ],
  },
  "Michael Kim": {
    name: "Michael Kim",
    title: "클라우드 아키텍트 파트너",
    rating: 4.8,
    summary: "클라우드 마이그레이션과 분산 시스템 설계를 주도해온 인프라 중심 파트너입니다.",
    tags: ["Cloud", "Kubernetes", "DevOps", "Architecture"],
    careers: [
      { company: "Infra Shift", role: "Cloud Architect", period: "2019.05 ~ 현재", desc: "멀티 클라우드 인프라 전환과 운영 자동화 프로젝트를 리드했습니다." },
    ],
    educations: [
      { school: "Georgia Tech", major: "Computer Engineering", degree: "학사", year: "2016" },
    ],
    portfolioItems: [
      { title: "Hybrid Cloud Migration", tech: ["Kubernetes", "Terraform", "AWS"], desc: "레거시 시스템을 하이브리드 클라우드 구조로 이전했습니다." },
    ],
    reviews: [
      { reviewer: "Data Harbor", rating: 4.8, date: "2025.11", comment: "인프라 구조 제안이 명확했고 운영 안정성이 크게 개선되었습니다." },
    ],
  },
};

function MeetingProjectSelectModal({ title, subtitle, projects, requireRole = false, roleOptions = [], confirmLabel, onClose, onConfirm }) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0] ?? "");
  const [note, setNote] = useState("");
  const selectedProject = projects.find(project => project.id === selectedId) || null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10020,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(640px, 94vw)", background: "white", borderRadius: 22,
          boxShadow: "0 28px 80px rgba(15,23,42,0.22)", overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748B", fontFamily: F, lineHeight: 1.6 }}>{subtitle}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#94A3B8", lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: requireRole ? 18 : 0 }}>
            {projects.map(project => {
              const selected = project.id === selectedId;
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedId(project.id)}
                  style={{
                    textAlign: "left", borderRadius: 16, padding: "16px 18px",
                    border: `1.5px solid ${selected ? "#93C5FD" : "#E2E8F0"}`,
                    background: selected ? "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)" : "white",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 6 }}>{project.title}</div>
                      <div style={{ fontSize: 13, color: "#475569", fontFamily: F, lineHeight: 1.6 }}>{project.desc}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 999, background: project.badge === "유료" ? "#EFF6FF" : "#F0FDF4", color: project.badge === "유료" ? "#2563EB" : "#15803D", fontSize: 12, fontWeight: 700, fontFamily: F, flexShrink: 0 }}>{project.badge}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {project.tags.map(tag => (
                      <span key={tag} style={{ padding: "4px 10px", borderRadius: 999, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", fontSize: 12, fontWeight: 600, fontFamily: F }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#64748B", fontFamily: F }}>
                    <span>예상 기간 {project.period}</span>
                    <span>예산 {project.budget}</span>
                    <span style={{ color: project.deadlineColor, fontWeight: 700 }}>{project.deadline}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {requireRole && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", fontFamily: F, marginBottom: 10 }}>어떤 직무로 제안할까요?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {roleOptions.map(role => {
                  const selected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      style={{
                        padding: "9px 14px", borderRadius: 999,
                        border: `1.5px solid ${selected ? "#93C5FD" : "#E2E8F0"}`,
                        background: selected ? "#DBEAFE" : "white",
                        color: selected ? "#1E3A5F" : "#475569",
                        fontSize: 13, fontWeight: selected ? 700 : 600, fontFamily: F, cursor: "pointer",
                      }}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {requireRole && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", fontFamily: F, marginBottom: 10 }}>제안하며 건네고 싶은 말 (선택)</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예) 함께하면 정말 좋을 것 같아 제안드립니다. 잘 부탁드려요!"
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px",
                  borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                  fontSize: 13, color: "#1E293B", fontFamily: F, lineHeight: 1.6, resize: "vertical",
                  outline: "none",
                }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "18px 24px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", color: "#374151", fontSize: 14, fontWeight: 600, fontFamily: F, cursor: "pointer" }}>취소</button>
          <button
            onClick={() => selectedProject && onConfirm(selectedProject, selectedRole, note.trim())}
            disabled={!selectedProject || (requireRole && !selectedRole)}
            style={{
              padding: "11px 20px", borderRadius: 12, border: "none",
              background: !selectedProject || (requireRole && !selectedRole)
                ? "#CBD5E1"
                : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)",
              color: "white", fontSize: 14, fontWeight: 700, fontFamily: F,
              cursor: !selectedProject || (requireRole && !selectedRole) ? "default" : "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingCounterpartyProfilePopup({ profile, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10010,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(620px, 92vw)", background: "white", borderRadius: 22,
          boxShadow: "0 28px 80px rgba(15,23,42,0.22)", overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 26px 20px", borderBottom: "1px solid #E2E8F0", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <AvatarCircle initials={profile.initials} size={68} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{profile.name}</div>
              <div style={{ fontSize: 14, color: "#64748B", fontFamily: F, fontWeight: 600, marginTop: 4 }}>{profile.title}</div>
              <div style={{ fontSize: 13, color: "#2563EB", fontFamily: F, marginTop: 8 }}>현재 논의 프로젝트: {profile.project}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#94A3B8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 10 }}>소개</div>
            <p style={{ margin: 0, fontSize: 14, color: "#475569", fontFamily: F, lineHeight: 1.75, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px" }}>{profile.summary}</p>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 10 }}>핵심 역량</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {profile.tags.map(tag => (
                <span key={tag} style={{ padding: "6px 12px", borderRadius: 999, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, fontFamily: F }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingProjectCard({ project, onDetail }) {
  return (
    <div style={{ width: 360, maxWidth: "100%", background: "white", border: "1.5px solid #BFDBFE", borderRadius: 18, padding: "16px 18px", boxShadow: "0 10px 28px rgba(59,130,246,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F, lineHeight: 1.5 }}>{project.title}</div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: F, marginTop: 6 }}>{project.period} · {project.budget}</div>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 999, background: project.badge === "유료" ? "#EFF6FF" : "#F0FDF4", color: project.badge === "유료" ? "#2563EB" : "#15803D", fontSize: 12, fontWeight: 700, fontFamily: F, flexShrink: 0 }}>{project.badge}</span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569", fontFamily: F, lineHeight: 1.7 }}>{project.desc}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {project.tags.map(tag => (
          <span key={tag} style={{ padding: "4px 10px", borderRadius: 999, background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569", fontSize: 12, fontWeight: 600, fontFamily: F }}>{tag}</span>
        ))}
      </div>
      <button
        onClick={() => onDetail(project)}
        style={{
          width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
          background: "#DBEAFE", color: "#1E3A5F", fontSize: 14, fontWeight: 600,
          fontFamily: F, cursor: "pointer",
        }}
      >
        상세보기
      </button>
    </div>
  );
}

function getMeetingPartnerPreview(contact) {
  const base = CLIENT_MEETING_PROFILE_MAP[contact?.name] || {};
  return {
    name: contact?.name || base.name || "상대 파트너",
    initials: contact?.initials || (contact?.name || "상대").split(" ").map(token => token[0]).slice(0, 2).join("").toUpperCase(),
    title: base.title || "협업 파트너",
    rating: base.rating || 4.8,
    project: contact?.project || "진행 중 프로젝트",
    summary: base.summary || "현재 프로젝트 협의를 진행 중인 파트너입니다.",
    desc: base.summary || "현재 프로젝트 협의를 진행 중인 파트너입니다.",
    tags: base.tags || ["Collaboration", "Delivery", "Communication"],
    careers: base.careers || [],
    educations: base.educations || [],
    portfolioItems: base.portfolioItems || [],
    reviews: base.reviews || [],
  };
}

const MOCK_PROJECT_MEETING_CONTACTS = [
  {
    id: 1,
    name: "Alpha FinTech",
    project: "AI 기반 지능형 큐레이터 플랫폼 고도화",
    time: "10:24 AM",
    lastMsg: "모델 파인튜닝 진행 상황 공유 부탁드립니다.",
    unread: 0,
    progress: 68,
    agreementItems: [
      { label: "작업 범위", status: "협의완료" },
      { label: "최종 전달물 정의서", status: "협의완료" },
      { label: "마감 일정 및 마일 스톤", status: "협의완료" },
      { label: "총 금액", status: "협의완료" },
      { label: "수정 가능 범위", status: "협의완료" },
      { label: "완료 기준", status: "협의완료" },
      { label: "추가 특약 (선택)", status: "논의 중" },
    ],
    messages: [
      { id: 1, from: "them", text: "모델 파인튜닝 진행 상황 공유 부탁드립니다.", time: "10:24 AM" },
      { id: 2, from: "me", text: "현재 정확도 89%이고 금주 내 92% 목표로 개선 중입니다.", time: "10:29 AM" },
    ],
  },
  {
    id: 2,
    name: "Blue Retail Co.",
    project: "E-commerce Platform UX/UI Redesign",
    time: "Yesterday",
    lastMsg: "모바일 프로토타입 리뷰 일정 잡고 싶어요.",
    unread: 1,
    progress: 32,
    agreementItems: [
      { label: "작업 범위", status: "협의완료" },
      { label: "최종 전달물 정의서", status: "협의완료" },
      { label: "마감 일정 및 마일 스톤", status: "협의완료" },
      { label: "총 금액", status: "협의완료" },
      { label: "수정 가능 범위", status: "협의완료" },
      { label: "완료 기준", status: "협의완료" },
      { label: "추가 특약 (선택)", status: "논의 중" },
    ],
    messages: [
      { id: 1, from: "them", text: "모바일 프로토타입 리뷰 일정 잡고 싶어요.", time: "Yesterday 4:10 PM" },
      { id: 2, from: "me", text: "내일 오후 2시 제안드립니다. 캘린더 초대 드릴게요.", time: "Yesterday 4:14 PM" },
    ],
  },
  {
    id: 3,
    name: "Crypto Systems",
    project: "Bitcoin Auto-Trading System Development",
    time: "2 days ago",
    lastMsg: "코어 로직 설계 문서 전달드렸습니다.",
    unread: 0,
    progress: 0,
    agreementItems: [
      { label: "작업 범위", status: "협의완료" },
      { label: "최종 전달물 정의서", status: "협의완료" },
      { label: "마감 일정 및 마일 스톤", status: "협의완료" },
      { label: "총 금액", status: "협의완료" },
      { label: "수정 가능 범위", status: "협의완료" },
      { label: "완료 기준", status: "협의완료" },
      { label: "추가 특약 (선택)", status: "논의 중" },
    ],
    messages: [
      { id: 1, from: "them", text: "코어 로직 설계 문서 전달드렸습니다.", time: "2 days ago 9:18 AM" },
      { id: 2, from: "me", text: "확인했습니다. 리스크 관리 규칙도 함께 반영해보겠습니다.", time: "2 days ago 9:26 AM" },
    ],
  },
];

function ProjectMeetingTab({ initialActiveId, chatClient, returnProjectId = null, onDashboardMove = null, targetContactId = null, targetProjectId = null }) {
  // 실제 DM 방 + IN_PROGRESS 프로젝트 파트너만 contact list에 표시.
  // filterInProgress=true: receivedList() 기준 IN_PROGRESS 파트너만 필터링.
  return (
    <ContractMeetingTab
      initialContactId={targetContactId ?? initialActiveId ?? 1}
      initialProjectId={targetProjectId}
      showDashboardMoveButton={true}
      chatClient={chatClient}
      filterInProgress={true}
      meetingMode="project"
      onDashboardMove={(pid) => onDashboardMove?.(pid || returnProjectId)}
    />
  );
}

// ── Module-level helper: 날짜 한국어 포맷 (chat-v3 ContractMeetingTab 버그 수정) ──
function formatDateKorean(date) {
  const d = new Date(date);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}요일`;
}

function useStreamChannel(client, type, myDbId, contact, contractId) {
  const [channel, setChannel] = useState(null);
  useEffect(() => {
    if (!client || !myDbId || !contact?.isStreamReal) { setChannel(null); return; }
    let ch;
    const setup = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        let room;
        if (type === "self") {
          const sid = client.userID;
          if (!sid) return;
          ch = client.channel("messaging", `self-${sid}`, { members: [sid] });
          await ch.watch();
          setChannel(ch);
          return;
        }
        if (type === "project_meeting") {
          // 진행 프로젝트 미팅은 계약·자유미팅 DM 과 분리된 새 stream 채널 사용.
          const me = String(myDbId);
          const other = String(contact.targetUserId);
          if (!other) return;
          const [a, b] = me < other ? [me, other] : [other, me];
          ch = client.channel("messaging", `pm-${a}-${b}`, { members: [me, other] });
          await ch.watch();
          // 첫 진입 시 시스템 안내 자동 게시 (이미 있으면 skip)
          try {
            const existing = ch.state?.messages || [];
            const hasIntro = existing.some(m => m.custom_type === "project_meeting_intro");
            if (!hasIntro) {
              await ch.sendMessage({
                text: "🎉 진행 프로젝트 미팅이 시작되었습니다. 이곳에서 마일스톤·산출물·일정을 이어가세요!",
                custom_type: "project_meeting_intro",
              });
            }
          } catch (e) { console.warn("[Stream] project_meeting intro 게시 실패:", e?.message); }
          setChannel(ch);
          return;
        }
        if (type === "negotiation" && contractId) {
          const res = await fetch(`/api/chat/rooms/negotiation`, {
            method: "POST", headers,
            body: JSON.stringify({ contractNegotiationId: contractId, targetUserId: contact.targetUserId }),
          });
          if (!res.ok) return;
          room = await res.json();
        } else {
          const res = await fetch(`/api/chat/rooms/dm?userId=${myDbId}`, {
            method: "POST", headers,
            body: JSON.stringify({ targetUserId: contact.targetUserId }),
          });
          if (!res.ok) return;
          room = await res.json();
        }
        ch = client.channel(room.streamChannelType, room.streamChannelId);
        await ch.watch();
        setChannel(ch);
      } catch (err) {
        console.error("[Stream] useStreamChannel error:", err);
      }
    };
    setup();
    return () => { if (ch) ch.stopWatching().catch(() => {}); };
  }, [client, type, myDbId, contact?.id, contractId]);
  return { channel };
}

function useHeadlessMessages(channel) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!channel) { setMessages([]); return; }
    setMessages(channel.state?.messages || []);
    const handler = (event) => {
      if (event.message) setMessages(prev => [...prev, event.message]);
    };
    channel.on("message.new", handler);
    return () => channel.off("message.new", handler);
  }, [channel]);
  return messages;
}

function FreeMeetingTab({ proposalPartner, onProposalHandled, chatClient, onSwitchTab }) {
  const [freeMeetingSearchParams, setFreeMeetingSearchParams] = useSearchParams();
  const dmTargetParam = freeMeetingSearchParams.get("dm");
  const dmTargetUserId = dmTargetParam ? Number(dmTargetParam) : null;
  const user = useStore(s => s.user);
  const { dbId } = useStore();
  const proposalId = proposalPartner?._contactId ?? null;
  const [contacts, setContacts] = useState(() => {
    if (!proposalPartner) return [];
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const newContact = {
      id: proposalId,
      name: proposalPartner.name || "파트너",
      project: proposalPartner.title || proposalPartner.slogan || "협업 제안",
      avatar: proposalPartner.picture || proposalPartner.profileImage || null,
      initials: (proposalPartner.name || "P")[0].toUpperCase(),
      time: "방금",
      lastMsg: "협업 제안합니다",
      unread: 0, active: true,
      messages: [{ id: proposalId + 1, from: "me", text: "협업 제안합니다", time: now }],
      sharedFiles: [], sharedImages: [], sharedLinks: [],
    };
    return [newContact];
  });
  const [activeId, setActiveId] = useState(proposalId ?? null);
  const [searchVal, setSearchVal] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  // Pinned chat ids (persisted per user in localStorage)
  const pinKey = dbId ? `chat-pinned-${dbId}` : null;
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (!pinKey) return [];
    try { return JSON.parse(localStorage.getItem(pinKey) || "[]"); } catch { return []; }
  });
  useEffect(() => {
    if (!pinKey) return;
    try { localStorage.setItem(pinKey, JSON.stringify(pinnedIds)); } catch {}
  }, [pinKey, pinnedIds]);
  const togglePin = (id) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("파일");
  const [acceptedIds, setAcceptedIds] = useState([]);
  const clientProfileDetail = useStore(s => s.clientProfileDetail);
  const partnerProfileDetail = useStore(s => s.partnerProfileDetail);
  const userRole = useStore(s => s.userRole);
  const loadProfileDetailFromServer = useStore(s => s.loadProfileDetailFromServer);
  const [fetchedHero, setFetchedHero] = useState(null);
  const storedHero = (userRole === "partner" ? partnerProfileDetail?.heroImage : clientProfileDetail?.heroImage) || null;
  const myHeroImage = storedHero || fetchedHero || null;
  useEffect(() => {
    if (storedHero) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await profileApi.getMyDetail();
        if (!cancelled && data?.profileImageUrl) setFetchedHero(data.profileImageUrl);
        loadProfileDetailFromServer?.(userRole);
      } catch (_) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [storedHero, userRole, loadProfileDetailFromServer]);
  const messagesEndRef = useRef(null);
  const msgContainerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectActionMode, setProjectActionMode] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch real chat rooms
  useEffect(() => {
    if (!dbId) return;
    fetch(`/api/chat/rooms?userId=${dbId}`)
      .then(res => res.json())
      .then(rooms => {
        const realContacts = rooms
          .filter(r => r.roomType === "DIRECT_MESSAGE")
          .map(r => {
            const counterpartId = r.user1Id === dbId ? r.user2Id : r.user1Id;
            const counterpartName = r.user1Id === dbId ? r.user2Username : r.user1Username;
            const counterpartAvatar = r.user1Id === dbId ? r.user2ProfileImageUrl : r.user1ProfileImageUrl;
            return {
              id: counterpartId,
              targetUserId: counterpartId,
              name: counterpartName,
              project: "자유 미팅",
              avatar: counterpartAvatar || (counterpartName?.toLowerCase().startsWith("partner") ? heroTeacher : counterpartName?.toLowerCase().startsWith("client") ? heroStudent : heroDefault),
              initials: (counterpartName || "U")[0].toUpperCase(),
              time: "",
              lastMsg: "채팅방이 연결되었습니다",
              unread: 0,
              active: false,
              isStreamReal: true,
              messages: [],
              sharedFiles: [], sharedImages: [], sharedLinks: [],
            };
          });
        
        setContacts(prev => {
          const selfId = `self-${dbId}`;
          const selfContact = {
            id: selfId,
            targetUserId: dbId,
            name: `${user?.username || "나"} (나)`,
            project: "나에게 보내기",
            avatar: user?.heroImage || null,
            initials: "\uD83D\uDDD2\uFE0F",
            time: "고정",
            lastMsg: "메모, 링크 등을 자유롭게 저장하세요",
            unread: 0,
            active: false,
            isStreamReal: true,
            isSelfChat: true,
            messages: [],
            sharedFiles: [], sharedImages: [], sharedLinks: [],
          };
          const filteredPrev = prev.filter(c => !realContacts.find(rc => rc.id === c.id) && c.id !== selfId);
          const newContacts = [selfContact, ...realContacts, ...filteredPrev];
          // ?dm=<userId> 로 진입했으면 그 사람을 우선 선택
          if (dmTargetUserId && realContacts.find(rc => rc.id === dmTargetUserId)) {
            setActiveId(dmTargetUserId);
          } else if (realContacts.length > 0 && (!activeId || activeId < 60)) {
            // Auto-select the first real contact if no activeId is set or if activeId is a placeholder
            setActiveId(realContacts[0].id);
          } else if (!activeId) {
            setActiveId(selfId);
          }
          return newContacts;
        });
      })
      .catch(err => console.error("[FreeMeetingTab] Fetch rooms failed:", err));
  }, [dbId, activeId, dmTargetUserId]);

  // dm 쿼리 파라미터는 한 번 사용 후 URL에서 제거 (재방문/탭전환 시 강제 선택 방지)
  useEffect(() => {
    if (!dmTargetUserId) return;
    const t = setTimeout(() => {
      setFreeMeetingSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("dm");
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [dmTargetUserId, setFreeMeetingSearchParams]);

  // Fetch each counterpart's profile image (avatar)
  useEffect(() => {
    const targets = contacts.filter(c => c.isStreamReal && !c.isSelfChat && !c.avatar && c.name);
    if (targets.length === 0) return;
    const token = localStorage.getItem("accessToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all(targets.map(c =>
      fetch(`/api/profile/${encodeURIComponent(c.name)}/detail`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => ({ id: c.id, img: data?.profileImageUrl || null }))
        .catch(() => ({ id: c.id, img: null }))
    )).then(results => {
      const imgMap = Object.fromEntries(results.filter(r => r.img).map(r => [r.id, r.img]));
      if (Object.keys(imgMap).length === 0) return;
      setContacts(prev => prev.map(c => imgMap[c.id] ? { ...c, avatar: imgMap[c.id] } : c));
    });
  }, [contacts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch full counterpart info to determine userType
  const [counterpartDetails, setCounterpartDetails] = useState({});
  useEffect(() => {
    if (!activeId || typeof activeId === "string" || activeId < 60) return;
    if (counterpartDetails[activeId]) return;
    fetch(`/api/users/${activeId}`)
      .then(res => res.json())
      .then(data => {
        setCounterpartDetails(prev => ({ ...prev, [activeId]: data }));
      })
      .catch(err => console.error("[FreeMeetingTab] Fetch user detail failed:", err));
  }, [activeId, counterpartDetails]);

  // 협업 제안 처리 완료 통보 (마운트 시 1회)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (proposalId) onProposalHandled?.(); }, []);

  const activeContact = useMemo(() => {
    return contacts.find(c => c.id === activeId) || contacts[0];
  }, [contacts, activeId]);

  const activeCounterpart = counterpartDetails[activeId];
  const canProposeProject = user?.userType === "CLIENT" && activeCounterpart?.userType === "PARTNER";

  const filtered = contacts
    .filter(c =>
      c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      c.project.toLowerCase().includes(searchVal.toLowerCase())
    )
    .sort((a, b) => {
      // 1. self-chat always at top
      if (a.isSelfChat && !b.isSelfChat) return -1;
      if (!a.isSelfChat && b.isSelfChat) return 1;
      // 2. pinned next
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

  const sharedFiles = activeContact?.sharedFiles || [];
  const sharedLinks = activeContact?.sharedLinks || [];
  const sharedImages = activeContact?.sharedImages || [];

  // ── Helper to render text with clickable links ─────────────────
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?\b)/gi;
    const elements = [];
    let lastIndex = 0;
    let match;
    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      let url = match[0];
      const cleanUrl = url.replace(/[.,!?;:]+$/, "");
      if (cleanUrl.length < url.length) {
        url = cleanUrl;
        urlRegex.lastIndex = match.index + url.length;
      }
      let href = url;
      if (!href.startsWith("http")) {
        href = "https://" + href;
      }
      elements.push(
        <a key={match.index} href={href} target="_blank" rel="noreferrer" 
           style={{ color: "inherit", textDecoration: "underline", fontWeight: "inherit" }}
           onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );
      lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    return elements.length > 0 ? elements : text;
  };

  // ── Stream Chat integration ───────────────────────────────────
  useEffect(() => {
    if (activeContact?.isStreamReal) {
      console.log(`[Stream] Active Room for ${user?.email}:`, {
        counterpart: activeContact.name,
        targetUserId: activeContact.targetUserId,
        isReal: activeContact.isStreamReal
      });
    }
  }, [activeContact, user?.email]);

  const { channel } = useStreamChannel(chatClient, activeContact?.isSelfChat ? "self" : "dm", dbId, activeContact);
  const streamMessages = useHeadlessMessages(channel);


  // Merge Stream messages into displayMessages (falls back to local mock when not connected)
  const displayMessages = useMemo(() => {
    if (activeContact?.isStreamReal && streamMessages && chatClient?.userID) {
      const extractedFiles = [];
      const extractedImages = [];
      const extractedLinks = [];
      const messages = [];

      let lastDateLabel = null;

      streamMessages.forEach(sm => {
        const dateLabel = formatDateKorean(sm.created_at);
        if (dateLabel !== lastDateLabel) {
          messages.push({
            id: `date-${sm.id}`,
            type: "date_divider",
            label: dateLabel,
          });
          lastDateLabel = dateLabel;
        }

        let fileObj = sm.file;
        if (!fileObj && sm.attachments && sm.attachments.length > 0) {
          const att = sm.attachments[0];
          if (att.file_size || att.mime_type) {
            fileObj = {
              name: att.title || att.fallback || "첨부파일",
              type: att.type === "image" ? "img" : (att.mime_type?.includes("pdf") ? "pdf" : "doc"),
              url: att.asset_url || att.image_url
            };
          }
        }

        // Extract for Cabinet
        if (sm.attachments && sm.attachments.length > 0) {
          sm.attachments.forEach(att => {
            const dateStr = new Date(sm.created_at).toISOString().slice(0, 7); // YYYY-MM
            const isUploaded = att.file_size || att.mime_type;

            if ((att.type === "image" || att.type === "video") && isUploaded) {
              extractedImages.push({ name: att.title || "image", url: att.image_url || att.asset_url, date: dateStr });
            } else if (att.type === "file" && isUploaded) {
              extractedFiles.push({ 
                name: att.title || att.fallback || "파일", 
                type: att.mime_type?.includes("pdf") ? "pdf" : "doc", 
                size: att.file_size ? (att.file_size / 1024).toFixed(0) + " KB" : "Unknown",
                url: att.asset_url,
                date: dateStr 
              });
            }
          });
        }

        // Extract links from text or attachments
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?\b)/gi;
        const matches = sm.text?.match(urlRegex);
        if (matches) {
          matches.forEach(m => {
            let url = m.replace(/[.,!?;:]+$/, "");
            if (!url.startsWith("http")) url = "https://" + url;
            if (!extractedLinks.includes(url)) extractedLinks.push(url);
          });
        }
        if (sm.attachments) {
          sm.attachments.forEach(att => {
            if (att.type === "url" && att.og_scrape_url) {
              let url = att.og_scrape_url;
              if (!url.startsWith("http")) url = "https://" + url;
              if (!extractedLinks.includes(url)) extractedLinks.push(url);
            }
          });
        }

        messages.push({
          id: sm.id,
          from: (sm.user?.id || sm.userId) === chatClient.userID ? "me" : "them",
          text: sm.text || "",
          time: new Date(sm.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          type: sm.type_meta || (sm.project_card ? "project_card" : "text"),
          project: sm.project_card,
          role: sm.role_meta,
          applicationId: sm.application_id,
          _origin: sm.origin_meta,
          file: fileObj,
        });
      });

      return { messages, extractedFiles, extractedImages, extractedLinks };
    }
    const fallbackMsgs = activeContact?.messages || [];
    return { messages: fallbackMsgs, extractedFiles: [], extractedImages: [], extractedLinks: [] };
  }, [activeContact, streamMessages, chatClient?.userID]);

  useEffect(() => {
    if (activeContact?.isStreamReal) {
      setContacts(prev => prev.map(c => {
        if (c.id === activeId) {
          const changedMessages = JSON.stringify(c.messages) !== JSON.stringify(displayMessages.messages);
          const changedFiles = JSON.stringify(c.sharedFiles) !== JSON.stringify(displayMessages.extractedFiles);
          const changedImages = JSON.stringify(c.sharedImages) !== JSON.stringify(displayMessages.extractedImages);
          const changedLinks = JSON.stringify(c.sharedLinks) !== JSON.stringify(displayMessages.extractedLinks);

          if (changedMessages || changedFiles || changedImages || changedLinks) {
            return { 
              ...c, 
              messages: displayMessages.messages,
              sharedFiles: displayMessages.extractedFiles,
              sharedImages: displayMessages.extractedImages,
              sharedLinks: displayMessages.extractedLinks
            };
          }
        }
        return c;
      }));
    }
  }, [displayMessages, activeId, activeContact?.isStreamReal]);

  const scrollToBottom = () => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  };
  useEffect(() => { scrollToBottom(); }, [activeId, contacts]);

  const sendMessage = useCallback(async () => {
    const text = msgInput.trim();
    if (!text && !selectedFile) return;
    
    if (activeContact?.isStreamReal && channel) {
      try {
        setIsUploading(true);
        let fileUrl = null;
        let fileType = null;
        
        if (selectedFile) {
          const isImage = selectedFile.type.startsWith("image/");
          const response = isImage 
            ? await channel.sendImage(selectedFile, selectedFile.name, selectedFile.type)
            : await channel.sendFile(selectedFile, selectedFile.name, selectedFile.type);
          
          fileUrl = response.file;
          fileType = isImage ? "image" : "file";
        }

        const messageData = text ? { text } : {};
        if (fileUrl) {
          messageData.attachments = [
            {
              type: fileType,
              asset_url: fileUrl,
              title: selectedFile.name,
              file_size: selectedFile.size,
              mime_type: selectedFile.type,
            }
          ];
        }

        await channel.sendMessage(messageData);
        setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: text || selectedFile.name, time: "방금" } : c));
        setMsgInput("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error("[Stream] sendMessage failed:", err);
        alert("파일 업로드 또는 메시지 전송에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    } else {
      const newMsg = { id: Date.now(), from: "me", text, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
      setContacts(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, time: "방금" } : c));
      setMsgInput("");
      setSelectedFile(null);
    }
  }, [msgInput, activeContact, channel, activeId, selectedFile]);

  const acceptRequest = (contactId) => setAcceptedIds(prev => [...prev, contactId]);

  const viewerName = user?.name || user?.nickname || user?.username || "나";
  // Stream-aware appendMsg: 실제 DM 채팅방이면 Stream channel에 sendMessage,
  // mock contact 이면 기존 로컬 messages 배열 업데이트 폴백.
  const appendMsg = async (msgs, lastMsgText) => {
    if (channel && activeContact?.isStreamReal) {
      for (const m of msgs) {
        try {
          const fallbackText = m.text
            || (m.type === "project_card" && m.project?.title ? `[프로젝트 카드] ${m.project.title}` : "")
            || (m.type === "system_notice" ? "✨ 시스템 메시지" : "");
          await channel.sendMessage({
            text: fallbackText,
            type_meta: m.type || null,
            project_card: m.project || null,
            role_meta: m.role || null,
            application_id: m.applicationId || null,
            origin_meta: m._origin || null,
          });
        } catch (e) {
          console.error("[Stream] sendMessage 실패:", e);
        }
      }
      return;
    }
    setContacts(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...(c.messages || []), ...msgs], lastMsg: lastMsgText, time: "방금" }
        : c
    ));
  };

  // backend ProjectSummaryResponse → 카드/모달 표시용 정규화
  const normalizeProject = (p) => ({
    id: p.id,
    title: p.title || "(제목 없음)",
    desc: p.desc || p.slogan || p.sloganSub || "",
    tags: (p.tags || []).map(t => (typeof t === "string" && t.startsWith("#")) ? t : `#${t}`),
    period: p.period || (p.durationDays ? `${Math.max(1, Math.round(p.durationDays / 30))}개월` : "기간 협의"),
    budget: p.price || ((p.budgetMin != null && p.budgetMax != null) ? `${p.budgetMin}~${p.budgetMax}만원` : "예산 협의"),
    badge: p.priceType || (p.priceType === "무료" ? "무료" : "유료"),
    deadline: p.deadline ? `마감 ${p.deadline}` : (p.status || "모집중"),
    deadlineColor: "#F59E0B",
    _raw: p,
  });

  // 모달 열림 시 프로젝트 목록 fetch
  const [modalProjects, setModalProjects] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  useEffect(() => {
    if (!projectActionMode) return;
    setModalLoading(true);
    setModalProjects([]);
    let cancelled = false;
    const load = async () => {
      try {
        if (projectActionMode === "myProject" || projectActionMode === "proposal") {
          const data = await projectsApi.myList();
          if (!cancelled) setModalProjects((data || []).map(normalizeProject));
        } else if (projectActionMode === "theirProject") {
          const username = activeContact?.name;
          if (!username) { if (!cancelled) setModalProjects([]); return; }
          const data = await projectsApi.byUsername(username);
          if (!cancelled) setModalProjects((data || []).map(normalizeProject));
        }
      } catch (err) {
        console.error("[FreeMeetingTab] 프로젝트 목록 불러오기 실패:", err);
        if (!cancelled) setModalProjects([]);
      } finally {
        if (!cancelled) setModalLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectActionMode, activeContact?.name]);

  const handleShareProject = (project) => {
    appendMsg(
      [{ id: Date.now(), type: "project_card", from: "me", project, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }],
      `${project.title} 프로젝트 카드를 공유했어요.`
    );
    setProjectActionMode(null);
  };
  const handleSuggestProject = (project, role, note = "") => {
    const t = Date.now();
    const tl = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const baseText = `${viewerName}님이 ${activeContact?.name}님께 [${project.title}] 프로젝트를 ${role} 직무로 제안하셨습니다.`;
    const fullText = note ? `${baseText}\n\n“${note}”` : baseText;
    appendMsg([
      { id: t, type: "project_card", from: "me", project, time: tl },
      { id: t + 1, type: "proposal_request", project, role, text: fullText, time: tl, _origin: "proposal" },
    ], `${project.title} 협업 제안을 보냈어요.`);
    setProjectActionMode(null);
  };
  // 상대 프로젝트(클라이언트)에 지원: project_card + 시스템 메시지(수락/거절 버튼)
  const handleApplyProject = async (project, role) => {
    const t = Date.now();
    const tl = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    let applicationId = null;
    try {
      const result = await applicationsApi.apply(project.id, `${role} 직무로 지원합니다.`);
      applicationId = result?.id || result?.applicationId || null;
    } catch (err) {
      console.error("[FreeMeetingTab] 지원 실패:", err);
      alert("지원 처리 중 오류가 발생했어요.");
      return;
    }
    appendMsg([
      { id: t, type: "project_card", from: "me", project, time: tl },
      { id: t + 1, type: "proposal_request", project, role, applicationId, text: `${viewerName}님이 [${project.title}] 프로젝트에 ${role} 직무로 지원하셨습니다.`, time: tl, _origin: "apply" },
    ], `${project.title}에 지원했어요.`);
    setProjectActionMode(null);
  };
  // 수락/거절 후 처리
  const handleAcceptProposal = async (msg) => {
    const tl = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (msg.applicationId) {
      try { await applicationsApi.updateStatus(msg.applicationId, "ACCEPTED"); }
      catch (err) { console.warn("[FreeMeetingTab] application 수락 실패:", err?.message); }
    }
    const projId = msg?.project?.id;
    if (projId) {
      try { await projectsApi.updateStatus(projId, "IN_PROGRESS"); }
      catch (err) { console.warn("[FreeMeetingTab] project status 업데이트 실패(권한 부족일 수 있음):", err?.message); }
    }
    await appendMsg([
      { id: Date.now(), type: "system_notice", text: `✨ 세부 계약 협의 미팅이 활성화됩니다.\n세부협의를 이어가주세요 ⭐ Good Luck !`, time: tl },
    ], "제안을 수락했어요.");
    setTimeout(() => { onSwitchTab && onSwitchTab("contract_meeting"); }, 800);
  };
  const handleRejectProposal = async (msg) => {
    const tl = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (msg.applicationId) {
      try { await applicationsApi.updateStatus(msg.applicationId, "REJECTED"); }
      catch (err) { console.error("[FreeMeetingTab] 거절 처리 실패:", err); }
    }
    appendMsg([
      { id: Date.now(), type: "system_notice", text: `요청을 거절했어요.`, time: tl },
    ], "제안을 거절했어요.");
  };
  const counterpartIsClient = useMemo(() => {
    const ct = activeCounterpart?.userType;
    if (ct) return ct === "CLIENT";
    // fallback: 내가 PARTNER면 상대는 CLIENT일 가능성 높음
    return user?.userType === "PARTNER";
  }, [activeCounterpart, user]);

  const DRAWER_TABS = ["사진/동영상", "파일", "링크"];

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 580, gap: 0, overflow: "hidden" }}>

      {/* ── 왼쪽: 연락처 목록 ── */}
      <div style={{ width: 280, flexShrink: 0, background: "white", borderRight: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column" }}>
        {/* 검색 */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E2E8F0", padding: "8px 12px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="미팅 검색..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: F, color: "#374151", flex: 1 }}
            />
          </div>
        </div>

        {/* 연락처 목록 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(contact => (
            <div
              key={contact.id}
              onClick={() => { setActiveId(contact.id); setDrawerOpen(false); setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c)); }}
              style={{
                display: "flex", gap: 10, padding: "13px 14px",
                background: activeId === contact.id ? "#EFF6FF" : "white",
                borderLeft: `3px solid ${activeId === contact.id ? "#3B82F6" : "transparent"}`,
                cursor: "pointer", transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={e => { if (activeId !== contact.id) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (activeId !== contact.id) e.currentTarget.style.background = "white"; }}
            >
              <AvatarCircle initials={contact.initials} size={42} avatar={contact.isSelfChat ? myHeroImage : contact.avatar} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{contact.name}</span>
                  {!contact.isSelfChat && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePin(contact.id); }}
                      title={pinnedIds.includes(contact.id) ? "대화 고정 해제" : "대화 고정"}
                      style={{
                        border: "none", background: "transparent", cursor: "pointer", padding: 4,
                        fontSize: 16, lineHeight: 1, flexShrink: 0,
                        opacity: pinnedIds.includes(contact.id) ? 1 : 0.35,
                        transition: "opacity 0.15s, transform 0.15s, filter 0.15s",
                        transform: pinnedIds.includes(contact.id) ? "rotate(-20deg)" : "none",
                        filter: pinnedIds.includes(contact.id) ? "none" : "grayscale(100%)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = pinnedIds.includes(contact.id) ? 1 : 0.35; }}
                    >📌</button>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", fontFamily: F, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.project}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.lastMsg}</span>
                  {contact.unread > 0 && (
                    <span style={{ background: "#3B82F6", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", flexShrink: 0, marginLeft: 4 }}>{contact.unread}</span>
                  )}
                </div>
              </div>
              {/* 고정 아이콘 (self-chat 제외) — 신규 📌 버튼으로 대체되어 숨김 */}
              {false && !contact.isSelfChat && (
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(contact.id); }}
                  title={pinnedIds.includes(contact.id) ? "고정 해제" : "채팅 고정"}
                  style={{
                    position: "absolute", top: 10, right: 8,
                    width: 22, height: 22, padding: 0, border: "none", background: "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: pinnedIds.includes(contact.id) ? 1 : 0.35,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = pinnedIds.includes(contact.id) ? 1 : 0.35; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={pinnedIds.includes(contact.id) ? "#3B82F6" : "none"} stroke={pinnedIds.includes(contact.id) ? "#3B82F6" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 17v5"/>
                    <path d="M9 10.76V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5.76a2 2 0 0 0 1.11 1.79l1.78.9A2 2 0 0 1 19 14.24V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1.76a2 2 0 0 1 1.11-1.79l1.78-.9A2 2 0 0 0 9 10.76z"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 오른쪽: 채팅 영역 ── */}
      {activeContact && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", position: "relative" }}>

          {/* 채팅 헤더 */}
          <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
            <AvatarCircle initials={activeContact.initials} size={38} avatar={activeContact.isSelfChat ? myHeroImage : activeContact.avatar} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{activeContact.name}</div>
              <div style={{ fontSize: 11, color: "#64748B", fontFamily: F }}>Project: {activeContact.project}</div>
            </div>
            {/* 햄버거 버튼 */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${menuOpen ? "#93C5FD" : "#E2E8F0"}`, background: menuOpen ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.background = "#EFF6FF"; }}
                onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; } }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={menuOpen ? "#3B82F6" : "#64748B"} strokeWidth="2.2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
                </svg>
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", top: 40, right: 0, width: 210, background: "white", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 20px 48px rgba(15,23,42,0.14)", padding: 8, zIndex: 10 }}>
                  {[
                    { key: "myProject", label: "내 프로젝트 카드 보기", action: () => { setProjectActionMode("myProject"); setMenuOpen(false); } },
                    { key: "theirProject", label: "상대 프로젝트 카드 보기", action: () => { setProjectActionMode("theirProject"); setMenuOpen(false); } },
                    { key: "proposal", label: "프로젝트 제안하기", action: () => { setProjectActionMode("proposal"); setMenuOpen(false); } },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={item.action}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "white", borderRadius: 12, padding: "11px 12px", fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: F, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* ... 버튼 (서랍장 토글) */}
            <button
              onClick={() => setDrawerOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${drawerOpen ? "#93C5FD" : "#E2E8F0"}`, background: drawerOpen ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.background = "#EFF6FF"; }}
              onMouseLeave={e => { if (!drawerOpen) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={drawerOpen ? "#3B82F6" : "#64748B"} strokeWidth="2.5" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
              </svg>
            </button>
          </div>

          {/* 채팅 + 서랍장 가로 분할 (오버레이) */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

            {/* 메시지 영역 */}
            <div ref={msgContainerRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {displayMessages.messages.map(msg => {
                if (msg.type === "date_divider") {
                  return (
                    <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 16px" }}>
                      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
                      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, fontWeight: 600 }}>{msg.label}</span>
                      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
                    </div>
                  );
                }
                if (msg.type === "system_request") {
                  const accepted = acceptedIds.includes(activeContact.id);
                  return (
                    <div key={msg.id} style={{ marginBottom: 12 }}>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <p style={{ fontSize: 13, color: "#334155", fontFamily: F, margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>{msg.text}</p>
                        </div>
                      </div>
                      {!accepted ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => acceptRequest(activeContact.id)}
                            style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer" }}
                          >요청 수락하기</button>
                          <button
                            style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#374151", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer" }}
                          >프로젝트 상세 내용 페이지로 이동</button>
                        </div>
                      ) : (
                        <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F5F3FF)", border: "1.5px solid #C7D2FE", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1E40AF", fontFamily: F, fontWeight: 600 }}>
                          ✅ 요청을 수락했습니다. 계약 상세 협의 미팅으로 이동합니다.
                        </div>
                      )}
                    </div>
                  );
                }
                if (msg.type === "system_notice") {
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{msg.text}</span>
                      </div>
                    </div>
                  );
                }
                if (msg.type === "project_card") {
                  const isMe = msg.from === "me";
                  const contactHero = activeContact.avatar || CHAT_CONTACT_HEROES[activeContact.id];
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
                      {!isMe && (
                        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #E2E8F0" }}>
                          {contactHero
                            ? <img src={contactHero} alt={activeContact.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <AvatarCircle initials={activeContact.initials} size={36} />
                          }
                        </div>
                      )}
                      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                        {!isMe && <span style={{ fontSize: 11.4, fontWeight: 700, color: "#64748B", fontFamily: F, marginBottom: 4 }}>{activeContact.name}</span>}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                          <MeetingProjectCard project={msg.project} onDetail={setSelectedProject} />
                          <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
                        </div>
                      </div>
                      {isMe && (
                        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
                          <img src={myHeroImage || user?.heroImage || user?.profileImage || user?.picture || heroDefault} alt="me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                  );
                }
                if (msg.type === "proposal_request") {
                  const isMyProposal = msg.from === "me";
                  const handled = acceptedIds.includes(msg.id);
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", margin: "8px 0 12px", gap: 8 }}>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", alignSelf: "stretch" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <p style={{ fontSize: 13, color: "#334155", fontFamily: F, margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>{msg.text}</p>
                        </div>
                      </div>
                      {!handled && (
                        <div style={{ display: "flex", gap: 10, marginTop: 4, alignSelf: "stretch" }}>
                          {!isMyProposal && (
                          <button
                            onClick={() => { setAcceptedIds(prev => [...prev, msg.id]); handleAcceptProposal(msg); }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(59,130,246,0.40)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #c7d2fe 100%)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(147,197,253,0.30)"; }}
                            style={{ flex: 1, padding: "13px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #c7d2fe 100%)", color: "white", fontSize: 15, fontWeight: 800, fontFamily: F, cursor: "pointer", boxShadow: "0 4px 12px rgba(147,197,253,0.30)", transition: "background 0.18s, box-shadow 0.18s" }}
                          >
                            ✓ 요청 수락하기
                          </button>
                          )}
                          <button
                            onClick={() => setSelectedProject(msg.project)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF9C3"; e.currentTarget.style.color = "#713f12"; e.currentTarget.style.borderColor = "#FDE047"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                            style={{ flex: 1, padding: "13px 28px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#ffffff", color: "#374151", fontSize: 15, fontWeight: 700, fontFamily: F, cursor: "pointer", transition: "background 0.18s, color 0.18s, border-color 0.18s" }}
                          >
                            상세 프로젝트 보기
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
                if (msg.type === "system_notice") {
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
                      <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 14, padding: "12px 18px", maxWidth: "80%" }}>
                        <p style={{ fontSize: 13, color: "#075985", fontFamily: F, margin: 0, lineHeight: 1.7, fontWeight: 600, textAlign: "center" }}>{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                const isMe = msg.from === "me";
                const contactHero = activeContact.avatar || CHAT_CONTACT_HEROES[activeContact.id];
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                    {!isMe && (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #E2E8F0" }}>
                        {contactHero
                          ? <img src={contactHero} alt={activeContact.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <AvatarCircle initials={activeContact.initials} size={36} />
                        }
                      </div>
                    )}
                    <div style={{ maxWidth: "60%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && <span style={{ fontSize: 11.4, fontWeight: 700, color: "#64748B", fontFamily: F, marginBottom: 3 }}>{activeContact.name}</span>}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                        {(!msg.file && isOnlyEmoji(msg.text)) ? (
                        <div style={{ background: "transparent", padding: 0, fontSize: 56, lineHeight: 1.1, fontFamily: F }}>
                          {msg.text}
                        </div>
                        ) : (
                        <div style={{
                          background: isMe ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#F8FAFC",
                          color: isMe ? "white" : "#1E293B",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          padding: "12px 18px", fontSize: 13.4, fontFamily: F, lineHeight: 1.6,
                          boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                          border: isMe ? "none" : "1px solid #F1F5F9",
                        }}>
                          {renderTextWithLinks(msg.text)}
                          {msg.file && (
                            msg.file.type === "img" ? (
                              <div onClick={() => window.open(msg.file.url, "_blank")} style={{ cursor: "pointer", marginTop: msg.text ? 8 : 0 }}>
                                <img src={msg.file.url} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8 }} />
                              </div>
                            ) : (
                              <div onClick={() => window.open(msg.file.url, "_blank")} style={{ cursor: "pointer" }}>
                                <FileBubble file={msg.file} />
                              </div>
                            )
                          )}
                        </div>
                        )}
                        <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
                      </div>
                    </div>
                    {isMe && (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
                        <img
                          src={myHeroImage || user?.heroImage || user?.profileImage || user?.picture || heroDefault}
                          alt="me"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 서랍장 (... 클릭 시 - 절대 위치 오버레이로 항상 다 보이게) */}
            {drawerOpen && (
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, borderLeft: "1.5px solid #F1F5F9", background: "#FAFBFC", display: "flex", flexDirection: "column", boxShadow: "-6px 0 18px rgba(15,23,42,0.08)", zIndex: 5 }}>
                {/* 서랍 헤더 */}
                <div style={{ padding: "14px 16px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 12 }}>대화 서랍장</div>
                  <div style={{ display: "flex", gap: 0 }}>
                    {DRAWER_TABS.map(tab => (
                      <button key={tab} onClick={() => setDrawerTab(tab)} style={{ flex: 1, padding: "7px 0", border: "none", background: "transparent", color: drawerTab === tab ? "#3B82F6" : "#94A3B8", fontSize: 12, fontWeight: drawerTab === tab ? 700 : 500, fontFamily: F, cursor: "pointer", borderBottom: `2px solid ${drawerTab === tab ? "#3B82F6" : "transparent"}`, transition: "all 0.15s" }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 서랍 내용 */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px" }}>
                  {drawerTab === "사진/동영상" && (
                    activeContact.sharedImages.length === 0
                      ? <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 사진/동영상이 없습니다.</div>
                      : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {activeContact.sharedImages.map((img, i) => (
                            <div key={i} onClick={() => img.url && window.open(img.url, "_blank")} style={{ aspectRatio: "1", background: "#F1F5F9", borderRadius: 8, overflow: "hidden", cursor: img.url ? "pointer" : "default", border: "1px solid #E2E8F0" }}>
                              {img.url && <img src={img.url} alt="shared" onError={e => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                          ))}
                        </div>
                  )}

                  {drawerTab === "파일" && (() => {
                    const byDate = activeContact.sharedFiles.reduce((acc, f) => { (acc[f.date] = acc[f.date] || []).push(f); return acc; }, {});
                    if (Object.keys(byDate).length === 0) return (
                      <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 파일이 없습니다.</div>
                    );
                    return Object.entries(byDate).map(([date, files]) => (
                      <div key={date} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: F, marginBottom: 8 }}>{date}</div>
                        {files.map((file, i) => {
                          const color = FILE_ICON_COLORS[file.type] || FILE_ICON_COLORS.default;
                          return (
                            <div key={i} onClick={() => window.open(file.url, "_blank")} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = "#93C5FD"}
                              onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                                  <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>{file.size} · 저장됨</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}

                  {drawerTab === "링크" && (
                    activeContact.sharedLinks.length === 0
                      ? <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 링크가 없습니다.</div>
                      : activeContact.sharedLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, textDecoration: "none", transition: "border-color 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#93C5FD"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span>
                          </a>
                        ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 메시지 입력창 */}
          <div style={{ borderTop: "1.5px solid #F1F5F9", padding: "12px 16px", background: "white", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
            {selectedFile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F1F5F9", borderRadius: 8, alignSelf: "flex-start" }}>
                <span style={{ fontSize: 12, color: "#374151", fontFamily: F, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !isUploading) {
                    if (e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                style={{ flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", background: "#FAFBFC", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#93C5FD"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
              <button onClick={() => setShowEmojiPicker(prev => !prev)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: showEmojiPicker ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showEmojiPicker ? "#3b82f6" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
              {showEmojiPicker && (
                <div style={{ position: "absolute", bottom: 50, right: 44, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 10px", boxShadow: "0 10px 32px rgba(0,0,0,0.12)", zIndex: 100, width: 320, maxHeight: 220, overflowX: "hidden", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                  {COMMON_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => { setMsgInput(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={sendMessage}
                disabled={!msgInput.trim() && !selectedFile}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: (msgInput.trim() || selectedFile) ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: (msgInput.trim() || selectedFile) ? "pointer" : "default", flexShrink: 0, transition: "background 0.2s" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>

          {projectActionMode && (() => {
            const isMy = projectActionMode === "myProject";
            const isProposal = projectActionMode === "proposal";
            const isTheir = projectActionMode === "theirProject";
            const theirCanApply = isTheir && counterpartIsClient;
            const requireRole = isProposal || theirCanApply;
            const titleMap = { myProject: "내 프로젝트 카드 보기", theirProject: "상대 프로젝트 카드 보기", proposal: "프로젝트 제안하기" };
            const subtitleMap = {
              myProject: "내가 등록한 프로젝트 중 하나를 골라 채팅창에 카드로 공유합니다.",
              theirProject: theirCanApply
                ? "상대(클라이언트)의 프로젝트 중 하나를 고르고 직무를 선택해 지원합니다."
                : "상대가 등록한 프로젝트 카드를 채팅창에 공유합니다.",
              proposal: "내 프로젝트와 함께할 직무를 선택해 협업 제안 메시지를 보냅니다.",
            };
            const confirmMap = { myProject: "채팅에 공유하기", proposal: "제안 보내기" };
            const confirmLabel = isTheir ? (theirCanApply ? "지원하기" : "채팅에 공유하기") : confirmMap[projectActionMode];
            return (
              <MeetingProjectSelectModal
                title={titleMap[projectActionMode]}
                subtitle={modalLoading ? "프로젝트 목록을 불러오는 중…" : (subtitleMap[projectActionMode] + (modalProjects.length === 0 ? " (등록된 프로젝트가 없습니다)" : ""))}
                projects={modalProjects}
                requireRole={requireRole}
                roleOptions={MEETING_COLLAB_ROLES}
                confirmLabel={confirmLabel}
                onClose={() => setProjectActionMode(null)}
                onConfirm={(project, role) => {
                  if (isMy) { handleShareProject(project); return; }
                  if (isProposal) { handleSuggestProject(project, role); return; }
                  if (isTheir) {
                    if (theirCanApply) { handleApplyProject(project, role); }
                    else { handleShareProject(project); }
                  }
                }}
              />
            );
          })()}
          {selectedProfile && <PartnerDetailPopup partner={selectedProfile} onClose={() => setSelectedProfile(null)} backdrop="transparent" />}
          {selectedProject && <ProjectDetailPopup proj={selectedProject} onClose={() => setSelectedProject(null)} />}
        </div>
      )}
    </div>
  );
}

/* ── ContractMeetingTab ──────────────────────────────────────── */
const MOCK_CONTRACT_CONTACTS = [
  {
    id: 1,
    name: "Alex Miller",
    project: "E-Commerce Platform Modernization",
    initials: "AM",
    time: "10:24 AM",
    lastMsg: "Let's finalize the scope first.",
    unread: 0,
    agreementItems: [
      { label: "작업 범위",            status: "논의 중" },
      { label: "최종 전달물 정의서",    status: "미확정" },
      { label: "마감 일정 및 마일 스톤", status: "논의 중" },
      { label: "총 금액",              status: "미확정" },
      { label: "수정 가능 범위",        status: "미확정" },
      { label: "완료 기준",            status: "논의 중" },
      { label: "추가 특약 (선택)",      status: "미확정" },
    ],
    messages: [
      { id: 1, from: "them", text: "Let's finalize the scope first. I'd like to start with the API layer scope.", time: "10:24 AM" },
      { id: 2, from: "me",   text: "Agreed. The API layer will cover user auth, product catalog, and order management.", time: "10:26 AM" },
      { id: 3, from: "them", text: "Good. What about the payment integration — is that included or a separate module?", time: "10:28 AM" },
    ],
    sharedFiles: [],
    sharedLinks: [],
  },
  {
    id: 2,
    name: "Sarah Chen",
    project: "Mobile Banking App",
    initials: "SC",
    time: "Yesterday",
    lastMsg: "Can we revisit the milestone schedule?",
    unread: 1,
    agreementItems: [
      { label: "작업 범위",            status: "완료" },
      { label: "최종 전달물 정의서",    status: "완료" },
      { label: "마감 일정 및 마일 스톤", status: "논의 중" },
      { label: "총 금액",              status: "완료" },
      { label: "수정 가능 범위",        status: "미확정" },
      { label: "완료 기준",            status: "미확정" },
      { label: "추가 특약 (선택)",      status: "미확정" },
    ],
    messages: [
      { id: 1, from: "them", text: "Can we revisit the milestone schedule?", time: "Yesterday 3:10 PM" },
      { id: 2, from: "me",   text: "Sure, let's adjust phase 2 to end two weeks later.", time: "Yesterday 3:15 PM" },
    ],
    sharedFiles: [],
    sharedLinks: [],
  },
];

const STATUS_STYLES = {
  "논의 중": { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  "미확정":  { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" },
  "완료":    { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "제안됨":  { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
  "협의완료": { bg: "#D1FAE5", color: "#059669", border: "#6EE7B7" },
};

function ContractMeetingTab({ initialContacts = MOCK_CONTRACT_CONTACTS, initialContactId = 1, initialStatuses = null, showDashboardMoveButton = false, chatClient, projectId = null, onDashboardMove = null, initialProjectId = null, filterInProgress = false, meetingMode = "contract" }) {
  const user = useStore(s => s.user);
  const { dbId } = useStore();
  const clientProfileDetail = useStore(s => s.clientProfileDetail);
  const partnerProfileDetail = useStore(s => s.partnerProfileDetail);
  const userRole = useStore(s => s.userRole);
  const [fetchedHero, setFetchedHero] = useState(null);
  const storedHero = (userRole === "partner" ? partnerProfileDetail?.heroImage : clientProfileDetail?.heroImage) || null;
  const myHeroImage = storedHero || fetchedHero || null;
  useEffect(() => {
    if (storedHero) return;
    let cancelled = false;
    profileApi.getMyDetail().then(d => { if (!cancelled && d?.profileImageUrl) setFetchedHero(d.profileImageUrl); }).catch(() => {});
    return () => { cancelled = true; };
  }, [storedHero]);
  const [, setSearchParams] = useSearchParams();
  // 기본 (대시보드 직접 진입) 모드에서는 BE 채팅방을 fetch해서 contacts 사용.
  // ProjectMeetingTab 등이 명시적으로 initialContacts 를 넘겨주면 그 mock 을 그대로 사용.
  const isDefaultContacts = initialContacts === MOCK_CONTRACT_CONTACTS;
  const [contacts, setContacts] = useState(isDefaultContacts ? [] : initialContacts);
  const [activeId, setActiveId] = useState(isDefaultContacts ? null : initialContactId);
  // BE chat rooms fetch (자유미팅과 동일한 DIRECT_MESSAGE 방을 contacts 로 사용)
  useEffect(() => {
    if (!isDefaultContacts || !dbId) return;
    let cancelled = false;
    const fetchRooms = async () => {
      try {
        const r = await fetch(`/api/chat/rooms?userId=${dbId}`);
        const rooms = await r.json();
        if (cancelled) return;
        let list = (rooms || [])
          .filter(r => r.roomType === "DIRECT_MESSAGE")
          .map(r => {
            const counterpartId = r.user1Id === dbId ? r.user2Id : r.user1Id;
            const counterpartName = r.user1Id === dbId ? r.user2Username : r.user1Username;
            const counterpartAvatar = r.user1Id === dbId ? r.user2ProfileImageUrl : r.user1ProfileImageUrl;
            return {
              id: counterpartId,
              targetUserId: counterpartId,
              name: counterpartName,
              project: meetingMode === "project" ? "진행 프로젝트 미팅" : "계약 세부 협의",
              avatar: counterpartAvatar || (counterpartName?.toLowerCase().startsWith("partner") ? heroTeacher : counterpartName?.toLowerCase().startsWith("client") ? heroStudent : heroDefault),
              initials: (counterpartName || "U")[0].toUpperCase(),
              time: "",
              lastMsg: meetingMode === "project" ? "진행 프로젝트 미팅을 이어가세요" : "계약 협의를 이어가세요",
              unread: 0,
              active: false,
              isStreamReal: true,
              messages: [],
              sharedFiles: [],
              sharedImages: [],
              sharedLinks: [],
              agreementItems: [
                { label: "작업 범위",            status: "미확정" },
                { label: "최종 전달물 정의서",   status: "미확정" },
                { label: "마감 일정 및 마일 스톤", status: "미확정" },
                { label: "총 금액",              status: "미확정" },
                { label: "수정 가능 범위",        status: "미확정" },
                { label: "완료 기준",            status: "미확정" },
                { label: "추가 특약 (선택)",     status: "미확정" },
              ],
            };
          });
        if (filterInProgress) {
          try {
            const appList = await applicationsApi.receivedList();
            const inProgressPartnerIds = new Set(
              (appList || []).filter(a => a.status === "IN_PROGRESS").map(a => Number(a.partnerUserId))
            );
            list = list.filter(c => inProgressPartnerIds.has(Number(c.id)));
          } catch (e) {
            console.warn("[ContractMeetingTab] filterInProgress: receivedList 실패", e?.message);
          }
        }
        if (cancelled) return;
        setContacts(list);
        if (list.length > 0) {
          setActiveId(prev => (prev && list.find(c => c.id === prev)) ? prev : list[0].id);
        }
      } catch (err) {
        console.error("[ContractMeetingTab] Fetch rooms failed:", err);
      }
    };
    fetchRooms();
    return () => { cancelled = true; };
  }, [dbId, isDefaultContacts, filterInProgress]);
  const [itemStatusesByContact, setItemStatusesByContact] = useState(() => {
    const defaults = {
      scope: "논의 중",
      deliverable: "미확정",
      schedule: "논의 중",
      payment: "미확정",
      revision: "미확정",
      completion: "논의 중",
      terms: "미확정",
    };

    const mapped = Object.fromEntries(
      initialContacts.map((c) => [
        c.id,
        {
          scope: c.agreementItems?.[0]?.status || defaults.scope,
          deliverable: c.agreementItems?.[1]?.status || defaults.deliverable,
          schedule: c.agreementItems?.[2]?.status || defaults.schedule,
          payment: c.agreementItems?.[3]?.status || defaults.payment,
          revision: c.agreementItems?.[4]?.status || defaults.revision,
          completion: c.agreementItems?.[5]?.status || defaults.completion,
          terms: c.agreementItems?.[6]?.status || defaults.terms,
        },
      ])
    );

    if (initialStatuses) {
      mapped[initialContactId] = { ...mapped[initialContactId], ...initialStatuses };
    }
    return mapped;
  });
  const [searchVal, setSearchVal] = useState("");
  // 대화 고정 (핀) — localStorage 영속화
  const pinKey = dbId ? `chat-pinned-${meetingMode}-${dbId}` : null;
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (!pinKey) return [];
    try { return JSON.parse(localStorage.getItem(pinKey) || "[]"); } catch { return []; }
  });
  useEffect(() => {
    if (!pinKey) return;
    try { localStorage.setItem(pinKey, JSON.stringify(pinnedIds)); } catch { /* noop */ }
  }, [pinKey, pinnedIds]);
  const [msgInput, setMsgInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const [openModal, setOpenModal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("파일");
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectActionMode, setProjectActionMode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [proposalAccepted, setProposalAccepted] = useState({});
  // ── 7모듈 BE 연동 (project_modules) ────────────────────────
  // projectId prop 이 없으면 본인 진행중 프로젝트 첫 번째를 자동 매칭 (시연 편의)
  const [autoProjectId, setAutoProjectId] = useState(null);
  const [contactProjects, setContactProjects] = useState([]);
  const [selectedContractProjectId, setSelectedContractProjectId] = useState(null);
  useEffect(() => {
    if (projectId) return;
    let cancelled = false;
    projectsApi.myList()
      .then(list => {
        if (cancelled) return;
        const pick = (list || []).find(p => p.status === "IN_PROGRESS" || p.status === "진행중") || (list || [])[0];
        if (pick?.id) setAutoProjectId(pick.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);
  // activeContact 변경 시 해당 partner 와 진행중인 내 프로젝트 후보 fetch
  useEffect(() => {
    if (projectId || !activeId) return;
    let cancelled = false;
    applicationsApi.receivedList()
      .then(list => {
        if (cancelled) return;
        const counterpartId = Number(activeId);
        const matched = (list || []).filter(a =>
          Number(a.partnerUserId) === counterpartId &&
          ["ACCEPTED", "IN_PROGRESS", "CONTRACTED"].includes(a.status)
        );
        const dedup = [];
        const seen = new Set();
        matched.forEach(a => {
          const pid = a.projectId || a.project?.id;
          if (!pid || seen.has(pid)) return;
          seen.add(pid);
          dedup.push({ id: pid, title: a.projectTitle || a.project?.title || `프로젝트 #${pid}` });
        });
        setContactProjects(dedup);
        setSelectedContractProjectId(prev => {
          // 외부에서 지정한 initialProjectId 가 후보에 있으면 우선 선택
          if (initialProjectId && dedup.find(p => p.id === initialProjectId)) return initialProjectId;
          if (prev && dedup.find(p => p.id === prev)) return prev;
          return dedup[0]?.id || null;
        });
      })
      .catch(() => { if (!cancelled) { setContactProjects([]); setSelectedContractProjectId(null); } });
    return () => { cancelled = true; };
  }, [activeId, projectId]);
  // contact-specific 매칭만 사용. autoProjectId fallback 제거 (다른 contact 의 데이터가 잘못 노출되는 문제 방지).
  const effectiveProjectId = projectId || selectedContractProjectId;
  // modules[moduleKey] = { status, data, lastModifierId, lastModifierName, updatedAt }
  const [modules, setModules] = useState({});
  const fetchModules = useCallback(async () => {
    if (!effectiveProjectId) return;
    try {
      const list = await projectModulesApi.list(effectiveProjectId);
      const map = {};
      list.forEach(m => {
        let parsed = null;
        try { parsed = m.data ? JSON.parse(m.data) : null; } catch { parsed = null; }
        map[m.moduleKey] = { status: m.status, data: parsed, lastModifierId: m.lastModifierId, lastModifierName: m.lastModifierName, updatedAt: m.updatedAt };
      });
      setModules(map);
    } catch (err) {
      console.warn("[ContractMeetingTab] modules fetch failed:", err?.message);
    }
  }, [effectiveProjectId]);
  useEffect(() => { fetchModules(); }, [fetchModules]);
  // 7초마다 polling (상대방의 수정 자동 반영)
  useEffect(() => {
    if (!effectiveProjectId) return;
    const id = setInterval(fetchModules, 7000);
    return () => clearInterval(id);
  }, [fetchModules, effectiveProjectId]);
  const msgContainerRef = useRef(null);
  const menuRef = useRef(null);

  const CLIENT_MODAL_DEFS = [
    { key: "scope",       Component: ScopeModal },
    { key: "deliverable", Component: DeliverablesModal },
    { key: "schedule",    Component: ScheduleModal },
    { key: "payment",     Component: PaymentModal },
    { key: "revision",    Component: RevisionModal },
    { key: "completion",  Component: CompletionModal },
    { key: "terms",       Component: SpecialTermsModal },
  ];

  const ActiveModal = CLIENT_MODAL_DEFS[openModal]?.Component;
  const isAgreementCompleted = (s) => s === "완료" || s === "협의완료" || s === "확정";
  const DRAWER_TABS = ["사진/동영상", "파일", "링크"];
  const showActionMenu = true;
  const viewerName = user?.name || user?.nickname || "Eden (본인)";

  const activeContact = useMemo(() => {
    return contacts.find(c => c.id === activeId) || contacts[0];
  }, [contacts, activeId]);
  const fallbackStatuses = itemStatusesByContact[activeId] || {
    scope: "논의 중",
    deliverable: "미확정",
    schedule: "논의 중",
    payment: "미확정",
    revision: "미확정",
    completion: "논의 중",
    terms: "미확정",
  };
  // BE modules 의 status 가 있으면 우선 사용
  const activeStatuses = effectiveProjectId
    ? Object.fromEntries(["scope","deliverable","schedule","payment","revision","completion","terms"].map(k => [k, modules[k]?.status || fallbackStatuses[k]]))
    : fallbackStatuses;
  const filtered = contacts
    .filter(c =>
      c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      c.project.toLowerCase().includes(searchVal.toLowerCase())
    )
    .slice()
    .sort((a, b) => {
      const ap = pinnedIds.includes(a.id) ? 1 : 0;
      const bp = pinnedIds.includes(b.id) ? 1 : 0;
      return bp - ap;
    });

  const sharedFiles = activeContact?.sharedFiles || [];
  const sharedLinks = activeContact?.sharedLinks || [];
  const sharedImages = activeContact?.sharedImages || [];

  // ── Helper to render text with clickable links ─────────────────
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?\b)/gi;
    const elements = [];
    let lastIndex = 0;
    let match;
    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      let url = match[0];
      const cleanUrl = url.replace(/[.,!?;:]+$/, "");
      if (cleanUrl.length < url.length) {
        url = cleanUrl;
        urlRegex.lastIndex = match.index + url.length;
      }
      let href = url;
      if (!href.startsWith("http")) {
        href = "https://" + href;
      }
      elements.push(
        <a key={match.index} href={href} target="_blank" rel="noreferrer" 
           style={{ color: "inherit", textDecoration: "underline", fontWeight: "inherit" }}
           onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );
      lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    return elements.length > 0 ? elements : text;
  };

  // ── Stream Chat integration ───────────────────────────────────
  const { channel } = useStreamChannel(chatClient, meetingMode === "project" ? "project_meeting" : "negotiation", dbId, activeContact);
  const streamMessages = useHeadlessMessages(channel);

  // module_update 메시지 수신 시 즉시 modules refetch (상대방의 수정 반영)
  useEffect(() => {
    if (!channel) return;
    const handler = (e) => {
      if (e?.message?.custom_type === "module_update") {
        fetchModules();
      }
    };
    channel.on("message.new", handler);
    return () => { try { channel.off("message.new", handler); } catch {} };
  }, [channel, fetchModules]);

  const displayMessages = useMemo(() => {
    if (activeContact?.isStreamReal && streamMessages && chatClient?.userID) {
      const extractedFiles = [];
      const extractedImages = [];
      const extractedLinks = [];
      const messages = [];

      let lastDateLabel = null;

      streamMessages.forEach(sm => {
        const dateLabel = formatDateKorean(sm.created_at);
        if (dateLabel !== lastDateLabel) {
          messages.push({
            id: `date-${sm.id}`,
            type: "date_divider",
            label: dateLabel,
          });
          lastDateLabel = dateLabel;
        }

        let fileObj = sm.file;
        if (!fileObj && sm.attachments && sm.attachments.length > 0) {
          const att = sm.attachments[0];
          if (att.file_size || att.mime_type) {
            fileObj = {
              name: att.title || att.fallback || "첨부파일",
              type: att.type === "image" ? "img" : (att.mime_type?.includes("pdf") ? "pdf" : "doc"),
              url: att.asset_url || att.image_url
            };
          }
        }

        // Extract for Cabinet
        if (sm.attachments && sm.attachments.length > 0) {
          sm.attachments.forEach(att => {
            const dateStr = new Date(sm.created_at).toISOString().slice(0, 7);
            const isUploaded = att.file_size || att.mime_type;

            if ((att.type === "image" || att.type === "video") && isUploaded) {
              extractedImages.push({ name: att.title || "image", url: att.image_url || att.asset_url, date: dateStr });
            } else if (att.type === "file" && isUploaded) {
              extractedFiles.push({ 
                name: att.title || att.fallback || "파일", 
                type: att.mime_type?.includes("pdf") ? "pdf" : "doc", 
                size: att.file_size ? (att.file_size / 1024).toFixed(0) + " KB" : "Unknown",
                url: att.asset_url,
                date: dateStr 
              });
            } else if (att.type === "url" && att.og_scrape_url) {
              let url = att.og_scrape_url;
              if (!url.startsWith("http")) url = "https://" + url;
              if (!extractedLinks.includes(url)) extractedLinks.push(url);
            }
          });
        }

        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?\b)/gi;
        const matches = sm.text?.match(urlRegex);
        if (matches) {
          matches.forEach(m => {
            let url = m.replace(/[.,!?;:]+$/, "");
            if (!url.startsWith("http")) url = "https://" + url;
            if (!extractedLinks.includes(url)) extractedLinks.push(url);
          });
        }

        messages.push({
          id: sm.id,
          from: (sm.user?.id || sm.userId) === chatClient.userID ? "me" : "them",
          text: sm.text || "",
          time: new Date(sm.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          type: sm.type_meta || (sm.project_card ? "project_card" : "text"),
          project: sm.project_card,
          role: sm.role_meta,
          applicationId: sm.application_id,
          _origin: sm.origin_meta,
          file: fileObj,
        });
      });

      return { messages, extractedFiles, extractedImages, extractedLinks };
    }
    return { messages: activeContact?.messages || [], extractedFiles: [], extractedImages: [], extractedLinks: [] };
  }, [activeContact, streamMessages, chatClient?.userID]);

  useEffect(() => {
    if (activeContact?.isStreamReal) {
      setContacts(prev => prev.map(c => {
        if (c.id === activeId) {
          const changedMessages = JSON.stringify(c.messages) !== JSON.stringify(displayMessages.messages);
          const changedFiles = JSON.stringify(c.sharedFiles) !== JSON.stringify(displayMessages.extractedFiles);
          const changedImages = JSON.stringify(c.sharedImages) !== JSON.stringify(displayMessages.extractedImages);
          const changedLinks = JSON.stringify(c.sharedLinks) !== JSON.stringify(displayMessages.extractedLinks);

          if (changedMessages || changedFiles || changedImages || changedLinks) {
            return { 
              ...c, 
              messages: displayMessages.messages,
              sharedFiles: displayMessages.extractedFiles,
              sharedImages: displayMessages.extractedImages,
              sharedLinks: displayMessages.extractedLinks
            };
          }
        }
        return c;
      }));
    }
  }, [displayMessages, activeId, activeContact?.isStreamReal]);

  useEffect(() => {
    if (msgContainerRef.current) msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
  }, [activeId, contacts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = msgInput.trim();
    if (!text && !selectedFile) return;
    
    if (activeContact?.isStreamReal && channel) {
      try {
        setIsUploading(true);
        let fileUrl = null;
        let fileType = null;
        
        if (selectedFile) {
          const isImage = selectedFile.type.startsWith("image/");
          const response = isImage 
            ? await channel.sendImage(selectedFile, selectedFile.name, selectedFile.type)
            : await channel.sendFile(selectedFile, selectedFile.name, selectedFile.type);
          
          fileUrl = response.file;
          fileType = isImage ? "image" : "file";
        }

        const messageData = text ? { text } : {};
        if (fileUrl) {
          messageData.attachments = [
            {
              type: fileType,
              asset_url: fileUrl,
              title: selectedFile.name,
              file_size: selectedFile.size,
              mime_type: selectedFile.type,
            }
          ];
        }

        await channel.sendMessage(messageData);
        setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: text || selectedFile.name, time: "방금" } : c));
        setMsgInput("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error("[Stream] sendMessage failed:", err);
        alert("파일 업로드 또는 메시지 전송에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    } else {
      const newMsg = { id: Date.now(), from: "me", text, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
      setContacts(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, time: "방금" } : c));
      setMsgInput("");
      setSelectedFile(null);
    }
  }, [msgInput, activeContact, channel, activeId, selectedFile]);

  const appendMessagesToActive = (messages, lastMsg) => {
    setContacts(prev => prev.map(contact => (
      contact.id === activeId
        ? { ...contact, messages: [...contact.messages, ...messages], lastMsg, time: "방금" }
        : contact
    )));
  };

  const handleShareProject = (project) => {
    const nextMsg = {
      id: Date.now(),
      type: "project_card",
      from: "me",
      project,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    appendMessagesToActive([nextMsg], `${project.title} 프로젝트 카드를 공유했어요.`);
    setProjectActionMode(null);
  };

  const handleSuggestProject = (project, role) => {
    const baseTime = Date.now();
    const timeLabel = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const cardMsg = {
      id: baseTime,
      type: "project_card",
      from: "me",
      project,
      time: timeLabel,
    };
    const requestMsg = {
      id: baseTime + 1,
      type: "proposal_request",
      project,
      role,
      text: `${viewerName}님이 ${activeContact.name}님께 [${project.title}] 프로젝트에서 ${role} 직무 함께하기를 제안했습니다.\n요청을 수락하시겠습니까? 요청 수락 시 이후 대화는 계약 상세 협의 미팅으로 넘어갑니다. 🤝`,
      time: timeLabel,
    };

    appendMessagesToActive([cardMsg, requestMsg], `${project.title} 협업 제안을 보냈어요.`);
    setProjectActionMode(null);
  };

  const handleAcceptProposal = async (msg) => {
    if (proposalAccepted[msg.id]) return;
    setProposalAccepted(prev => ({ ...prev, [msg.id]: true }));
    // BE: application/project status 업데이트
    if (msg.applicationId) {
      try { await applicationsApi.updateStatus(msg.applicationId, "ACCEPTED"); }
      catch (err) { console.warn("[ContractMeetingTab] application 수락 실패:", err?.message); }
    }
    const projId = msg?.project?.id;
    if (projId) {
      try { await projectsApi.updateStatus(projId, "IN_PROGRESS"); }
      catch (err) { console.warn("[ContractMeetingTab] project status 업데이트 실패(권한 부족일 수 있음):", err?.message); }
    }
    // 시스템 메시지 송신
    const tl = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    appendMessagesToActive(
      [{ id: Date.now(), type: "system_notice", text: `✨ 세부 계약 협의 미팅이 활성화됩니다.\n세부협의를 이어가주세요 ⭐ Good Luck !`, time: tl }],
      "제안을 수락했어요."
    );
  };

  const handlePropose = async (idx) => {
    const key = CLIENT_MODAL_DEFS[idx]?.key;
    const label = activeContact?.agreementItems?.[idx]?.label || `${idx + 1}번 항목`;
    const cur = modules[key];
    const curData = cur?.data || {};
    const curNego = curData._nego || {};
    const myName = user?.name || user?.username || "나";
    const otherAlreadyProposed = curNego.proposerAccepted && Number(curNego.proposerUserId) !== Number(dbId);
    let nextStatus, nextNego;
    if (otherAlreadyProposed) {
      nextStatus = "협의완료";
      nextNego = { ...curNego, workerUserId: dbId, workerName: myName, workerAccepted: true };
    } else {
      nextStatus = "제안됨";
      nextNego = { ...curNego, proposerUserId: dbId, proposerName: myName, proposerAccepted: true, workerAccepted: curNego.workerAccepted || false };
    }
    const newData = { ...curData, _nego: nextNego };
    if (key && effectiveProjectId) {
      try {
        await projectModulesApi.upsert(effectiveProjectId, key, { status: nextStatus, data: newData });
        await fetchModules();
      } catch (err) {
        console.warn("[ContractMeetingTab] propose upsert 실패:", err?.message);
      }
    } else if (key) {
      setItemStatusesByContact(prev => ({
        ...prev,
        [activeId]: { ...prev[activeId], [key]: nextStatus },
      }));
    }
    if (channel) {
      try {
        await channel.sendMessage({
          text: otherAlreadyProposed
            ? `🤝 [${label}] 항목을 수락했습니다 — 협의 완료 😀✅`
            : `📋 [${label}] 항목을 제안했습니다. 상대방 확인 대기 중`,
          custom_type: otherAlreadyProposed ? "module_complete" : "module_update",
          module_key: key,
        });
      } catch (e) { /* noop */ }

      // 7개 항목 모두 협의완료 시 시스템 메시지 (이번 수락으로 마지막 항목이 완료된 경우)
      if (otherAlreadyProposed) {
        const allKeys = ["scope","deliverable","schedule","payment","revision","completion","terms"];
        const completedKeys = allKeys.filter(k => {
          if (k === key) return true;
          return modules[k]?.status === "협의완료" || modules[k]?.status === "확정";
        });
        if (completedKeys.length === allKeys.length) {
          try {
            await channel.sendMessage({
              text: `🎊 모두 협의 완료! '진행 프로젝트'로 이동해주세요!`,
              custom_type: "all_modules_complete",
            });
          } catch (e) { /* noop */ }
        }
      }
    }
    
    // alert 먼저 표시 후 모달 닫기
    alert(otherAlreadyProposed
      ? `🎉 협의 완료!\n[${label}] 항목이 확정되었습니다.`
      : `✅ 제안 완료\n상대방의 수락하기를 기다립니다.`);
    setOpenModal(null);
  };

  const doneCount = Object.values(activeStatuses).filter(isAgreementCompleted).length;
  const totalCount = Object.keys(activeStatuses).length || 7;
  const progress = Math.round((doneCount / totalCount) * 100);

  const renderSystemNotice = (msg) => (
    <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "8px 0 14px" }}>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 999, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{msg.text}</span>
      </div>
    </div>
  );

  const renderProposalRequest = (msg) => {
    const accepted = !!proposalAccepted[msg.id];
    return (
      <div key={msg.id} style={{ marginBottom: 14 }}>
        <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "16px 18px", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 13, color: "#334155", fontFamily: F, margin: 0, lineHeight: 1.75, whiteSpace: "pre-line" }}>{msg.text}</p>
          </div>
        </div>

        {!accepted ? (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => handleAcceptProposal(msg)}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                color: "white", fontSize: 14, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}
            >
              요청 수락하기
            </button>
            <button
              onClick={() => setSelectedProject(msg.project)}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #E2E8F0",
                background: "white", color: "#374151", fontSize: 14, fontWeight: 600, fontFamily: F, cursor: "pointer",
              }}
            >
              프로젝트 상세 내용 페이지로 이동
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 999, padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>계약 상세 협의 미팅으로 이동하여 프로젝트 협의를 이어 진행해주세요 😊</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProjectCardMessage = (msg) => {
    const isMe = msg.from === "me";
    const contactHero = activeContact.avatar || CHAT_CONTRACT_HEROES[activeContact.id];

    return (
      <div key={msg.id} style={{ display: "flex", flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
        {!isMe && (
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #E2E8F0" }}>
            {contactHero
              ? <img src={contactHero} alt={activeContact.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <AvatarCircle initials={activeContact.initials} size={36} />
            }
          </div>
        )}
        <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
          {!isMe && <span style={{ fontSize: 11.4, fontWeight: 700, color: "#64748B", fontFamily: F, marginBottom: 4 }}>{activeContact.name}</span>}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
            <MeetingProjectCard project={msg.project} onDetail={setSelectedProject} />
            <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
          </div>
        </div>
        {isMe && (
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
            <img
              src={myHeroImage || user?.heroImage || user?.profileImage || user?.picture || heroDefault}
              alt="me"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderDefaultMessage = (msg) => {
    const isMe = msg.from === "me";
    const contactHero = activeContact.avatar || CHAT_CONTRACT_HEROES[activeContact.id];

    return (
      <div key={msg.id} style={{ display: "flex", flexDirection: "row", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
        {!isMe && (
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #E2E8F0" }}>
            {contactHero
              ? <img src={contactHero} alt={activeContact.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <AvatarCircle initials={activeContact.initials} size={36} />
            }
          </div>
        )}
        <div style={{ maxWidth: "60%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
          {!isMe && <span style={{ fontSize: 11.4, fontWeight: 700, color: "#64748B", fontFamily: F, marginBottom: 3 }}>{activeContact.name}</span>}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
            {(!msg.file && isOnlyEmoji(msg.text)) ? (
            <div style={{ background: "transparent", padding: 0, fontSize: 56, lineHeight: 1.1, fontFamily: F }}>
              {msg.text}
            </div>
            ) : (
            <div style={{
              background: isMe ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "white",
              color: isMe ? "white" : "#1E293B",
              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 18px", fontSize: 13.4, fontFamily: F, lineHeight: 1.6,
              boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
              border: isMe ? "none" : "1px solid #F1F5F9",
            }}>
              {renderTextWithLinks(msg.text)}
              {msg.file && (
                msg.file.type === "img" ? (
                  <div onClick={() => window.open(msg.file.url, "_blank")} style={{ cursor: "pointer", marginTop: msg.text ? 8 : 0 }}>
                    <img src={msg.file.url} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8 }} />
                  </div>
                ) : (
                  <div onClick={() => window.open(msg.file.url, "_blank")} style={{ cursor: "pointer" }}>
                    <FileBubble file={msg.file} />
                  </div>
                )
              )}
            </div>
            )}
            <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
          </div>
        </div>
        {isMe && (
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
            <img
              src={myHeroImage || user?.heroImage || user?.profileImage || user?.picture || heroDefault}
              alt="me"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0, overflow: "hidden", position: "relative" }}>

      {/* ── 왼쪽: 연락처 목록 + 협의항목 카드 ── */}
      <div style={{ width: 400, flexShrink: 0, background: "white", borderRight: "1.5px solid #F1F5F9", display: "flex", flexDirection: "column", position: "relative", transform: "translate(0, 0)", overflow: "hidden" }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E2E8F0", padding: "8px 12px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="미팅 검색..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: F, color: "#374151", flex: 1 }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(contact => {
            const statuses = itemStatusesByContact[contact.id] || {};
            const done = Object.values(statuses).filter(isAgreementCompleted).length;
            const total = Object.keys(statuses).length || 7;
            return (
              <div
                key={contact.id}
                onClick={() => { setActiveId(contact.id); setDrawerOpen(false); setMenuOpen(false); setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c)); }}
                style={{
                  display: "flex", gap: 10, padding: "13px 14px",
                  background: activeId === contact.id ? "#EFF6FF" : "white",
                  borderLeft: `3px solid ${activeId === contact.id ? "#3B82F6" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (activeId !== contact.id) e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (activeId !== contact.id) e.currentTarget.style.background = "white"; }}
              >
                <AvatarCircle initials={contact.initials} size={42} avatar={contact.isSelfChat ? myHeroImage : contact.avatar} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{contact.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedIds(prev => prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]);
                      }}
                      title={pinnedIds.includes(contact.id) ? "대화 고정 해제" : "대화 고정"}
                      style={{
                        border: "none", background: "transparent", cursor: "pointer", padding: 4,
                        fontSize: 16, lineHeight: 1, flexShrink: 0,
                        opacity: pinnedIds.includes(contact.id) ? 1 : 0.35,
                        transition: "opacity 0.15s, transform 0.15s, filter 0.15s",
                        transform: pinnedIds.includes(contact.id) ? "rotate(-20deg)" : "none",
                        filter: pinnedIds.includes(contact.id) ? "none" : "grayscale(100%)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = pinnedIds.includes(contact.id) ? 1 : 0.35; }}
                    >📌</button>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", fontFamily: F, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.project}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{contact.lastMsg}</span>
                    {contact.unread > 0 && (
                      <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: "#3B82F6", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "0 4px" }}>{contact.unread}</span>
                    )}
                  </div>
                  {/* 협의 진행도 미니바 */}
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((done / total) * 100)}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{done}/{total}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 계약 세부 협의 항목 카드 - 컴팩트 디자인 (이미지4 스타일) */}
        {activeContact && (
          <div style={{ flexShrink: 0, borderTop: "2px solid #EFF6FF", background: "white", padding: "12px 14px" }}>
            {contactProjects.length >= 1 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", fontFamily: F, marginBottom: 5 }}>📁 협의할 프로젝트 선택</div>
                <select
                  value={selectedContractProjectId || ""}
                  onChange={(e) => setSelectedContractProjectId(Number(e.target.value))}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                    fontSize: 12.5, fontFamily: F, color: "#1E293B", fontWeight: 600,
                    cursor: "pointer", outline: "none",
                  }}
                >
                  {contactProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}
            {/* 카드 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", fontFamily: F }}>계약 세부 협의 항목</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: progress === 100 ? "#16A34A" : "#3B82F6", background: progress === 100 ? "#F0FDF4" : "#EFF6FF", border: `1px solid ${progress === 100 ? "#BBF7D0" : "#BFDBFE"}`, borderRadius: 99, padding: "2px 8px", fontFamily: F }}>진행률 {progress}%</span>
            </div>
            {/* 항목 리스트 - 한 줄 컴팩트 */}
            {activeContact.agreementItems.map((item, idx) => {
              const key = CLIENT_MODAL_DEFS[idx]?.key;
              const st = STATUS_STYLES[activeStatuses[key]] || STATUS_STYLES["미확정"];
              return (
                <div
                  key={idx}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 8px", borderRadius: 6, marginBottom: 1,
                    cursor: "pointer", transition: "background 0.15s",
                    background: "transparent",
                  }}
                  onClick={() => setOpenModal(idx)}
                >
                  <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 500, fontFamily: F }}>
                    <span style={{ color: "#94A3B8", fontWeight: 600, marginRight: 4 }}>{idx + 1}.</span>
                    {item.label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 99, padding: "1.5px 8px", fontFamily: F, flexShrink: 0 }}>{activeStatuses[key]}</span>
                    <span style={{ fontSize: 12, color: "#C4C9D4" }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 오른쪽: 채팅 영역 ── */}
      {activeContact && (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#FAFBFC" }}>

          {/* 채팅 헤더 */}
          <div style={{ padding: "14px 18px", background: "white", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AvatarCircle initials={activeContact.initials} size={38} avatar={activeContact.isSelfChat ? myHeroImage : activeContact.avatar} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{activeContact.name}</div>
                <div style={{ fontSize: 11, color: "#64748B", fontFamily: F }}>Project: {activeContact.project}</div>
              </div>
            </div>
            <div ref={menuRef} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              {!showDashboardMoveButton && progress === 100 && (
                <button
                  onClick={async () => {
                    if (effectiveProjectId) {
                      try { await projectsApi.updateStatus(effectiveProjectId, "IN_PROGRESS"); }
                      catch (err) { console.warn("[ContractMeetingTab] project status 업데이트 실패:", err?.message); }
                      // partner application 자동 보장 → 파트너 측 진행관리 탭에 카드 노출
                      const partnerUserId = activeContact?.targetUserId || activeContact?.id;
                      if (partnerUserId) {
                        try { await applicationsApi.ensureActive(effectiveProjectId, partnerUserId); }
                        catch (err) { console.warn("[ContractMeetingTab] application 자동 보장 실패:", err?.message); }
                      }
                    }
                    if (channel) {
                      try {
                        await channel.sendMessage({
                          text: `🚀 모든 항목 협의 완료! 진행 프로젝트로 미팅을 이어가주세요!`,
                          custom_type: "move_to_project_meeting",
                        });
                      } catch (e) { console.warn("[ContractMeetingTab] system message send failed:", e?.message); }
                    }
                    setSearchParams({ tab: "project_meeting" }, { replace: true });
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #93C5FD 0%, #A5B4FC 50%, #C4B5FD 100%)"; e.currentTarget.style.boxShadow = "0 5px 18px rgba(167,139,250,0.50)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #BAE6FD 0%, #C7D2FE 50%, #DDD6FE 100%)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(167,139,250,0.30)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #BAE6FD 0%, #C7D2FE 50%, #DDD6FE 100%)", color: "#4338CA", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: F, boxShadow: "0 3px 10px rgba(167,139,250,0.30)", transition: "background 0.2s, box-shadow 0.2s, transform 0.15s", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
                >
                  🚀 진행 프로젝트 미팅 시작
                </button>
              )}
              {showDashboardMoveButton ? (
                <button
                  onClick={() => { setSearchParams({ tab: "project_manage" }, { replace: true }); onDashboardMove?.(effectiveProjectId); }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(99,102,241,0.28)"; }}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 3px 10px rgba(99,102,241,0.28)", transition: "background 0.15s, box-shadow 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  대시보드 이동
                </button>
              ) : null}

              {showActionMenu && (
                <button
                  onClick={() => setMenuOpen(open => !open)}
                  style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${menuOpen ? "#93C5FD" : "#E2E8F0"}`, background: menuOpen ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={menuOpen ? "#3B82F6" : "#64748B"} strokeWidth="2.2" strokeLinecap="round">
                    <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
                  </svg>
                </button>
              )}

              <button
                onClick={() => setDrawerOpen(open => !open)}
                style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${drawerOpen ? "#93C5FD" : "#E2E8F0"}`, background: drawerOpen ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={drawerOpen ? "#3B82F6" : "#64748B"} strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>

              {menuOpen && showActionMenu && (
                <div style={{ position: "absolute", top: 44, right: 42, width: 210, background: "white", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 20px 48px rgba(15,23,42,0.14)", padding: 8, zIndex: 10 }}>
                  {[
                    { key: "share", label: "프로젝트 보여주기", action: () => { setProjectActionMode("share"); setMenuOpen(false); } },
                    { key: "proposal", label: "프로젝트 제안하기", action: () => { setProjectActionMode("proposal"); setMenuOpen(false); } },
                    { key: "profile", label: "상대 프로필 보기", action: () => { setSelectedProfile(getMeetingPartnerPreview(activeContact)); setMenuOpen(false); } },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={item.action}
                      style={{ width: "100%", textAlign: "left", border: "none", background: "white", borderRadius: 12, padding: "11px 12px", fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: F, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 채팅 + 서랍장 (오버레이) */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
            <div ref={msgContainerRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 0 }}>

              {/* 시스템 메시지 (채팅 시작점, 스크롤과 함께 올라감) */}
              <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 14, padding: "14px 18px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6", fontFamily: F, marginBottom: 6 }}>시스템 메시지</div>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", fontFamily: F, lineHeight: 1.75 }}>
                  계약 세부 협의 미팅이 시작되었어요. 자유 미팅에서 상호 수락이 완료되어,<br />
                  이제 작업 범위·일정·금액을 구체적으로 정리하는 단계예요.
                </p>
              </div>

              {/* 날짜 구분선 */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", fontFamily: F, background: "#F1F5F9", borderRadius: 99, padding: "4px 14px", letterSpacing: "0.05em" }}>
                  TODAY, OCT 24
                </span>
              </div>

              {(displayMessages.messages || displayMessages || []).map(msg => {
                if (msg.type === "project_card") return renderProjectCardMessage(msg);
                if (msg.type === "proposal_request") return renderProposalRequest(msg);
                if (msg.type === "system_notice") return renderSystemNotice(msg);
                return renderDefaultMessage(msg);
              })}
            </div>

            {drawerOpen && (
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, borderLeft: "1.5px solid #F1F5F9", background: "#FAFBFC", display: "flex", flexDirection: "column", boxShadow: "-6px 0 18px rgba(15,23,42,0.08)", zIndex: 5 }}>
                <div style={{ padding: "14px 16px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 12 }}>대화 서랍장</div>
                  <div style={{ display: "flex", gap: 0 }}>
                    {DRAWER_TABS.map(tab => (
                      <button key={tab} onClick={() => setDrawerTab(tab)} style={{ flex: 1, padding: "7px 0", border: "none", background: "transparent", color: drawerTab === tab ? "#3B82F6" : "#94A3B8", fontSize: 12, fontWeight: drawerTab === tab ? 700 : 500, fontFamily: F, cursor: "pointer", borderBottom: `2px solid ${drawerTab === tab ? "#3B82F6" : "transparent"}`, transition: "all 0.15s" }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
                  {drawerTab === "사진/동영상" && (
                    sharedImages.length === 0
                      ? <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 사진/동영상이 없습니다.</div>
                      : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {sharedImages.map((image, index) => (
                            <div key={`${image.name || "image"}-${index}`} onClick={() => image.url && window.open(image.url, "_blank")} style={{ aspectRatio: "1", background: "#F1F5F9", borderRadius: 10, overflow: "hidden", cursor: image.url ? "pointer" : "default", border: "1px solid #E2E8F0" }}>
                              {image.url && <img src={image.url} alt="shared" onError={e => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                          ))}
                        </div>
                  )}
                  {drawerTab === "파일" && (() => {
                    const byDate = sharedFiles.reduce((acc, file) => { (acc[file.date] = acc[file.date] || []).push(file); return acc; }, {});
                    if (Object.keys(byDate).length === 0) {
                      return <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 파일이 없습니다.</div>;
                    }

                    return Object.entries(byDate).map(([date, files]) => (
                      <div key={date} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: F, marginBottom: 8 }}>{date}</div>
                        {files.map((file, index) => {
                          const color = FILE_ICON_COLORS[file.type] || FILE_ICON_COLORS.default;
                          return (
                            <div key={`${file.name}-${index}`} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                                  <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>{file.size} · 저장됨</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                  {drawerTab === "링크" && (
                    sharedLinks.length === 0
                      ? <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 링크가 없습니다.</div>
                      : sharedLinks.map((link, index) => (
                          <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, textDecoration: "none" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span style={{ fontSize: 12, color: "#3B82F6", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span>
                          </a>
                        ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 메시지 입력창 */}
          <div style={{ borderTop: "1.5px solid #F1F5F9", padding: "12px 16px", background: "white", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, position: "relative" }}>
            {selectedFile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#F1F5F9", borderRadius: 8, alignSelf: "flex-start" }}>
                <span style={{ fontSize: 12, color: "#374151", fontFamily: F, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
              <input
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !isUploading) {
                    if (e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                style={{ flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", background: "#FAFBFC", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#93C5FD"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
              <button onClick={() => setShowEmojiPicker(prev => !prev)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: showEmojiPicker ? "#EFF6FF" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showEmojiPicker ? "#3b82f6" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
              {showEmojiPicker && (
                <div style={{ position: "absolute", bottom: 50, right: 44, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 10px", boxShadow: "0 10px 32px rgba(0,0,0,0.12)", zIndex: 100, width: 320, maxHeight: 220, overflowX: "hidden", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                  {COMMON_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => { setMsgInput(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "6px 0", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={sendMessage}
                disabled={(!msgInput.trim() && !selectedFile) || isUploading}
                style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: ((msgInput.trim() || selectedFile) && !isUploading) ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: ((msgInput.trim() || selectedFile) && !isUploading) ? "pointer" : "default", flexShrink: 0, transition: "background 0.2s" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>

          {projectActionMode && (
            <MeetingProjectSelectModal
              title={projectActionMode === "share" ? "프로젝트 보여주기" : "프로젝트 제안하기"}
              subtitle={projectActionMode === "share" ? "채팅창에 프로젝트 카드를 바로 공유합니다." : "프로젝트를 고르고 함께할 직무를 선택해 제안 메시지를 보냅니다."}
              projects={CLIENT_MEETING_PROJECT_OPTIONS}
              requireRole={projectActionMode === "proposal"}
              roleOptions={MEETING_COLLAB_ROLES}
              confirmLabel={projectActionMode === "share" ? "채팅에 공유하기" : "제안 보내기"}
              onClose={() => setProjectActionMode(null)}
              onConfirm={(project, role) => {
                if (projectActionMode === "share") {
                  handleShareProject(project);
                  return;
                }

                handleSuggestProject(project, role);
              }}
            />
          )}

          {selectedProject && <ProjectDetailPopup proj={selectedProject} onClose={() => setSelectedProject(null)} />}
          {selectedProfile && <PartnerDetailPopup partner={selectedProfile} onClose={() => setSelectedProfile(null)} backdrop="transparent" />}
        </div>
      )}

      {/* ── 계약 세부 협의 모달: 7항목 영역 + 채팅 영역을 모두 덮는 absolute overlay ── */}
      {openModal !== null && ActiveModal && (() => {
        const key = CLIENT_MODAL_DEFS[openModal]?.key;
        const moduleData = modules[key]?.data || null;
        const beStatus = modules[key]?.status;
        const itemLabel = activeContact?.agreementItems?.[openModal]?.label || "";
        // ClientDashboard: 나=client, 상대=partner
        const clientName = user?.name || user?.username || "나";
        const partnerName = activeContact?.name || "상대방";
        return (
          <div style={{ position: "absolute", left: 400, top: 0, right: 0, bottom: 0, background: "white", zIndex: 50, display: "flex", flexDirection: "column", borderLeft: "1.5px solid #F1F5F9" }}>
            {/* 헤더 바: 항목명 + 작업자/제안자 배지 + X 닫기 */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1.5px solid #F1F5F9", background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{openModal + 1}. {itemLabel}</span>
                {(() => {
                  const status = beStatus || activeStatuses?.[key];
                  const nego = modules[key]?.data?._nego || {};
                  const clientAccepted = !!nego.clientAccepted || !!nego.proposerAccepted || status === "제안됨" || status === "협의완료";
                  const partnerAccepted = !!nego.partnerAccepted || !!nego.workerAccepted || status === "협의완료";
                  const bothAccepted = clientAccepted && partnerAccepted;
                  const Check = ({ on, color }) => (
                    on
                      ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: color, color: "#FFFFFF", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>✓</span>
                      : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: "transparent", border: `1.5px dashed ${color}80`, color: "transparent", fontSize: 10, flexShrink: 0 }}>✓</span>
                  );
                  return (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#9A3412", background: "#FFEDD5", border: "1px solid #FED7AA", borderRadius: 99, padding: "5px 13px", fontFamily: F }}>
                        <Check on={clientAccepted} color="#F97316" />
                        client: {clientName}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#0369A1", background: "#E0F2FE", border: "1px solid #BAE6FD", borderRadius: 99, padding: "5px 13px", fontFamily: F }}>
                        <Check on={partnerAccepted} color="#0EA5E9" />
                        partner: {partnerName}
                      </span>
                      {bothAccepted && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "#FFFFFF", background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)", border: "none", borderRadius: 99, padding: "5px 13px", fontFamily: F, boxShadow: "0 2px 6px rgba(16,185,129,0.25)" }}>
                          <span style={{ fontSize: 12 }}>✓</span>
                          협의 완료
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setOpenModal(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FEF9C3"; e.currentTarget.style.color = "#713f12"; e.currentTarget.style.borderColor = "#FDE047"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                aria-label="닫기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* 모달 본문 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 12px 20px 24px", background: "white" }}>
              <ActiveModal
                inline={true}
                onClose={() => setOpenModal(null)}
                onSubmit={() => handlePropose(openModal)}
                moduleStatus={activeStatuses[key]}
                showHeaderStatusBadge={false}
                value={moduleData}
                onChange={async (newData) => {
                  if (!effectiveProjectId || !key) return;
                  try {
                    await projectModulesApi.upsert(effectiveProjectId, key, { status: "논의 중", data: newData });
                    await fetchModules();
                  } catch (err) {
                    console.warn("[ContractMeetingTab] module save failed:", err?.message);
                  }
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── IncomeTab (수입/정산 관리) ──────────────────────────────── */
// 클라이언트 관점:
//   - income = 환불/크레딧/정산 환급
//   - expense = 프로젝트 지급금/플랫폼 수수료/부가 서비스
const INCOME_DATA = [
  // ── 2025-11 ──
  { date: "2025-11-04", type: "expense", title: "AI 이상거래 시스템 계약금 지급",     category: "AI/ML Project",       amount: 3500000 },
  { date: "2025-11-08", type: "expense", title: "플랫폼 수수료 (10월)",              category: "Platform Fee",        amount: 180000 },
  { date: "2025-11-12", type: "expense", title: "Website Development 2차 지급",      category: "Website Project",     amount: 2800000 },
  { date: "2025-11-16", type: "income",  title: "미완료 프로젝트 환불",               category: "Refund",              amount: 450000 },
  { date: "2025-11-20", type: "expense", title: "Consulting 착수금",                 category: "Consulting Fee",      amount: 1200000 },
  { date: "2025-11-25", type: "expense", title: "AI 이상거래 중도금",                category: "AI/ML Project",       amount: 4200000 },
  { date: "2025-11-29", type: "expense", title: "상단 노출 광고",                    category: "Marketing",           amount: 250000 },

  // ── 2025-12 ──
  { date: "2025-12-03", type: "expense", title: "App Deployment 선급금",             category: "App Project",         amount: 1800000 },
  { date: "2025-12-06", type: "expense", title: "플랫폼 수수료 (11월)",              category: "Platform Fee",        amount: 210000 },
  { date: "2025-12-10", type: "income",  title: "파트너 평가 보너스 크레딧",          category: "Credit",              amount: 150000 },
  { date: "2025-12-14", type: "expense", title: "Consulting 마일스톤 1",              category: "Consulting Fee",      amount: 950000 },
  { date: "2025-12-18", type: "expense", title: "AI 이상거래 완료 정산",              category: "AI/ML Project",       amount: 5500000 },
  { date: "2025-12-22", type: "expense", title: "Website Development 잔금",           category: "Website Project",     amount: 1900000 },
  { date: "2025-12-27", type: "income",  title: "연말 프로모션 크레딧",               category: "Credit",              amount: 300000 },
  { date: "2025-12-30", type: "expense", title: "추가 미팅 룸 예약",                  category: "Marketing",           amount: 80000 },

  // ── 2026-01 ──
  { date: "2026-01-05", type: "expense", title: "신년 AI 프로젝트 계약금",            category: "AI/ML Project",       amount: 5000000 },
  { date: "2026-01-09", type: "expense", title: "플랫폼 수수료 (12월)",              category: "Platform Fee",        amount: 280000 },
  { date: "2026-01-12", type: "expense", title: "Consulting 1차 지급",               category: "Consulting Fee",      amount: 1100000 },
  { date: "2026-01-16", type: "income",  title: "프로젝트 조기 종료 환불",            category: "Refund",              amount: 620000 },
  { date: "2026-01-20", type: "expense", title: "App Deployment 중도금",              category: "App Project",         amount: 2400000 },
  { date: "2026-01-25", type: "expense", title: "Website Development 착수금",         category: "Website Project",     amount: 2200000 },
  { date: "2026-01-28", type: "expense", title: "프리미엄 광고",                     category: "Marketing",           amount: 180000 },

  // ── 2026-02 ──
  { date: "2026-02-02", type: "expense", title: "AI 프로젝트 중도금 1",               category: "AI/ML Project",       amount: 3800000 },
  { date: "2026-02-06", type: "expense", title: "플랫폼 수수료 (1월)",                category: "Platform Fee",        amount: 310000 },
  { date: "2026-02-10", type: "expense", title: "Consulting 마일스톤 2",              category: "Consulting Fee",      amount: 1350000 },
  { date: "2026-02-14", type: "expense", title: "App Deployment 완료 정산",           category: "App Project",         amount: 3100000 },
  { date: "2026-02-18", type: "income",  title: "만족도 보상 크레딧",                 category: "Credit",              amount: 200000 },
  { date: "2026-02-21", type: "expense", title: "Website Development 중도금",         category: "Website Project",     amount: 1800000 },
  { date: "2026-02-26", type: "expense", title: "배너 광고",                         category: "Marketing",           amount: 150000 },

  // ── 2026-03 ──
  { date: "2026-03-02", type: "expense", title: "Website Development 1차 지급",       category: "Website Project",     amount: 4500000 },
  { date: "2026-03-04", type: "expense", title: "App Deployment 선급금",              category: "App Project",         amount: 524000 },
  { date: "2026-03-06", type: "expense", title: "플랫폼 수수료 (2월)",                category: "Platform Fee",        amount: 340000 },
  { date: "2026-03-08", type: "expense", title: "Consulting 착수금",                 category: "Consulting Fee",      amount: 890000 },
  { date: "2026-03-10", type: "expense", title: "App Deployment 중도금",              category: "App Project",         amount: 1328000 },
  { date: "2026-03-13", type: "income",  title: "지원 철회 환불",                     category: "Refund",              amount: 380000 },
  { date: "2026-03-15", type: "expense", title: "Consulting 마일스톤 1",              category: "Consulting Fee",      amount: 2110000 },
  { date: "2026-03-19", type: "expense", title: "AI 모델 프로젝트 계약금",             category: "AI/ML Project",       amount: 4800000 },
  { date: "2026-03-22", type: "expense", title: "Website Development 2차",            category: "Website Project",     amount: 2200000 },
  { date: "2026-03-25", type: "income",  title: "리뷰 보상 크레딧",                   category: "Credit",              amount: 120000 },
  { date: "2026-03-28", type: "expense", title: "상단 노출 광고 (3월)",               category: "Marketing",           amount: 220000 },

  // ── 2026-04 (현재 월) ──
  { date: "2026-04-02", type: "expense", title: "AI 모델 중도금 1",                   category: "AI/ML Project",       amount: 3600000 },
  { date: "2026-04-04", type: "expense", title: "플랫폼 수수료 (3월)",                category: "Platform Fee",        amount: 420000 },
  { date: "2026-04-07", type: "expense", title: "Consulting 신규 계약금",              category: "Consulting Fee",      amount: 1500000 },
  { date: "2026-04-09", type: "expense", title: "App Deployment 선급금",              category: "App Project",         amount: 2200000 },
  { date: "2026-04-11", type: "income",  title: "파트너 재계약 할인 환급",            category: "Credit",              amount: 250000 },
  { date: "2026-04-13", type: "expense", title: "Website Development 1차",            category: "Website Project",     amount: 2800000 },
  { date: "2026-04-15", type: "expense", title: "Consulting 마일스톤 1",              category: "Consulting Fee",      amount: 1200000 },
  { date: "2026-04-17", type: "expense", title: "AI 모델 추가 개발 계약",              category: "AI/ML Project",       amount: 2500000 },
  { date: "2026-04-18", type: "income",  title: "프로젝트 만족도 보상",               category: "Credit",              amount: 180000 },
  { date: "2026-04-19", type: "expense", title: "App Deployment 중도금",              category: "App Project",         amount: 1800000 },
  { date: "2026-04-20", type: "expense", title: "배너 광고",                         category: "Marketing",           amount: 150000 },
];

const INCOME_COLORS = {
  "Website Project":  "#3B82F6",
  "App Project":      "#8B5CF6",
  "AI/ML Project":    "#6366F1",
  "Consulting Fee":   "#22C55E",
  "Platform Fee":     "#EF4444",
  "Marketing":        "#F59E0B",
  "Credit":           "#10B981",
  "Refund":           "#14B8A6",
  // 이전 카테고리 호환
  "Website Development": "#3B82F6",
  "App Deployment":      "#8B5CF6",
  "Consulting":          "#22C55E",
  "Other":               "#F97316",
  "운영비":              "#EF4444",
  "구독":                "#F59E0B",
  "외주":                "#EC4899",
};

function IncomeTab() {
  const today = new Date();
  const [viewMode, setViewMode]   = useState("calendar");
  const [incomeMode, setIncomeMode] = useState("income");
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [popupPos, setPopupPos]   = useState({ top: 0, left: 0 });
  const [showYMPicker, setShowYMPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const popupRef  = useRef(null);
  const ymRef = useRef(null);

  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const filtered = INCOME_DATA.filter(d => {
    const [y, mo] = d.date.split("-").map(Number);
    return d.type === incomeMode && y === year && mo - 1 === month;
  });

  const byDate = {};
  filtered.forEach(d => {
    if (!byDate[d.date]) byDate[d.date] = { total: 0, count: 0, items: [] };
    byDate[d.date].total += d.amount;
    byDate[d.date].count += 1;
    byDate[d.date].items.push(d);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleDateClick = (day, e) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (selectedDate === dateStr) { setSelectedDate(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    setSelectedDate(dateStr);
  };

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setSelectedDate(null);
      if (ymRef.current && !ymRef.current.contains(e.target)) setShowYMPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalAmount = filtered.reduce((s, d) => s + d.amount, 0);
  const isIncome = incomeMode === "income";
  const accentColor = isIncome ? "#3B82F6" : "#EF4444";
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  const listData = INCOME_DATA.filter(d => {
    const [y, mo] = d.date.split("-").map(Number);
    return d.type === incomeMode && y === year && mo - 1 === month;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const selectedItems = selectedDate ? (byDate[selectedDate]?.items || []) : [];

  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={goToday} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, color: "#475569" }}>오늘</button>
          <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "none", cursor: "pointer", fontSize: 15, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "none", cursor: "pointer", fontSize: 15, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          {/* 년/월 선택 드롭다운 */}
          <div style={{ position: "relative" }} ref={ymRef}>
            <button
              onClick={() => { setPickerYear(year); setShowYMPicker(v => !v); }}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{year}년 {month + 1}월</span>
              <span style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>▼</span>
            </button>
            {showYMPicker && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 4000, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1.5px solid #E2E8F0", padding: "16px 18px", width: 260 }}>
                {/* 피커 내 년도 이동 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button onClick={() => setPickerYear(y => y - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8" }}>‹</button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{pickerYear}년</span>
                  <button onClick={() => setPickerYear(y => y + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8" }}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setYear(pickerYear); setMonth(i); setShowYMPicker(false); }}
                      style={{
                        padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F,
                        fontSize: 13, fontWeight: 600,
                        background: pickerYear === year && i === month ? "linear-gradient(135deg, #60a5fa, #3b82f6)" : "#F8FAFC",
                        color: pickerYear === year && i === month ? "white" : "#334155",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { if (!(pickerYear === year && i === month)) e.currentTarget.style.background = "#EFF6FF"; }}
                      onMouseLeave={e => { if (!(pickerYear === year && i === month)) e.currentTarget.style.background = "#F8FAFC"; }}
                    >{i + 1}월</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #E2E8F0", background: "white" }}>
            <button onClick={() => setIncomeMode("income")} style={{ padding: "7px 18px", border: "none", background: incomeMode === "income" ? "linear-gradient(135deg, #60a5fa, #3b82f6)" : "transparent", color: incomeMode === "income" ? "white" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>수입보기</button>
            <button onClick={() => setIncomeMode("expense")} style={{ padding: "7px 18px", border: "none", background: incomeMode === "expense" ? "linear-gradient(135deg, #f87171, #ef4444)" : "transparent", color: incomeMode === "expense" ? "white" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>지출보기</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 0, background: "white", borderRadius: 20, padding: 4, border: "1px solid #E2E8F0", width: "fit-content" }}>
          {["calendar", "list"].map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: "6px 18px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: F,
              fontSize: 13, fontWeight: 600,
              background: viewMode === v ? "white" : "transparent",
              color: viewMode === v ? "#3B82F6" : "#94A3B8",
              boxShadow: viewMode === v ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              transition: "all 0.15s",
            }}>{v === "calendar" ? "캘린더 보기" : "리스트"}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: F }}>
          이달 {isIncome ? "수입" : "지출"} 합계: <strong style={{ color: accentColor, fontSize: 15 }}>{totalAmount.toLocaleString()}원</strong>
        </span>
      </div>

      {viewMode === "calendar" && (
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "visible", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #F1F5F9" }}>
            {weekdays.map((w, i) => (
              <div key={w} style={{ textAlign: "center", padding: "12px 0", fontSize: 13, fontWeight: 700, fontFamily: F, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#94A3B8" }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} style={{ minHeight: 90, borderRight: "1px solid #F8FAFC", borderBottom: "1px solid #F8FAFC" }} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const info = byDate[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;
              const dow = (firstDay + day - 1) % 7;
              const isSun = dow === 0, isSat = dow === 6;
              return (
                <div key={day} onClick={(e) => handleDateClick(day, e)}
                  style={{ minHeight: 90, padding: "8px 6px", cursor: "pointer", borderRight: "1px solid #F8FAFC", borderBottom: "1px solid #F8FAFC", background: isSelected ? "#EFF6FF" : "white", transition: "background 0.12s" }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: isToday ? "#3B82F6" : "none", fontSize: 14, fontWeight: isToday ? 800 : 500, fontFamily: F, color: isToday ? "white" : isSun ? "#EF4444" : isSat ? "#3B82F6" : "#1E293B", marginBottom: 2 }}>{day}</div>
                  {info && (
                    <div style={{ marginTop: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, fontFamily: F, lineHeight: 1.3 }}>{info.total.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F }}>{info.count}건</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {listData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 15, fontFamily: F }}>이달 {isIncome ? "수입" : "지출"} 내역이 없습니다.</div>
          ) : (
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {Object.entries(
                listData.reduce((acc, d) => { (acc[d.date] = acc[d.date] || []).push(d); return acc; }, {})
              ).map(([date, items]) => (
                <div key={date}>
                  <div style={{ padding: "10px 22px 4px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B", fontFamily: F }}>{date.replace(/-/g, ".")} ({["일","월","화","수","목","금","토"][new Date(date).getDay()]})</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, fontFamily: F }}>{items.reduce((s, i) => s + i.amount, 0).toLocaleString()}원</span>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 22px", borderBottom: "1px solid #F8FAFC" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: INCOME_COLORS[item.category] || "#94A3B8", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: F }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>{item.category}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: accentColor, fontFamily: F }}>{isIncome ? "+" : "-"}{item.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedItems.length > 0 && (
        <div ref={popupRef} style={{ position: "absolute", top: popupPos.top, left: Math.min(popupPos.left, window.innerWidth - 320), zIndex: 3000, width: 290, background: "white", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.16)", border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{selectedDate.replace(/-/g, ".")} {isIncome ? "수입" : "지출"}</span>
            <button onClick={() => setSelectedDate(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94A3B8", lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {selectedItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < selectedItems.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: INCOME_COLORS[item.category] || "#94A3B8" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: F }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F }}>{item.category}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: accentColor, fontFamily: F, flexShrink: 0 }}>{isIncome ? "+" : "-"}{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 16px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>합계</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, fontFamily: F }}>{selectedItems.reduce((s, d) => s + d.amount, 0).toLocaleString()}원</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ComingSoonDash ─────────────────────────────────────────── */
function ComingSoonDash({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 14 }}>
      <div style={{ fontSize: 52 }}>🚧</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#64748B", fontFamily: F }}>{label}</div>
      <div style={{ fontSize: 14, color: "#94A3B8", fontFamily: F }}>해당 기능은 준비 중입니다.</div>
    </div>
  );
}

/* ── 메인 컴포넌트 ───────────────────────────────────────────── */
export default function ClientDashboard() {
  const { dbId, username } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "schedule";
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });
  const location = useLocation();
  const leftColumnRef = useRef(null);
  const [projectManageTarget, setProjectManageTarget] = useState(location.state?.projectId ?? null);
  const [projectMeetingTarget, setProjectMeetingTarget] = useState(null);
  const [proposalPartner, setProposalPartner] = useState(null);
  const [syncedPanelMinHeight, setSyncedPanelMinHeight] = useState(0);

  // ── Stream Chat connection ───────────────────────────────────
  const [chatClient, setChatClient] = useState(null);
  useEffect(() => {
    if (!dbId) return;
    let client;
    const connect = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`/api/chat/token?userId=${dbId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          console.error(`[Stream] Token fetch failed: HTTP ${res.status}`);
          return;
        }
        const { apiKey, token: streamToken, streamUserId } = await res.json();
        client = StreamChat.getInstance(apiKey);
        await client.connectUser({ id: streamUserId, name: username || streamUserId }, streamToken);
        setChatClient(client);
      } catch (err) {
        console.error("[Stream] connectUser failed:", err);
      }
    };
    connect();
    return () => { if (client) { client.disconnectUser(); setChatClient(null); } };
  }, [dbId, username]);

  const currentMilestones = MOCK_MANAGE_PROJECTS.flatMap(p =>
    p.milestones
      .filter(m => m.status === "IN_PROGRESS" || m.status === "PENDING")
      .slice(0, 1)
      .map(m => ({ projectId: p.id, projectTitle: p.title, milestoneTitle: m.title, status: m.status }))
  );

  // 콘텐츠 패널 — 스케줄 탭은 패딩 0 (FullCalendar가 영역 전체 사용)
  const isScheduleTab = activeTab === "schedule";
  const isMeetingTab = activeTab === "free_meeting" || activeTab === "contract_meeting" || activeTab === "project_meeting";
  const isApplicationsTab = activeTab === "apply_active" || activeTab === "apply_done";
  const isInterestsTab = activeTab === "interests";
  const isHeightSyncedTab = isScheduleTab || isInterestsTab || isMeetingTab;
  const defaultPanelMinHeight = activeTab === "contract_meeting" ? 900 : (activeTab === "free_meeting" || activeTab === "project_meeting") ? 760 : 600;
  const syncedPanelHeight = Math.max(isScheduleTab ? 820 : defaultPanelMinHeight, syncedPanelMinHeight);

  useEffect(() => {
    const node = leftColumnRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setSyncedPanelMinHeight(nextHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, currentMilestones.length]);

  const renderContent = () => {
    if (isScheduleTab) return <ScheduleTab />;
    if (isApplicationsTab) return <ApplicationsTab activeTab={activeTab} />;
    if (activeTab === "income")    return <IncomeTab />;
    if (activeTab === "guarantee") return <GuaranteeTab />;
    if (activeTab === "interests") return <InterestsTab onProposePartner={(p) => { setProposalPartner({ ...p, _contactId: Date.now() }); setActiveTab("free_meeting"); }} />;
    if (activeTab === "starting_projects") return <StartingProjectsTab role="client" />;
    if (activeTab === "project_manage") {
      return (
        <ProjectManageTab
          onGoSchedule={() => setActiveTab("schedule")}
          initialSelectedId={projectManageTarget}
          onOpenProjectMeeting={async (pid) => {
            // 한 프로젝트에 대한 partner counterpart 조회 → 해당 contact 자동 선택
            let contactId = null;
            try {
              const apps = await applicationsApi.receivedList();
              const matched = (apps || []).find(a =>
                Number(a.projectId) === Number(pid) &&
                ["ACCEPTED", "CONTRACTED", "IN_PROGRESS", "COMPLETED"].includes(a.status)
              );
              if (matched?.partnerUserId) contactId = Number(matched.partnerUserId);
            } catch (err) { console.warn("[onOpenProjectMeeting] partner 조회 실패:", err?.message); }
            setProjectMeetingTarget({ projectId: pid, contactId });
            setActiveTab("project_meeting");
          }}
        />
      );
    }
    if (activeTab === "portfolio_add")  return <PortfolioAddManagementTab viewer="client" dashboardPath="/client_dashboard" />;
    if (activeTab === "evaluation")      return <EvaluationTab />;
    if (activeTab === "free_meeting")    return <FreeMeetingTab proposalPartner={proposalPartner} onProposalHandled={() => setProposalPartner(null)} chatClient={chatClient} onSwitchTab={setActiveTab} />;
    if (activeTab === "contract_meeting") return <ContractMeetingTab chatClient={chatClient} />;
    if (activeTab === "project_meeting") return <ProjectMeetingTab initialActiveId={1} chatClient={chatClient} returnProjectId={projectMeetingTarget?.projectId ?? projectMeetingTarget} targetProjectId={projectMeetingTarget?.projectId ?? null} targetContactId={projectMeetingTarget?.contactId ?? null} onDashboardMove={(pid) => { setProjectManageTarget(pid); setActiveTab("project_manage"); }} />;
    const label = SECTIONS.flatMap(s => s.items).find(i => i.key === activeTab)?.label || "";
    return <ComingSoonDash label={label} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: F }}>
      <Header_client />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ─── 파트너 배너 카드 ─── */}
        <ClientBannerCard activePage="dashboard" />

        {/* ─── 탭 + 콘텐츠 영역 ─── */}
        <div style={{ display: "flex", gap: 12, alignItems: (activeTab === "free_meeting" || activeTab === "project_meeting") ? "stretch" : "flex-start", marginLeft: -38, marginRight: -38 }}>

          {/* 왼쪽 컬럼: 사이드바 + 마일스톤 카드 */}
          <div ref={leftColumnRef} style={{ width: 170, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 88, alignSelf: "flex-start" }}>

            {/* 사이드바 */}
            <div style={{ background: "white", borderRadius: 16, padding: "12px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowY: "auto" }}>
              {SECTIONS.map((sec, si) => (
                <div key={si} style={{ marginBottom: si < SECTIONS.length - 1 ? 10 : 0 }}>
                  {sec.title && (
                            <div style={{
                            fontSize: 11.2,    // ← 12 → 13.3 (1.3pt 증가)
                            fontWeight: 700,   // ← 800 → 900 (더 굵게)
                            letterSpacing: "0.04em",
                            padding: "6px 12px 2px 12px",  // ← 왼쪽 패딩 0 (공백 제거)
                            fontFamily: F,
                            textTransform: "uppercase",
                            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #6366f1 100%)",  // ← #60a5fa → #2563eb (더 진한 파랑)
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            }}>

                      {sec.title}
                    </div>
                  )}
                  {sec.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "7px 12px", borderRadius: 10, border: "none",
                        // 그리고 style 객체 안에 marginBottom: 2 추가 (line 5092 위치)
                        marginBottom: 2,
                        background: activeTab === item.key ? "#EFF6FF" : "transparent",
                        color: activeTab === item.key ? "#3B82F6" : "#475569",
                        fontSize: 14,
                        fontWeight: activeTab === item.key ? 700 : 500,
                        cursor: "pointer", fontFamily: F,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (activeTab !== item.key) e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={e => { if (activeTab !== item.key) e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* 진행 중 마일스톤 카드 */}
            <div style={{ background: "white", borderRadius: 16, padding: "12px 10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "2px 8px 8px", fontFamily: F }}>
                진행 중 마일스톤
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {currentMilestones.map((item, i) => {
                  const projectColor = MOCK_MANAGE_PROJECTS.find(p => p.id === item.projectId)?.progressColor || "#3B82F6";
                  return (
                    <div
                      key={i}
                      onClick={() => { setProjectManageTarget(item.projectId); setActiveTab("project_manage"); }}
                      style={{
                        borderRadius: 10, padding: "9px 10px", cursor: "pointer",
                        border: `1.5px solid ${projectColor}28`,
                        background: `${projectColor}0D`,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${projectColor}1A`; e.currentTarget.style.borderColor = `${projectColor}55`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${projectColor}0D`; e.currentTarget.style.borderColor = `${projectColor}28`; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: projectColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.milestoneTitle}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#64748B", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 12 }}>{item.projectTitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 오른쪽 콘텐츠 패널 */}
          <div style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            padding: (isScheduleTab || isMeetingTab) ? "0" : "32px 36px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            height: (isScheduleTab || isMeetingTab) ? syncedPanelHeight : undefined,
            minHeight: isHeightSyncedTab ? syncedPanelHeight : defaultPanelMinHeight,
            overflow: (isScheduleTab || activeTab === "free_meeting" || activeTab === "project_meeting") ? "hidden" : activeTab === "contract_meeting" ? "auto" : "visible",
          }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
