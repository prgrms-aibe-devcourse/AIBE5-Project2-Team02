import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Header_partner from "../components/Header_partner";
import PartnerBannerCard from "../components/PartnerBannerCard";
import useStore from "../store/useStore";
import contractionImg from "../assets/contraction.png";
import heroDefault from "../assets/hero_default.png";
import heroStudent from "../assets/hero_student.png";
import heroCheck from "../assets/hero_check.png";
import heroTeacher from "../assets/hero_teacher.png";
import {
  ScopeModal, DeliverablesModal, ScheduleModal, PaymentModal,
  RevisionModal, CompletionModal, SpecialTermsModal,
} from "../components/ContractModals";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ── FullCalendar 구글 캘린더 테마 CSS ─────────────────────── */
const dashCalStyles = `
  .dash-cal .fc { font-family: ${F}; background: white; }

  /* 내장 툴바 숨김 */
  .dash-cal .fc-toolbar { display: none !important; }

  /* 불필요 아이콘 숨김 */
  .dash-cal .fc-timegrid-now-indicator-arrow { display: none !important; }
  .dash-cal [class*="fc-icon-chevron"] { display: none !important; }
  .dash-cal .fc-resource-timeline-divider { display: none !important; }
  /* 스크롤바 0-크기 (display:none 대신 → FullCalendar 헤더 보정값 0 유지) */
  .dash-cal .fc-scroller::-webkit-scrollbar { width: 0; height: 0; }
  .dash-cal .fc-scroller { scrollbar-width: none; }
  /* 마우스 호버 시 time-grid 세로 스크롤 허용 */
  .dash-cal:hover .fc-timegrid .fc-scroller::-webkit-scrollbar { width: 4px; }
  .dash-cal:hover .fc-timegrid .fc-scroller { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
  .dash-cal:hover .fc-timegrid .fc-scroller::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
  .dash-cal:hover .fc-timegrid .fc-scroller::-webkit-scrollbar-track { background: transparent; }
  /* 오른쪽 사이드 sticky 화살표 버튼 제거 */
  .dash-cal .fc-timegrid-body ~ .fc-scroller-harness,
  .dash-cal td.fc-timegrid-divider + td { display: none !important; }

  /* 컬럼 헤더 — 7등분 균등 */
  .dash-cal .fc-col-header-cell {
    border-color: #dadce0 !important;
    background: white !important;
    padding: 0 !important;
    width: calc(100% / 7) !important;
  }
  .dash-cal .fc-col-header-cell-cushion {
    font-size: 11px !important; font-weight: 500 !important;
    color: #70757a !important; text-decoration: none !important;
    font-family: ${F} !important;
  }

  /* 토요일 헤더/컬럼 — 파스텔 파랑 */
  .dash-cal .fc-day-sat .fc-col-header-cell-cushion,
  .dash-cal .fc-day-sat .fc-daygrid-day-number { color: #4a90d9 !important; }
  .dash-cal td.fc-day-sat { background: rgba(74,144,217,0.04) !important; }

  /* 일요일 헤더/컬럼 — 파스텔 빨강 */
  .dash-cal .fc-day-sun .fc-col-header-cell-cushion,
  .dash-cal .fc-day-sun .fc-daygrid-day-number { color: #e57373 !important; }
  .dash-cal td.fc-day-sun { background: rgba(229,115,115,0.04) !important; }

  /* 시간 축 */
  .dash-cal .fc-timegrid-axis { width: 56px !important; }
  .dash-cal .fc-timegrid-slot-label-cushion {
    font-size: 10px !important; color: #70757a !important;
    font-weight: 400 !important; font-family: ${F} !important;
    padding-right: 8px !important; white-space: nowrap !important;
  }
  .dash-cal .fc-timegrid-slot { height: 24px !important; }
  .dash-cal .fc-timegrid-slot-lane { border-color: #f1f3f4 !important; }

  /* 월 뷰 헤더 가운데 정렬 */
  .dash-cal .fc-col-header-cell-cushion {
    display: flex !important; align-items: center !important; justify-content: center !important;
    width: 100% !important;
    font-size: 11px !important; font-weight: 500 !important;
    color: #70757a !important; text-decoration: none !important;
    font-family: ${F} !important;
  }

  /* 월 뷰 셀 — 추가 1.5cm 축소 (min-height 21px 감소) */
  .dash-cal .fc-daygrid-day-frame { min-height: 43px !important; }

  /* 월 뷰 날짜 숫자 — 왼쪽 위 */
  .dash-cal .fc-daygrid-day-top {
    flex-direction: row !important; justify-content: flex-start !important;
  }

  /* 그리드 선 */
  .dash-cal .fc-scrollgrid td,
  .dash-cal .fc-scrollgrid th { border-color: #dadce0 !important; }
  .dash-cal .fc-timegrid-col { border-color: #dadce0 !important; }
  .dash-cal .fc-scrollgrid { border-color: #dadce0 !important; }

  /* 오늘 컬럼 */
  .dash-cal .fc-day-today { background: rgba(26,115,232,0.04) !important; }

  /* 이벤트 */
  .dash-cal .fc-timegrid-event {
    border-radius: 4px !important; border: none !important; padding: 2px 4px !important;
  }
  .dash-cal .fc-event-title {
    font-size: 11px !important; font-weight: 500 !important; font-family: ${F} !important;
  }
  .dash-cal .fc-event-time { font-size: 10px !important; font-family: ${F} !important; }
  .dash-cal .fc-daygrid-event {
    border-radius: 4px !important; font-size: 11px !important; border: none !important;
  }

  /* 월 뷰 날짜 숫자 */
  .dash-cal .fc-daygrid-day-number {
    font-size: 12px !important; color: #3c4043 !important;
    font-weight: 400 !important; padding: 4px 8px !important;
    font-family: ${F} !important;
  }
  .dash-cal .fc-day-today .fc-daygrid-day-number {
    background: #1a73e8 !important; color: white !important;
    border-radius: 50% !important; width: 26px !important; height: 26px !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    font-weight: 500 !important; padding: 0 !important; margin: 4px !important;
  }

  /* 종일 행 */
  .dash-cal .fc-timegrid-all-day { display: none !important; }
  .dash-cal .fc-timegrid-axis-cushion { font-size: 10px !important; color: #70757a !important; font-family: ${F} !important; }
`;

/* ── 대시보드 사이드바 섹션 ───────────────────────────────── */
const SECTIONS = [
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
      { key: "project_meeting",  label: "진행 프로젝트 미팅" },
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

/* ── MiniCalendar ─────────────────────────────────────────── */
function MiniCalendar({ onDateClick }) {
  const [vd, setVd] = useState(new Date());
  const y = vd.getFullYear();
  const m = vd.getMonth();
  const today = new Date();
  // Monday-first
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const DOW = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>
          {y}년 {m + 1}월
        </span>
        <div style={{ display: "flex" }}>
          <button
            onClick={() => setVd(new Date(y, m - 1, 1))}
            style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 5px", borderRadius: 4, fontSize: 18, color: "#6B7280", lineHeight: 1 }}
          >‹</button>
          <button
            onClick={() => setVd(new Date(y, m + 1, 1))}
            style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 5px", borderRadius: 4, fontSize: 18, color: "#6B7280", lineHeight: 1 }}
          >›</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 2 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", fontFamily: F, paddingBottom: 4 }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const isToday = day &&
            today.getFullYear() === y &&
            today.getMonth() === m &&
            today.getDate() === day;
          return (
            <div
              key={i}
              onClick={() => day && onDateClick && onDateClick(new Date(y, m, day))}
              style={{
                textAlign: "center", fontSize: 11, fontFamily: F,
                color: isToday ? "white" : day ? "#374151" : "transparent",
                background: isToday ? "#3B82F6" : "transparent",
                borderRadius: "50%", width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: day ? "pointer" : "default",
                fontWeight: isToday ? 700 : 400,
                margin: "0 auto",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (day && !isToday) e.currentTarget.style.background = "#EFF6FF"; }}
              onMouseLeave={e => { if (day && !isToday) e.currentTarget.style.background = "transparent"; }}
            >
              {day || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── CalViewDropdown (주/월/일 전환 드롭다운) ─────────────── */
function CalViewDropdown({ calView, onViewChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const labels = { dayGridMonth: "월", timeGridWeek: "주", timeGridDay: "일" };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "6px 14px", borderRadius: 6,
          border: "1px solid #dadce0", background: "white",
          color: "#3c4043", fontSize: 13, fontWeight: 500,
          cursor: "pointer", fontFamily: F,
          display: "flex", alignItems: "center", gap: 6,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
        onMouseLeave={e => e.currentTarget.style.background = "white"}
      >
        {labels[calView] || "주"} <span style={{ fontSize: 10, color: "#70757a" }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "white", border: "1px solid #dadce0",
          borderRadius: 8, padding: "4px 0", zIndex: 100,
          minWidth: 90, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}>
          {[["dayGridMonth", "월"], ["timeGridWeek", "주"], ["timeGridDay", "일"]].map(([v, l]) => (
            <div
              key={v}
              onClick={() => { onViewChange(v); setOpen(false); }}
              style={{
                padding: "8px 16px", fontSize: 13,
                fontWeight: calView === v ? 700 : 400,
                color: calView === v ? "#1a73e8" : "#3c4043",
                cursor: "pointer", fontFamily: F, background: "transparent",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ScheduleTab (내 스케줄 관리) ─────────────────────────── */
function ScheduleTab() {
  const { googleAccessToken, setGoogleAccessToken } = useStore();
  const CLIENT_ID   = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || "primary";
  const SCOPES = "https://www.googleapis.com/auth/calendar.events";

  const [token, setToken]             = useState(googleAccessToken);
  const [tokenClient, setTokenClient] = useState(null);
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const calRef = useRef(null);

  const [calTitle, setCalTitle] = useState("");
  const [calView, setCalView] = useState("timeGridWeek");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", start: "", end: "", allDay: false });

  const [myCals] = useState([
    { label: "외주 업무 일정", color: "#4285F4" },
    { label: "회사 업무 일정", color: "#4285F4" },
    { label: "개인/가족 일정", color: "#0F9D58" },
  ]);
  const [otherCals] = useState([
    { label: "자기계발 일정", color: "#0F9D58" },
  ]);
  const [calChecks, setCalChecks] = useState({
    "외주 업무 일정": true,
    "회사 업무 일정": true,
    "개인/가족 일정": true,
    "자기계발 일정": true,
  });

  // GIS init
  useEffect(() => {
    if (googleAccessToken) setToken(googleAccessToken);
    if (!CLIENT_ID || !window.google?.accounts?.oauth2) return;
    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp?.access_token) {
          setToken(resp.access_token);
          setGoogleAccessToken(resp.access_token);
        }
      },
    });
    setTokenClient(tc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CLIENT_ID, googleAccessToken]);

  useEffect(() => {
    if (!token && tokenClient && !loading) {
      const t = setTimeout(() => tokenClient.requestAccessToken({ prompt: "" }), 500);
      return () => clearTimeout(t);
    }
  }, [token, tokenClient, loading]);

  const fetchEvents = useCallback(async (start, end) => {
    if (!token) return;
    setLoading(true);
    try {
      const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
        `?timeMin=${encodeURIComponent(new Date(start).toISOString())}` +
        `&timeMax=${encodeURIComponent(new Date(end).toISOString())}` +
        `&singleEvents=true&orderBy=startTime&maxResults=250` +
        `&fields=items(id,summary,start,end)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          setGoogleAccessToken(null);
          if (tokenClient) setTimeout(() => tokenClient.requestAccessToken({ prompt: "" }), 1000);
        }
        return;
      }
      const data = await res.json();
      setEvents((data.items || []).map(ev => ({
        id:     ev.id,
        title:  ev.summary || "(제목 없음)",
        start:  ev.start?.dateTime || ev.start?.date,
        end:    ev.end?.dateTime   || ev.end?.date,
        allDay: !!ev.start?.date,
      })));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, CALENDAR_ID]);

  const handleDatesSet = useCallback((info) => {
    fetchEvents(info.start, info.end);
    setCalTitle(info.view.title);
    setCalView(info.view.type);
  }, [fetchEvents]);

  const openNewEventModal = (startStr, endStr, allDay) => {
    const now = new Date();
    const defaultStart = startStr || now.toISOString().slice(0, 16);
    const defaultEnd   = endStr   || new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    setForm({ title: "", start: defaultStart, end: defaultEnd, allDay: !!allDay });
    setModalOpen(true);
  };

  const insertEvent = async () => {
    if (!token || !form.title.trim()) return;
    const body = {
      summary: form.title,
      start: form.allDay
        ? { date: form.start.slice(0, 10) }
        : { dateTime: new Date(form.start).toISOString() },
      end: form.allDay
        ? { date: (form.end || form.start).slice(0, 10) }
        : { dateTime: new Date(form.end || form.start).toISOString() },
    };
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    setModalOpen(false);
    const cal = calRef.current?.getApi();
    if (cal) fetchEvents(cal.view.currentStart, cal.view.currentEnd);
  };

  return (
    <div style={{ display: "flex", height: 820, borderRadius: 16, overflow: "hidden" }}>
      {/* 왼쪽 미니 사이드바 */}
      <div style={{
        width: 180, flexShrink: 0,
        borderRight: "1px solid #F1F5F9",
        padding: "16px 10px",
        overflowY: "auto",
        background: "white",
      }}>
        {/* 만들기 버튼 */}
        <button
          onClick={() => openNewEventModal()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px 10px 14px", borderRadius: 22,
            border: "1px solid #E5E7EB", background: "white",
            color: "#374151", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: F, marginBottom: 22,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.14)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.08)"}
        >
          <span style={{ fontSize: 20, lineHeight: 1, color: "#3B82F6" }}>+</span>
          만들기
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>▾</span>
        </button>

        {/* 미니 캘린더 */}
        <MiniCalendar onDateClick={(date) => {
          const cal = calRef.current?.getApi();
          if (cal) cal.changeView("timeGridDay", date);
        }} />

        {/* 사용자 검색 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", border: "1px solid #E5E7EB",
          borderRadius: 8, marginBottom: 22, color: "#9CA3AF",
        }}>
          <span style={{ fontSize: 13 }}>👤</span>
          <span style={{ fontSize: 12, fontFamily: F }}>사용자 검색</span>
        </div>

        {/* 내 캘린더 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: F }}>내 캘린더</span>
            <span style={{ fontSize: 14, color: "#9CA3AF", cursor: "pointer" }}>∧</span>
          </div>
          {myCals.map(c => (
            <label key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={calChecks[c.label] ?? true}
                onChange={() => setCalChecks(p => ({ ...p, [c.label]: !p[c.label] }))}
                style={{ width: 14, height: 14, accentColor: c.color }}
              />
              <span style={{ fontSize: 12, color: "#374151", fontFamily: F }}>{c.label}</span>
            </label>
          ))}
        </div>

        {/* 다른 캘린더 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: F }}>다른 캘린더</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 16, color: "#9CA3AF", cursor: "pointer", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 14, color: "#9CA3AF", cursor: "pointer", marginLeft: 4 }}>∧</span>
            </div>
          </div>
          {otherCals.map(c => (
            <label key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={calChecks[c.label] ?? true}
                onChange={() => setCalChecks(p => ({ ...p, [c.label]: !p[c.label] }))}
                style={{ width: 14, height: 14, accentColor: c.color }}
              />
              <span style={{ fontSize: 12, color: "#374151", fontFamily: F }}>{c.label}</span>
            </label>
          ))}
        </div>

        {loading && (
          <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, marginTop: 16, textAlign: "center" }}>
            불러오는 중...
          </div>
        )}
      </div>

      {/* 오른쪽: 커스텀 툴바 + FullCalendar */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} className="dash-cal">
        <style>{dashCalStyles}</style>

        {/* ── 구글 캘린더 스타일 커스텀 툴바 ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: "1px solid #dadce0",
          background: "white", flexShrink: 0,
        }}>
          {/* 왼쪽: 오늘 + ‹ › + 날짜 제목 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => calRef.current?.getApi().today()}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: "1px solid #dadce0", background: "white",
                color: "#3c4043", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: F, transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >오늘</button>
            <button
              onClick={() => calRef.current?.getApi().prev()}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "none", background: "transparent",
                color: "#3c4043", fontSize: 22, lineHeight: 1,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >‹</button>
            <button
              onClick={() => calRef.current?.getApi().next()}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "none", background: "transparent",
                color: "#3c4043", fontSize: 22, lineHeight: 1,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >›</button>
            <span style={{ fontSize: 17, fontWeight: 400, color: "#3c4043", fontFamily: F, marginLeft: 8 }}>
              {calTitle}
            </span>
          </div>

          {/* 오른쪽: 뷰 드롭다운 */}
          <CalViewDropdown calView={calView} onViewChange={(v) => {
            setCalView(v);
            calRef.current?.getApi().changeView(v);
          }} />
        </div>

        {/* FullCalendar 영역 */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale="ko"
            firstDay={1}
            events={events}
            datesSet={handleDatesSet}
            headerToolbar={false}
            height="100%"
            selectable
            allDaySlot={false}
            select={(info) => openNewEventModal(info.startStr, info.endStr, info.allDay)}
            dayHeaderContent={(args) => {
              const d = args.date;
              const dow = d.getDay();
              const names = ['일','월','화','수','목','금','토'];
              const isSun = dow === 0;
              const isSat = dow === 6;
              const labelColor = args.isToday ? '#1a73e8' : isSun ? '#e57373' : isSat ? '#4a90d9' : '#70757a';
              const numColor   = args.isToday ? 'white'   : isSun ? '#e57373' : isSat ? '#4a90d9' : '#3c4043';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', gap: 2 }}>
                  <span style={{ fontSize: 10, color: labelColor, fontFamily: F, fontWeight: 500 }}>
                    {names[dow]}
                  </span>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: args.isToday ? '#1a73e8' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: args.isToday ? 600 : 400,
                    color: numColor, fontFamily: F,
                  }}>{d.getDate()}</div>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* 이벤트 추가 모달 */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "white", borderRadius: 18, padding: "28px 32px 24px", width: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: F }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: "0 0 20px" }}>일정 추가</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>제목 <span style={{ color: "#EF4444" }}>*</span></div>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="일정 제목 입력"
                autoFocus
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: F, outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#3B82F6"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                onKeyDown={e => e.key === "Enter" && form.title.trim() && insertEvent()}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13, color: "#374151", cursor: "pointer", fontFamily: F }}>
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={e => setForm(p => ({ ...p, allDay: e.target.checked }))}
                style={{ accentColor: "#3B82F6" }}
              />
              종일
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>시작</div>
                <input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.allDay ? form.start.slice(0, 10) : form.start.slice(0, 16)}
                  onChange={e => setForm(p => ({ ...p, start: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: F, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#3B82F6"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>종료</div>
                <input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.allDay ? (form.end || form.start).slice(0, 10) : (form.end || form.start).slice(0, 16)}
                  onChange={e => setForm(p => ({ ...p, end: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: F, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#3B82F6"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}
              >취소</button>
              <button
                onClick={insertEvent}
                disabled={!form.title.trim()}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: form.title.trim()
                    ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)"
                    : "#E5E7EB",
                  color: form.title.trim() ? "white" : "#9CA3AF",
                  fontSize: 14, fontWeight: 700,
                  cursor: form.title.trim() ? "pointer" : "default",
                  fontFamily: F,
                }}
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 지원 내역 모의 데이터 ─────────────────────────────────── */
const MOCK_ACTIVE_PROJS = [
  {
    id: 1, badge: "유료",
    title: "AI 기반 이상 거래 탐지 시스템 고도화",
    desc: "금융 데이터 분석을 통한 실시간 이상 거래 탐지 모델 최적화 및 API 개발",
    tags: ["#AI/ML", "#Python", "#Fintech"],
    period: "3개월", budget: "1,500만원",
    deadline: "마감 임박 (D-3)", deadlineColor: "#EF4444",
    match: 93,
    workPref: "외주",
    level: "시니어",
    clientId: "client_02293",
    avatarColor: "#4BAA7B",
    verifications: ["본인인증 완료", "사업자등록 완료", "평가 우수"],
    meetingContactId: 1,
  },
  {
    id: 2, badge: "무료",
    title: "이커머스 플랫폼 모바일 앱 리뉴얼",
    desc: "사용자 경험 중심의 UI/UX 개편 및 Flutter 기반 크로스 플랫폼 앱 개발",
    tags: ["#Mobile", "#Web", "#Flutter"],
    period: "4개월", budget: "2,800만원",
    deadline: "마감 D-15", deadlineColor: "#64748B",
    match: 86,
    workPref: "원격",
    level: "미들",
    clientId: "client_01842",
    avatarColor: "#5B7CFA",
    verifications: ["본인인증 완료", "사업자등록 완료"],
    meetingContactId: 2,
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
    match: 89,
    workPref: "외주",
    level: "시니어",
    clientId: "client_01127",
    avatarColor: "#4BAA7B",
    verifications: ["본인인증 완료", "사업자등록 완료", "평가 우수"],
    meetingContactId: 1,
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
    match: 91,
    workPref: "원격",
    level: "미들",
    clientId: "client_02003",
    avatarColor: "#5B7CFA",
    verifications: ["본인인증 완료", "사업자등록 완료"],
    meetingContactId: 2,
  },
];
const MOCK_CLOSED_PROJS = [
  {
    id: 1,
    title: "실시간 스트리밍 앱 최적화 및 안정화",
    desc: "대규모 동시 접속자 처리를 위한 백엔드 구조 개편 및 트래픽 제어 알고리즘 적용",
    tags: ["#Streaming", "#Go", "#Redis"],
    endDate: "종료일: 2024.11.15", statusText: "모집 완료",
  },
  {
    id: 2,
    title: "개인 맞춤형 식단 관리 웹 서비스",
    desc: "사용자 건강 데이터를 기반으로 한 영양소 분석 및 AI 레시피 추천 시스템",
    tags: ["#HealthCare", "#Vue.js", "#Django"],
    endDate: "마감일: 2024.11.10", statusText: "지원 철회됨",
  },
];

/* ── 지원중 상세 모달 구성 ─────────── */
function ApplicationSectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 4, height: 20, background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", borderRadius: 2 }} />
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{children}</h3>
    </div>
  );
}

function ApplicationProjectDetailModal({ proj, onClose }) {
  if (!proj) return null;

  const requirements = [
    `${proj.tags.slice(0, 2).join("/")} 등 관련 기술 실무 경험 ${proj.level === "시니어" ? "3년 이상" : proj.level === "미들" ? "2년 이상" : "1년 이상"}`,
    `${proj.title} 도메인 프로젝트 수행 경험 우대`,
    "원활한 커뮤니케이션 능력 보유자",
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(980px, 96vw)", maxHeight: "88vh", overflowY: "auto", background: "white", borderRadius: 18, border: "1.5px solid #E2E8F0", boxShadow: "0 22px 64px rgba(15,23,42,0.25)", padding: "28px 28px 30px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: proj.badge === "유료" ? "#1D4ED8" : "#16A34A", background: proj.badge === "유료" ? "#DBEAFE" : "#D1FAE5", border: "1px solid #BFDBFE", borderRadius: 6, padding: "3px 10px", fontFamily: F }}>{proj.badge}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", borderRadius: 6, padding: "3px 10px", fontFamily: F }}>{proj.match}% AI Match</span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 24, color: "#94A3B8", lineHeight: 1, padding: 2 }}>×</button>
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", margin: "0 0 16px", fontFamily: F, lineHeight: 1.32 }}>{proj.title}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4, fontFamily: F }}>예상 견적</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#1E293B", fontFamily: F }}>{proj.budget}</div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4, fontFamily: F }}>예상 기간</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#1E293B", fontFamily: F }}>{proj.period}</div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0 18px" }} />
        <ApplicationSectionTitle>프로젝트 개요</ApplicationSectionTitle>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: 0, fontFamily: F }}>{proj.desc}</p>

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "20px 0 18px" }} />
        <ApplicationSectionTitle>필요 기술 스택</ApplicationSectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {proj.tags.map(t => (
            <span key={t} style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "5px 14px", fontFamily: F }}>{t.replace("#", "")}</span>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "20px 0 18px" }} />
        <ApplicationSectionTitle>근무 환경 및 팀 구성</ApplicationSectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "20px 0 18px" }} />
        <ApplicationSectionTitle>근무 환경 및 모집 요건</ApplicationSectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 12 }}>
          {[
            { label: "모집 인원", value: proj.level === "시니어" ? "2명 (프론트엔드 1, 백엔드 1)" : "2명 (프론트엔드 1, 백엔드 1)" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requirements.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#94A3B8", flexShrink: 0 }}>·</span>
              <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, fontFamily: F }}>{r}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #F1F5F9", margin: "20px 0 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: proj.avatarColor || "#4BAA7B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "white", fontFamily: F, flexShrink: 0 }}>
            {(proj.clientId || "CL").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>@{proj.clientId || "client_00000"}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginTop: 2 }}>클라이언트 신뢰도 4.9/5.0</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {(proj.verifications || []).map((v, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#ECFDF5", borderRadius: 999, padding: "3px 10px", fontFamily: F }}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractGuidePopup({ projTitle, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(520px, 92vw)", background: "white", borderRadius: 18, border: "1.5px solid #E2E8F0", boxShadow: "0 20px 60px rgba(15,23,42,0.25)", padding: "28px 26px" }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🎉</div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: "0 0 10px", textAlign: "center", fontFamily: F }}>계약이 체결되었습니다</h3>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: "0 0 20px", textAlign: "center", fontFamily: F }}>
          <strong style={{ color: "#1E293B" }}>{projTitle}</strong><br />
          상세 계약 미팅 채팅으로 이동해 세부 계약 내용을 협의하고 확정지어주세요.
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", border: "none", borderRadius: 10, background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
          확인
        </button>
      </div>
    </div>
  );
}

/* ── 지원 중 카드 ─────────── */
function ActiveProjCard({ proj, onViewDetail }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F, flexShrink: 0 }}>{proj.badge}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
        </div>
        <button onClick={() => onViewDetail(proj)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
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
    </div>
  );
}

/* ── 합격 프로젝트 카드 ─────── */
function AcceptedProjCard({ proj, isMeetingMove, onAction, onViewDetail }) {
  const [hov, setHov] = useState(false);
  const btn = isMeetingMove
    ? { label: "상세 계약 미팅 이동", bg: "#DBEAFE", hover: "#BFDBFE", color: "#1E3A5F" }
    : { label: "계약하기", bg: "#FEF3C7", hover: "#FDE68A", color: "#92400E" };

  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "18px 22px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.statusBadgeBg, color: proj.statusBadgeColor, fontFamily: F, flexShrink: 0 }}>{proj.statusBadge}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button onClick={() => onViewDetail(proj)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#DBEAFE", color: "#1E3A5F", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            상세보기
          </button>
          <button onClick={() => onAction(proj)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: hov ? btn.hover : btn.bg, color: btn.color, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "background 0.15s", whiteSpace: "nowrap" }}>
            {btn.label}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 10px", fontFamily: F }}>{proj.desc}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {proj.tags.map(t => <span key={t} style={{ padding: "3px 10px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F }}>계약 기간: {proj.period}&nbsp;&nbsp;계약 금액: {proj.budget}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: proj.statusTextColor, fontFamily: F }}>{proj.statusText}</span>
      </div>
    </div>
  );
}

/* ── 지원 종료 카드 ─────────── */
function ClosedProjCard({ proj }) {
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
    </div>
  );
}

/* ── ApplicationsTab ─────────────────────────────────────── */
function ApplicationsTab({ activeTab, onGoContractMeeting }) {
  const showActive = activeTab === "apply_active";
  const [selectedProject, setSelectedProject] = useState(null);
  const [contractPopupProj, setContractPopupProj] = useState(null);
  const [meetingReady, setMeetingReady] = useState(() =>
    Object.fromEntries(MOCK_ACCEPTED_PROJS.map(p => [p.id, p.btnLabel === "상세 계약 미팅 이동"]))
  );

  const handleAcceptedAction = (proj) => {
    if (meetingReady[proj.id]) {
      onGoContractMeeting?.(proj);
      return;
    }
    setContractPopupProj(proj);
  };

  const confirmContract = () => {
    if (!contractPopupProj) return;
    setMeetingReady(prev => ({ ...prev, [contractPopupProj.id]: true }));
    setContractPopupProj(null);
  };

  return (
    <div>
      {selectedProject && <ApplicationProjectDetailModal proj={selectedProject} onClose={() => setSelectedProject(null)} />}
      {contractPopupProj && <ContractGuidePopup projTitle={contractPopupProj.title} onClose={confirmContract} />}

      {/* 프로젝트 지원 중 — apply_active 탭에서만 표시 */}
      {showActive && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>프로젝트 지원 중</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>관심 프로젝트로 추가한 프로젝트를 확인할 수 있습니다.</p>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>전체 / AI 추천 프로젝트 보기 &gt;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_ACTIVE_PROJS.map(p => <ActiveProjCard key={p.id} proj={p} onViewDetail={setSelectedProject} />)}
          </div>
        </div>
      )}

      {/* 합격 프로젝트 — apply_active 탭에서만 표시 */}
      {showActive && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>합격 프로젝트</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>축하합니다! 합격하여 계약 대기 또는 진행 예정인 프로젝트입니다.</p>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>전체 합격 프로젝트 보기 &gt;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_ACCEPTED_PROJS.map(p => (
              <AcceptedProjCard
                key={p.id}
                proj={p}
                isMeetingMove={!!meetingReady[p.id]}
                onAction={handleAcceptedAction}
                onViewDetail={setSelectedProject}
              />
            ))}
          </div>
        </div>
      )}

      {/* 지원 종료 — apply_done 탭에서만 표시 */}
      {!showActive && <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>지원 종료</h2>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>모집이 종료되었거나 지원을 철회한 프로젝트들입니다.</p>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>전체 종료 내역 보기 &gt;</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_CLOSED_PROJS.map(p => <ClosedProjCard key={p.id} proj={p} />)}
        </div>
      </div>}
    </div>
  );
}

/* ── InterestsTab (관심 프로젝트/파트너) ─────────────────── */
const MOCK_INTEREST_PROJECTS = [
  {
    id: 1,
    badge: "유료",
    title: "AI 기반 이상 거래 탐지 시스템 고도화",
    liked: true,
    desc: "금융 데이터 분석을 통한 실시간 이상 거래 탐지 모델 최적화 및 API 개발",
    tags: ["#AI/ML", "#Python", "#Fintech"],
    period: "3개월",
    budget: "1,500만원",
    deadline: "마감 임박 (D-3)",
    deadlineColor: "#EF4444",
  },
  {
    id: 2,
    badge: "무료",
    title: "이커머스 플랫폼 모바일 앱 리뉴얼",
    liked: false,
    desc: "사용자 경험 중심의 UI/UX 개편 및 Flutter 기반 크로스 플랫폼 앱 개발",
    tags: ["#Mobile", "#Web", "#Flutter"],
    period: "4개월",
    budget: "2,800만원",
    deadline: "마감 D-15",
    deadlineColor: "#64748B",
  },
];
const MOCK_INTEREST_PARTNERS = [
  {
    id: 1,
    name: "김민수 파트너",
    rating: 4.9,
    liked: true,
    tags: ["Full-stack", "React", "Node.js"],
    desc: "10년차 풀스택 개발자입니다. 확장성 있는 아키텍처 설계와 빠른 결과 도출을 지향합니다.",
  },
  {
    id: 2,
    name: "이하은 파트너",
    rating: 5.0,
    liked: true,
    tags: ["AI/ML", "Python", "PyTorch"],
    desc: "데이터 분석 및 딥러닝 모델 고도화 전문가입니다. 복잡한 문제를 효율적인 알고리즘으로 해결합니다.",
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
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 12, fontWeight: 600, color: c.text, fontFamily: F,
    }}>{label}</span>
  );
}

function ProjectDetailPopup({ proj, onClose }) {
  const aiMatch = proj.id === 1 ? "93%" : "87%";
  const { addProjectApplication, userId, loginUser } = useStore();
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    addProjectApplication({
      id: Date.now(),
      projectTitle: proj.title,
      partnerName: userId || (loginUser && loginUser.name) || "파트너",
      partnerHero: "hero_student",
      appliedAt: new Date().toLocaleDateString("ko-KR"),
      status: "검토 중",
      projectWorkPref: "재택",
      projectPeriod: proj.period,
      projectPrice: proj.budget,
      projectTags: proj.tags,
    });
    setApplied(true);
    setTimeout(() => onClose(), 1200);
  };

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
          width: "min(680px, 92vw)", maxHeight: "85vh",
          overflowY: "auto", position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        <div style={{
          padding: "20px 28px 16px", position: "sticky", top: 0, background: "white",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4",
              color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F,
            }}>{proj.badge}</span>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: "#F0FDF4", color: "#16A34A", fontFamily: F,
            }}>AI Match {aiMatch}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F, paddingRight: 36 }}>{proj.title}</h2>
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
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, fontFamily: F, marginBottom: 4 }}>예상 기간</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{proj.period}</div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, fontFamily: F, marginBottom: 4 }}>예상 견적</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{proj.budget}</div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>프로젝트 개요</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.7 }}>{proj.desc}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>필요 기술 스택</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {proj.tags.map(t => (
                <span key={t} style={{
                  padding: "5px 14px", borderRadius: 99,
                  background: "#F8FAFC", border: "1px solid #E2E8F0",
                  fontSize: 13, fontWeight: 600, color: "#475569", fontFamily: F,
                }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{
            background: "#FAFAFA", borderRadius: 12, padding: "14px 18px",
            border: "1px solid #F1F5F9", marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>모집 마감</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: proj.deadlineColor, fontFamily: F }}>{proj.deadline}</span>
          </div>
          <button
            onClick={handleApply}
            disabled={applied}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: applied
                ? "linear-gradient(135deg, #86efac, #22c55e)"
                : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)",
              color: "white", fontSize: 15, fontWeight: 700, cursor: applied ? "default" : "pointer", fontFamily: F,
              transition: "background 0.3s",
            }}>{applied ? "✓ 지원 완료!" : "프로젝트 지원하기"}</button>
        </div>
      </div>
    </div>
  );
}
function PartnerDetailPopup({ partner, onClose }) {
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
          width: "min(520px, 90vw)", maxHeight: "80vh",
          overflowY: "auto", position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", gap: 16, position: "relative",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
            border: "2px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#60A5FA"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#60A5FA"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F, marginBottom: 4 }}>{partner.name}</div>
            <div style={{ fontSize: 14, color: "#FBBF24", fontFamily: F }}>
              {"★".repeat(Math.floor(partner.rating))} <span style={{ color: "#64748B", fontWeight: 600 }}>{partner.rating}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 18, background: "none", border: "none",
              cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px",
            }}
          >✕</button>
        </div>
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>보유 기술</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {partner.tags.map(t => <PartnerTag key={t} label={t} />)}
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: "#3B82F6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>자기소개</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", margin: 0, fontFamily: F, lineHeight: 1.7 }}>{partner.desc}</p>
          </div>
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
function InterestsTab() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [likedProjects, setLikedProjects] = useState(
    Object.fromEntries(MOCK_INTEREST_PROJECTS.map(p => [p.id, p.liked]))
  );
  const [likedPartners, setLikedPartners] = useState(
    Object.fromEntries(MOCK_INTEREST_PARTNERS.map(p => [p.id, p.liked]))
  );

  return (
    <div>
      {selectedProject && <ProjectDetailPopup proj={selectedProject} onClose={() => setSelectedProject(null)} />}
      {selectedPartner && <PartnerDetailPopup partner={selectedPartner} onClose={() => setSelectedPartner(null)} />}
      {/* 관심 프로젝트 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>관심 프로젝트</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>관심 프로젝트로 추가한 프로젝트를 확인할 수 있습니다.</p>
        </div>
        <button onClick={() => navigate("/project_search")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600,
          whiteSpace: "nowrap", padding: 0,
        }}>전체 / AI 추천 프로젝트 보기 &gt;</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
        {MOCK_INTEREST_PROJECTS.map(proj => (
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
                  onClick={() => setLikedProjects(p => ({ ...p, [proj.id]: !p[proj.id] }))}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
                >{likedProjects[proj.id] ? "🩷" : "🤍"}</button>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>관심 파트너스</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>관심 파트너로 추가한 전문가들을 확인하고 바로 협업을 제안해 보세요.</p>
        </div>
        <button onClick={() => navigate("/partner_search")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600,
          whiteSpace: "nowrap", padding: 0,
        }}>전체 파트너 보기 &gt;</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_INTEREST_PARTNERS.map(partner => (
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
                    onClick={() => setLikedPartners(p => ({ ...p, [partner.id]: !p[partner.id] }))}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
                  >{likedPartners[partner.id] ? "🩷" : "🤍"}</button>
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
    { badge: "완료",    title: "UI Design System",      start: "2024.03.01", end: "2024.03.10", extra: "산출물 제출: 2024.03.12", statusLabel: "Completed", statusColor: "#16A34A", btnLabel: "기록 보기", btnStyle: "outline", escrow: { status: "정산 완료",       amount: "2,500,000" } },
    { badge: "진행 중", title: "Core API Development",  start: "2024.03.11", end: "2024.03.25", extra: "상태: D-3",               statusLabel: "Ongoing",   statusColor: "#1D4ED8", btnLabel: "제출 하기", btnStyle: "primary", escrow: { status: "에스크로 보관 중", amount: "4,000,000" } },
    { badge: "재작업",  title: "Authentication Module", start: "2024.03.05", end: "2024.03.15", extra: "상태: 마감 임박",          statusLabel: "Rework",    statusColor: "#EF4444", btnLabel: "재제출",    btnStyle: "danger",  escrow: { status: "결제 대기",       amount: "3,500,000" } },
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
    { bg: "#EFF6FF", border: "#BFDBFE", icon: "📊", title: "Milestone Review Request",   desc: "Task: Core API Module needs approval",      btns: [{ label: "확인하기", s: "success" }] },
    { bg: "#F8FAFC", border: "#E2E8F0", icon: "☁️", title: "File Received",              desc: "Project_Contract_Signed.pdf was uploaded",  btns: [{ label: "파일 보기", s: "link" }] },
  ],
};
/* ── MilestoneSubmitModal ───────────────────────────────────── */
const ESCROW_STYLES = {
  "결제 대기":        { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: "⏳" },
  "에스크로 보관 중": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: "🔒" },
  "납품 검수 중":     { bg: "#F5F3FF", color: "#5B21B6", border: "#C4B5FD", icon: "🔍" },
  "정산 완료":        { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC", icon: "✅" },
};
function MilestoneSubmitModal({ milestone, existingFiles, onClose, onSubmitSuccess }) {
  const [uploadMode, setUploadMode] = useState("existing"); // "existing" | "new"
  const [checkedFiles, setCheckedFiles] = useState(
    existingFiles.reduce((acc, f) => ({ ...acc, [f.name]: true }), {})
  );
  const [newFiles, setNewFiles] = useState([]);
  const [links, setLinks] = useState(["https://github.com/project/pull/42"]);
  const [newLink, setNewLink] = useState("");
  const [memo, setMemo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const FILE_ICONS = {
    pdf:  { bg: "#EFF6FF", color: "#3B82F6", label: "PDF" },
    docx: { bg: "#F0FDF4", color: "#16A34A", label: "DOC" },
    zip:  { bg: "#FFF7ED", color: "#EA580C", label: "ZIP" },
  };
  const previewFiles = [
    { name: "system_architecture_v1.pdf", size: "2.4 MB", ext: "pdf" },
    { name: "api_draft_0315.docx",        size: "1.1 MB", ext: "docx" },
    { name: "logo_assets.zip",            size: "12.8 MB", ext: "zip" },
  ];
  const toggleFile = name => setCheckedFiles(prev => ({ ...prev, [name]: !prev[name] }));

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setNewFiles(prev => [...prev, ...dropped]);
  };
  const handleFilePick = e => setNewFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const addLink = () => { if (newLink.trim()) { setLinks(prev => [...prev, newLink.trim()]); setNewLink(""); } };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 20, width: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: F }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 26px 16px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#1E293B" }}>마일스톤 완료 제출</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 23, color: "#94A3B8", lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* 마일스톤 정보 */}
          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-5.7"/></svg>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#3B82F6" }}>{milestone.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#64748B", marginBottom: 4 }}>
              <span>📅 {milestone.start} — {milestone.end}</span>
              <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>D-Day</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {milestone.extra}
            </div>
          </div>

          {/* 파일 첨부 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>파일 첨부</div>
            {/* 모드 토글 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 14 }}>
              {[["new", "새 파일 업로드"], ["existing", "기존 파일에서 선택"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setUploadMode(mode)}
                  style={{ padding: "9px 0", borderRadius: 8, border: "none", background: uploadMode === mode ? "white" : "transparent", color: uploadMode === mode ? "#1E293B" : "#94A3B8", fontSize: 14, fontWeight: uploadMode === mode ? 700 : 500, cursor: "pointer", fontFamily: F, transition: "all 0.15s", boxShadow: uploadMode === mode ? "0 1px 4px rgba(0,0,0,0.10)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>

            {uploadMode === "existing" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {previewFiles.map(f => {
                  const ic = FILE_ICONS[f.ext] || FILE_ICONS.pdf;
                  const checked = !!checkedFiles[f.name];
                  return (
                    <div key={f.name} onClick={() => toggleFile(f.name)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${checked ? "#BFDBFE" : "#E2E8F0"}`, background: checked ? "#EFF6FF" : "#F8FAFC", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? "#3B82F6" : "#CBD5E1"}`, background: checked ? "#3B82F6" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic.color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: F }}>{f.name}</span>
                      <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{f.size}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? "#3B82F6" : "#CBD5E1"}`, borderRadius: 14, padding: "40px 20px", background: dragOver ? "#EFF6FF" : "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>여기로 파일을 끌어오거나 <span style={{ color: "#3B82F6", cursor: "pointer" }}>클릭하여 선택</span>하세요</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, marginTop: 4 }}>지원 형식: PDF, DOCX, JPG, PNG (최대 50MB)</div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleFilePick} />
                {newFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {newFiles.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #BFDBFE", background: "#EFF6FF" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style={{ flex: 1, fontSize: 13, color: "#1E293B", fontFamily: F }}>{f.name}</span>
                        <button onClick={e => { e.stopPropagation(); setNewFiles(prev => prev.filter((_, j) => j !== i)); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16, padding: 2 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 외부 링크 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>외부 링크</span>
              <button onClick={() => {}} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#3B82F6", fontWeight: 600, fontFamily: F }}>+ 링크 추가</button>
            </div>
            {links.map((lk, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input value={lk} onChange={e => setLinks(prev => prev.map((l, j) => j === i ? e.target.value : l))}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", fontSize: 14, fontFamily: F, outline: "none", color: "#475569" }} />
                <button onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 19, padding: 4, lineHeight: 1 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()}
                placeholder="https://..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", fontSize: 14, fontFamily: F, outline: "none", color: "#475569" }} />
              <button onClick={addLink} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#EFF6FF", color: "#3B82F6", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>추가</button>
            </div>
          </div>

          {/* 작업 메모 */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 10 }}>작업 메모</div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="작업 설명 및 특이사항을 입력해 주세요..."
              style={{ width: "100%", minHeight: 90, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#F8FAFC", padding: "12px 14px", fontSize: 14, fontFamily: F, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, color: "#475569" }} />
          </div>

          {/* 안내 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderRadius: 10, background: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 13, color: "#0369A1", fontFamily: F, lineHeight: 1.6 }}>제출 시 담당 클라이언트에게 실시간 알림이 발송됩니다. 마일스톤 검토 후 승인이 완료되어야 다음 단계로 진행할 수 있습니다.</span>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ padding: "16px 26px 22px", flexShrink: 0, borderTop: "1px solid #F1F5F9" }}>
          <button
            onClick={() => { onSubmitSuccess?.(); }}
            onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#2563eb,#4338ca)"}
            onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#3b82f6,#6366f1)"}
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 마일스톤 버튼 (hover 포함, 가로/세로 통일) ── */
function MilestoneBtn({ label, btnStyle, onClick }) {
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
      onClick={onClick}
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
function AlarmBtn({ label, s }) {
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
      style={{
        padding: "6px 16px", borderRadius: 8, border: "none",
        background: hov ? st.bgHov : st.bg, color: st.color,
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F,
        transition: "background 0.15s",
      }}
    >{label}</button>
  );
}

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
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [openContractModal, setOpenContractModal] = useState(null);
  const [contractItemStatuses, setContractItemStatuses] = useState(INITIAL_PROJECT_PROGRESS_STATUSES);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState(d.files);
  const [linkList, setLinkList] = useState(d.links);
  const [linkForm, setLinkForm] = useState({ url: "", title: "", desc: "" });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMs, setSubmitMs] = useState(null);
  const [submitMsIdx, setSubmitMsIdx] = useState(null);
  const [escrowStatuses, setEscrowStatuses] = useState(
    () => Object.fromEntries(d.detailMilestones.map((ms, i) => [i, ms.escrow?.status || "결제 대기"]))
  );
  const [escrowDetailIdx, setEscrowDetailIdx] = useState(null);
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };
  return (
    <div style={{ position: "relative" }}>
      {showSubmitModal && submitMs && (
        <MilestoneSubmitModal
          milestone={submitMs}
          existingFiles={fileList}
          onClose={() => { setShowSubmitModal(false); setSubmitMs(null); setSubmitMsIdx(null); }}
          onSubmitSuccess={() => {
            if (submitMsIdx !== null) setEscrowStatuses(prev => ({ ...prev, [submitMsIdx]: "납품 검수 중" }));
            setShowSubmitModal(false); setSubmitMs(null); setSubmitMsIdx(null);
          }}
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
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: F, marginBottom: 10 }}>첨부된 파일 ({uploadFiles.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploadFiles.map((uf, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 19 }}>📄</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: F, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uf.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{uf.size}</span>
                          <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>• 완료</span>
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
              <span style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F }}>마일스톤 진행</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14.5, color: "#3B82F6", fontFamily: F, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>🔄 변경 내역</button>
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
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 12.5, fontWeight: 700, background: bc.bg, border: `1px solid ${bc.border}`, color: bc.text, fontFamily: F }}>{ms.badge}</span>
                          <span style={{ fontSize: 15.5, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{ms.title}</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: "#64748B", fontFamily: F, display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <span>시작일: <strong style={{ color: "#374151" }}>{ms.start}</strong></span>
                          <span>마감일: <strong style={{ color: "#374151" }}>{ms.end}</strong></span>
                          <span style={{ color: ms.badge !== "완료" ? "#EF4444" : "#374151" }}>{ms.extra}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: ms.statusColor, fontFamily: F, minWidth: 60, textAlign: "right" }}>{ms.statusLabel}</span>
                        <MilestoneBtn
                          label={ms.btnLabel}
                          btnStyle={ms.btnStyle}
                          onClick={(ms.btnStyle === "primary" || ms.btnStyle === "danger") ? () => { setSubmitMs(ms); setSubmitMsIdx(i); setShowSubmitModal(true); } : undefined}
                        />
                      </div>
                    </div>
                    {/* 에스크로 상태 바 */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: es.bg, border: `1px solid ${es.border}` }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: es.color, fontFamily: F, display: "flex", alignItems: "center", gap: 5 }}>
                        {es.icon} {eStatus}
                        <span style={{ fontWeight: 500, color: "#64748B", marginLeft: 6, fontSize: 12.5 }}>₩{ms.escrow?.amount}원</span>
                      </span>
                      {eStatus === "결제 대기" && (
                        <span style={{ fontSize: 12.5, color: "#94A3B8", fontFamily: F }}>🕐 클라이언트 결제 대기 중...</span>
                      )}
                      {eStatus === "에스크로 보관 중" && (
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1D4ED8", fontFamily: F }}>🔒 에스크로 확인됨 — 납품 후 정산</span>
                      )}
                      {eStatus === "납품 검수 중" && (
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#5B21B6", fontFamily: F }}>🔍 납품 제출 완료 — 사용자 검수 중...</span>
                      )}
                      {eStatus === "정산 완료" && (
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#15803D", fontFamily: F }}>✅ ₩{ms.escrow?.amount}원 정산 완료</span>
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
                  <button key={key} onClick={() => setFileTab(key)} style={{ padding: "4px 16px 10px", border: "none", background: "none", fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: F, color: fileTab === key ? "#3B82F6" : "#94A3B8", borderBottom: fileTab === key ? "2.5px solid #3B82F6" : "2.5px solid transparent" }}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowAddLinkModal(true)}
                  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#e8ecf0,#dde3ea)"}
                  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#f4f6f8,#e8ecf0)"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "linear-gradient(135deg,#f4f6f8,#e8ecf0)", fontSize: 13.5, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>🔗 링크 추가</button>
                <button
                  onClick={() => setShowFileUploadModal(true)}
                  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#93c5fd,#60a5fa)"}
                  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#bfdbfe,#93c5fd)"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#bfdbfe,#93c5fd)", color: "#1e3a5f", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.15s" }}>↑ 파일 전송</button>
              </div>
            </div>
            {fileTab === "files" ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  {["FILENAME","SENDER","DATE","SIZE/TYPE","다운로드"].map(h => (
                    <span key={h} style={{ fontSize: 12.5, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: "0.05em" }}>{h}</span>
                  ))}
                </div>
                {fileList.map((f, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 60px", padding: "13px 12px", borderBottom: i < fileList.length - 1 ? "1px solid #F8FAFC" : "none", alignItems: "center" }}>
                    <div onClick={() => setSelectedFile(f)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#1E293B", fontFamily: F, cursor: "pointer" }}><span style={{ fontSize: 17 }}>{f.icon === "pdf" ? "📄" : "🖼"}</span>{f.name}</div>
                    <span style={{ fontSize: 14.5, color: "#475569", fontFamily: F }}>{f.sender}</span>
                    <span style={{ fontSize: 14.5, color: "#475569", fontFamily: F }}>{f.date}</span>
                    <span style={{ fontSize: 14.5, color: "#475569", fontFamily: F }}>{f.size}</span>
                    <button
                      onClick={() => { const a = document.createElement("a"); a.href = "#"; a.download = f.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#3B82F6"; e.currentTarget.style.transform = "scale(1.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.transform = "scale(1)"; }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 19, color: "#64748B", transition: "color 0.15s, transform 0.15s" }}>⬇</button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 60px", padding: "8px 12px", borderBottom: "1px solid #F1F5F9" }}>
                  {["링크 이름","추가자","날짜","복사"].map(h => (
                    <span key={h} style={{ fontSize: 12.5, fontWeight: 700, color: "#94A3B8", fontFamily: F, letterSpacing: "0.05em" }}>{h}</span>
                  ))}
                </div>
                {linkList.map((lk, i) => (
                  <div key={i}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 60px", padding: "13px 12px", borderBottom: i < linkList.length - 1 ? "1px solid #F8FAFC" : "none", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#3B82F6", fontFamily: F, fontWeight: 600 }}>
                      <span style={{ fontSize: 16 }}>🔗</span>
                      <span onClick={() => setSelectedLink(lk)} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline" }}>{lk.title}</span>
                    </div>
                    <span style={{ fontSize: 14.5, color: "#475569", fontFamily: F }}>{lk.addedBy}</span>
                    <span style={{ fontSize: 14.5, color: "#475569", fontFamily: F }}>{lk.date}</span>
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
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F, margin: "0 0 14px" }}>Recent Alarms</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {d.alarms.map((alarm, i) => (
                <div key={i} style={{ background: alarm.bg, border: `1.5px solid ${alarm.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 27, marginBottom: 8 }}>{alarm.icon}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 4 }}>{alarm.title}</div>
                  <div style={{ fontSize: 13.5, color: "#64748B", fontFamily: F, marginBottom: 0, lineHeight: 1.5, flex: 1 }}>{alarm.desc}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                    {alarm.btns.map((btn, j) => (
                      <AlarmBtn key={j} label={btn.label} s={btn.s} />
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
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>계약 세부 협의 항목</h4>
              </div>
              {(() => {
                const cnt = Object.values(contractItemStatuses).filter(isAgreementCompleted).length;
                return <span style={{ fontSize: 12, fontWeight: 700, color: cnt === 7 ? "#16A34A" : "#3B82F6", background: cnt === 7 ? "#F0FDF4" : "#EFF6FF", border: `1px solid ${cnt === 7 ? "#BBF7D0" : "#BFDBFE"}`, borderRadius: 99, padding: "2px 8px", fontFamily: F }}>진행률 {Math.round((cnt / 7) * 100)}%</span>;
              })()}
            </div>
            {CONTRACT_MODAL_DEFS.map((m) => {
              const ss = statusStyle(contractItemStatuses[m.key]);
              return (
                <div
                  key={m.key}
                  onClick={() => setOpenContractModal(m.key)}
                  onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px", borderRadius: 6, marginBottom: 1, cursor: "pointer", transition: "background 0.15s", border: "1px solid transparent" }}
                >
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500, fontFamily: F }}>{m.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ss.text, background: ss.bg, borderRadius: 99, padding: "2px 7px", fontFamily: F, flexShrink: 0 }}>{contractItemStatuses[m.key]}</span>
                    <span style={{ fontSize: 16, color: "#C4C9D4" }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Project Meeting */}
          <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "8px 5px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F }}>Project Meeting</span>
              <span style={{ fontSize: 14, color: "#94A3B8", fontFamily: F }}>{d.meeting.frequency}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 14, color: "#374151", fontFamily: F }}><span style={{ flexShrink: 0 }}>📅</span><span>{d.meeting.date}</span></div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 14, color: "#374151", fontFamily: F }}><span style={{ flexShrink: 0 }}>📍</span><span>{d.meeting.location}</span></div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 14, color: "#64748B", fontFamily: F, lineHeight: 1.4 }}><span style={{ flexShrink: 0 }}>📋</span><span>{d.meeting.agenda}</span></div>
            </div>
            <button
              onClick={() => onGoSchedule?.()}
              onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,#c7d2fe,#a5b4fc)"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,#f1f5f9,#e0e7ff)"}
              style={{ width: "100%", padding: "6px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f1f5f9,#e0e7ff)", fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background 0.15s" }}>
              스케줄 캘린더 이동
            </button>
          </div>
          {/* 에스크로 현황 */}
          <div style={{ border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "8px 5px", background: "linear-gradient(160deg,#EFF6FF,#F5F3FF)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>에스크로 현황</h4>
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
                  <div style={{ fontSize: 13, color: "#64748B", fontFamily: F, marginBottom: 4, lineHeight: 1.4 }}>{ms.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: es.color, background: es.bg, border: `1px solid ${es.border}`, borderRadius: 99, padding: "2px 8px", fontFamily: F }}>{es.icon} {eStatus}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>₩{ms.escrow?.amount}</span>
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
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? null);
  const selectedProj = MOCK_MANAGE_PROJECTS.find(p => p.id === selectedId);
  if (selectedId !== null) {
    return (
      <ProjectDetailDash
        projectName={selectedProj?.title}
        onBack={() => setSelectedId(null)}
        onGoSchedule={onGoSchedule}
        onGoMeeting={() => onOpenProjectMeeting?.(selectedId)}
      />
    );
  }
  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>
            진행 프로젝트 관리 대시보드
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: F }}>프로젝트의 실시간 진행 현황을 확인하고 상세 내용을 관리하세요.</p>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3B82F6", fontFamily: F, fontWeight: 600, whiteSpace: "nowrap", padding: 0 }}>
          현재 수행 중인 프로젝트 목록입니다.
        </button>
      </div>

      {/* 프로젝트 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {MOCK_MANAGE_PROJECTS.map(proj => (
          <div key={proj.id} style={{
            border: "1.5px solid #F1F5F9", borderRadius: 16,
            padding: "22px 24px", background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex", gap: 20, alignItems: "flex-start",
          }}>
            {/* ── 왼쪽: 프로젝트 정보 + 마일스톤 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: proj.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: proj.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F }}>{proj.badge}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{proj.title}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {proj.tags.map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>⟨/⟩ {t}</span>
                ))}
              </div>
              {proj.overallStatus && (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 8, fontFamily: F }}>{proj.overallStatus}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", fontFamily: F }}>Project Progress</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: proj.progress > 0 ? proj.progressColor : "#94A3B8", fontFamily: F }}>{proj.progress}%</span>
              </div>
              <div style={{ width: "100%", height: 8, borderRadius: 99, background: "#F1F5F9", marginBottom: 16, overflow: "hidden" }}>
                <div style={{ width: `${proj.progress}%`, height: "100%", borderRadius: 99, background: proj.progressColor, transition: "width 0.4s" }} />
              </div>
              <div>{proj.milestones.map(ms => <MilestoneRow key={ms.num} ms={ms} />)}</div>
            </div>

            {/* ── 오른쪽: CORE CLIENT */}
            <div style={{ width: 170, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", fontFamily: F }}>CORE CLIENT</span>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F1F5F9", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#94A3B8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#94A3B8"/></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F, textAlign: "center" }}>{proj.client.name}</span>
              <span style={{ fontSize: 12, color: "#F59E0B", fontFamily: F }}>★ {proj.client.rating} ({proj.client.reviews} Reviews)</span>
              <button style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: F }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >클라이언트 메시지</button>
              <button style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: F, boxShadow: "0 3px 10px rgba(99,102,241,0.28)" }}
                onClick={() => setSelectedId(proj.id)}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >프로젝트 관리 상세</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── GuaranteeTab (데브 브릿지 안심 계약) ─────────────────── */
function GuaranteeTab() {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: "0 0 6px", fontFamily: F }}>
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
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>
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
                    onClick={() => {
                      const addedProjects = [
                        ...MOCK_ONGOING_FOR_PORTFOLIO
                          .filter(p => ongoingAdded[p.id])
                          .map(p => ({
                            id: `ongoing-${p.id}`,
                            group: "진행 중",
                            badge: p.badge,
                            badgeBg: p.badge === "유료" ? "#EFF6FF" : "#F0FFF4",
                            badgeColor: p.badge === "유료" ? "#3B82F6" : "#16A34A",
                            title: p.title, desc: p.desc, tags: p.tags,
                          })),
                        ...MOCK_SELECTED_FOR_PORTFOLIO
                          .filter(p => selectedAdded[p.id])
                          .map(p => ({
                            id: `selected-${p.id}`,
                            group: "완료",
                            badge: p.satisfaction,
                            badgeBg: p.satisfBg,
                            badgeColor: p.satisfColor,
                            title: p.title, desc: p.desc, tags: p.tags,
                          })),
                      ];
                      navigate("/portfolio_detail_editor", {
                        state: { projectTitle: proj.title, projectId: `ongoing-${proj.id}`, addedProjects },
                      });
                    }}
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
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>
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
                    onClick={() => {
                      const addedProjects = [
                        ...MOCK_ONGOING_FOR_PORTFOLIO
                          .filter(p => ongoingAdded[p.id])
                          .map(p => ({
                            id: `ongoing-${p.id}`,
                            group: "진행 중",
                            badge: p.badge,
                            badgeBg: p.badge === "유료" ? "#EFF6FF" : "#F0FFF4",
                            badgeColor: p.badge === "유료" ? "#3B82F6" : "#16A34A",
                            title: p.title, desc: p.desc, tags: p.tags,
                          })),
                        ...MOCK_SELECTED_FOR_PORTFOLIO
                          .filter(p => selectedAdded[p.id])
                          .map(p => ({
                            id: `selected-${p.id}`,
                            group: "완료",
                            badge: p.satisfaction,
                            badgeBg: p.satisfBg,
                            badgeColor: p.satisfColor,
                            title: p.title, desc: p.desc, tags: p.tags,
                          })),
                      ];
                      navigate("/portfolio_detail_editor", {
                        state: { projectTitle: proj.title, projectId: `selected-${proj.id}`, addedProjects },
                      });
                    }}
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
    revieweeName: "Alpha FinTech",
    revieweeInitial: "A",
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
    revieweeName: "Shop & Go",
    revieweeInitial: "S",
    revieweeAvatarColor: "#1E293B",
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
    reviewerName: "Crypto Systems",
    reviewerInitial: "C",
    reviewerAvatarColor: "#8B5CF6",
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
    reviewerName: "Meta-Connect",
    reviewerInitial: "M",
    reviewerAvatarColor: "#1E293B",
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
    <span style={{ color: "#FBBF24", letterSpacing: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ opacity: i < Math.round(value) ? 1 : 0.22, fontSize: 14 }}>★</span>
      ))}
      <span style={{ color: "#1E293B", fontWeight: 700, fontSize: 14, marginLeft: 4, fontFamily: F }}>{value.toFixed(1)}</span>
    </span>
  );
}

function ViewReviewPopup({ review, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(680px, 92vw)", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        {/* 헤더 */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #F1F5F9", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: review.badge === "유료" ? "#EFF6FF" : "#F0FFF4", color: review.badge === "유료" ? "#3B82F6" : "#16A34A", fontFamily: F }}>{review.badge}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, fontFamily: F }}>{review.title}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: "2px 6px", marginLeft: 12 }}>✕</button>
          </div>
          {/* 클라이언트 정보 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: review.reviewerAvatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, fontFamily: F, flexShrink: 0 }}>{review.reviewerInitial}</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{review.reviewerName}</span>
            <StarRating value={review.rating} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, marginLeft: 4 }}>{review.endDate} 완료</span>
          </div>
          {/* 태그 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {review.tags.map(t => <span key={t} style={{ padding: "3px 12px", borderRadius: 99, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 12, color: "#475569", fontFamily: F }}>{t}</span>)}
          </div>
        </div>
        {/* 본문 */}
        <div style={{ padding: "20px 28px 28px" }}>
          {/* 세부 점수 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 20 }}>
            {[{ label: "전문성", val: review.expertise }, { label: "일정 준수", val: review.schedule }, { label: "소통 능력", val: review.communication }, { label: "적극성", val: review.proactivity }].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8", fontFamily: F }}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
          {/* Budget / Duration */}
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
          {/* 텍스트 후기 */}
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
        {/* 헤더 */}
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
        {/* 본문 */}
        <div style={{ padding: "20px 28px 28px" }}>
          {/* 별점 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 12 }}>항목별 평가 <span style={{ color: "#EF4444" }}>*</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
              {scoreLabels.map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 13, color: "#64748B", fontFamily: F }}>{label}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        onClick={() => setScores(p => ({ ...p, [key]: star }))}
                        onMouseEnter={() => setHoverScores(p => ({ ...p, [key]: star }))}
                        onMouseLeave={() => setHoverScores(p => ({ ...p, [key]: 0 }))}
                        style={{ fontSize: 22, cursor: "pointer", color: star <= (hoverScores[key] || scores[key]) ? "#FBBF24" : "#E2E8F0", transition: "color 0.1s" }}
                      >★</span>
                    ))}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", fontFamily: F, minWidth: 28, textAlign: "right" }}>{scores[key] > 0 ? scores[key].toFixed(1) : ""}</span>
                  </div>
                </div>
              ))}
            </div>
            {canSubmit && (
              <div style={{ marginTop: 10, textAlign: "right", fontSize: 13, color: "#64748B", fontFamily: F }}>
                평균 점수: <span style={{ fontWeight: 700, color: "#1D4ED8" }}>{avgScore.toFixed(1)}</span>
              </div>
            )}
          </div>
          {/* Budget / Duration */}
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
          {/* 텍스트 후기 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F, marginBottom: 8 }}>후기 코멘트 <span style={{ color: "#94A3B8", fontWeight: 400 }}>(선택)</span></div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="프로젝트 협업 경험에 대한 솔직한 후기를 남겨주세요."
              style={{ width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: F, color: "#1E293B", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.7 }}
            />
          </div>
          <button
            onClick={() => canSubmit && setSubmitted(true)}
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: canSubmit ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)" : "#E2E8F0", color: canSubmit ? "white" : "#94A3B8", fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", fontFamily: F, transition: "background 0.2s" }}
          >후기 등록하기</button>
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
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>평가 대기 프로젝트</h2>
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
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>내가 받은 후기</h2>
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
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", fontFamily: F }}>작성한 후기</h2>
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
const CHAT_CONTACT_HEROES = { 1: heroTeacher, 2: heroCheck, 3: heroStudent };
const CHAT_CONTRACT_HEROES = { 1: heroTeacher, 2: heroCheck };
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
      { id: 1, from: "them", text: "Hello! Thanks for joining the 'Free Meeting' session. I've reviewed your proposal for the API layer refactoring.", time: "10:02 AM" },
      { id: 2, from: "me",   text: "Hi Alex, glad to be here. Did you have any specific concerns about the migration timeline? I've factored in the legacy system dependencies.", time: "10:05 AM" },
      { id: 3, from: "them", text: "The timeline looks solid. I'm actually more interested in the GraphQL implementation. Can we discuss the schema definition approach?", time: "10:07 AM", file: { name: "api_specs_v2.pdf", type: "pdf", size: "1.2 MB" } },
      { id: 4, from: "me",   text: "Absolutely. I've prepared a draft schema using a domain-driven design pattern. I'll share the repo link in a moment.", time: "10:10 AM" },
      { id: 5, type: "system_request", text: "Alex Miller 님께서 Eden (본인)님께 [외주] 팀 프로젝트에서 백엔드/AI직무 함께하기 요청하주셨습니다.\n요청을 수락하겠습니까?  요청 수락시 이후 대화는 계약 상세 협의 미팅으로 넘어갑니다. 🤝" },
      { id: 6, type: "system_notice", text: "계약 상세 협의 미팅으로 이동하여 프로젝트 협의를 이어 진행해주세요 😊" },
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

function AvatarCircle({ initials, size = 40 }) {
  const colors = { A: "#3B82F6", S: "#8B5CF6", M: "#10B981", default: "#64748B" };
  const safeInitials = (typeof initials === "string" && initials.trim()) ? initials.trim() : "?";
  const c = colors[safeInitials[0]] || colors.default;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${c}20`, border: `2px solid ${c}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: c, fontFamily: F }}>{safeInitials}</span>
    </div>
  );
}

function FreeMeetingTab() {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [activeId, setActiveId] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("파일");
  const [acceptedIds, setAcceptedIds] = useState([]);
  const messagesEndRef = useRef(null);
  const msgContainerRef = useRef(null);
  const user = useStore(s => s.user);

  const activeContact = contacts.find(c => c.id === activeId);
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.project.toLowerCase().includes(searchVal.toLowerCase())
  );

  const scrollToBottom = () => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  };
  useEffect(() => { scrollToBottom(); }, [activeId, contacts]);

  const sendMessage = () => {
    const text = msgInput.trim();
    if (!text) return;
    const newMsg = { id: Date.now(), from: "me", text, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, time: "방금" } : c));
    setMsgInput("");
  };

  const acceptRequest = (contactId) => setAcceptedIds(prev => [...prev, contactId]);

  const DRAWER_TABS = ["사진/동영상", "파일", "링크"];

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 600, gap: 0, overflow: "hidden" }}>

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
              }}
              onMouseEnter={e => { if (activeId !== contact.id) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (activeId !== contact.id) e.currentTarget.style.background = "white"; }}
            >
              <AvatarCircle initials={contact.initials} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{contact.name}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{contact.time}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", fontFamily: F, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.project}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.lastMsg}</span>
                  {contact.unread > 0 && (
                    <span style={{ background: "#3B82F6", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", flexShrink: 0, marginLeft: 4 }}>{contact.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 오른쪽: 채팅 영역 ── */}
      {activeContact && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", position: "relative" }}>

          {/* 채팅 헤더 */}
          <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
            <AvatarCircle initials={activeContact.initials} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{activeContact.name}</div>
              <div style={{ fontSize: 11, color: "#64748B", fontFamily: F }}>Project: {activeContact.project}</div>
            </div>
            {activeContact.active && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 6, padding: "3px 8px", fontFamily: F, letterSpacing: "0.05em" }}>ACTIVE MEETING</span>
            )}
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

          {/* 채팅 + 서랍장 가로 분할 */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* 메시지 영역 */}
            <div ref={msgContainerRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {/* 날짜 구분선 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 16px" }}>
                <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
                <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, fontWeight: 600 }}>TODAY, OCT 24</span>
                <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
              </div>

              {activeContact.messages.map(msg => {
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

                const isMe = msg.from === "me";
                const contactHero = CHAT_CONTACT_HEROES[activeContact.id];
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
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
                        <div style={{
                          background: isMe ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#F8FAFC",
                          color: isMe ? "white" : "#1E293B",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          padding: "12px 18px", fontSize: 13.4, fontFamily: F, lineHeight: 1.6,
                          boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                          border: isMe ? "none" : "1px solid #F1F5F9",
                        }}>
                          {msg.text}
                          {msg.file && <FileBubble file={msg.file} />}
                        </div>
                        <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
                      </div>
                    </div>
                    {isMe && (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
                        <img
                          src={user?.heroImage || user?.profileImage || user?.picture || heroDefault}
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

            {/* 서랍장 (... 클릭 시 */}
            {drawerOpen && (
              <div style={{ width: 280, flexShrink: 0, borderLeft: "1.5px solid #F1F5F9", background: "#FAFBFC", display: "flex", flexDirection: "column" }}>
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
                            <div key={i} style={{ aspectRatio: "1", background: "#E2E8F0", borderRadius: 8, overflow: "hidden", cursor: "pointer" }} />
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
                            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}
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
          <div style={{ borderTop: "1.5px solid #F1F5F9", padding: "12px 16px", background: "white", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="메시지를 입력하세요..."
              style={{ flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", background: "#FAFBFC", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
            <button style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            <button
              onClick={sendMessage}
              disabled={!msgInput.trim()}
              style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: msgInput.trim() ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: msgInput.trim() ? "pointer" : "default", flexShrink: 0, transition: "background 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ContractMeetingTab ─────────────────────────────────────────── */
const CONTRACT_MOCK_CONTACTS = [
  {
    id: 1,
    name: "Alex Miller",
    project: "E-Commerce Platform Modernization",
    avatar: null,
    initials: "AM",
    time: "10:10 AM",
    lastMsg: "I've reviewed your proposal for the API layer...",
    unread: 0,
    active: true,
    messages: [
      { id: 1, type: "system_intro" },
      { id: 2, type: "contract_items" },
      { id: 3, type: "date_divider", label: "TODAY, OCT 24" },
      { id: 4, from: "them", text: "Hello! Thanks for joining the 'Free Meeting' session. I've reviewed your proposal for the API layer refactoring.", time: "10:02 AM" },
      { id: 5, from: "me",   text: "Hi Alex, glad to be here. Did you have any specific concerns about the migration timeline? I've factored in the legacy system dependencies.", time: "10:05 AM" },
    ],
    sharedFiles: [
      { type: "pdf", name: "api_specs_v2.pdf", size: "1.2 MB", date: "2026-04" },
      { type: "doc", name: "project_proposal.docx", size: "890 KB", date: "2026-04" },
    ],
    sharedImages: [],
    sharedLinks: ["https://github.com/alex/ecomm-schema"],
  },
  {
    id: 2,
    name: "Sarah Chen",
    project: "Mobile Banking App",
    avatar: null,
    initials: "SC",
    time: "Yesterday",
    lastMsg: "Let's discuss the contract details.",
    unread: 1,
    active: false,
    messages: [
      { id: 1, type: "system_intro" },
      { id: 2, type: "contract_items" },
      { id: 3, type: "date_divider", label: "YESTERDAY" },
      { id: 4, from: "them", text: "Hi, let's discuss the contract details for the banking app.", time: "Yesterday 2:30 PM" },
    ],
    sharedFiles: [],
    sharedImages: [],
    sharedLinks: [],
  },
];

const PROJECT_MEETING_MOCK_CONTACTS = [
  {
    id: 1,
    name: "Alpha FinTech",
    project: "AI 기반 지능형 큐레이터 플랫폼 고도화",
    initials: "AF",
    time: "10:24 AM",
    lastMsg: "모델 파인튜닝 결과 공유 감사합니다.",
    unread: 0,
    messages: [
      { id: 1, type: "system_intro" },
      { id: 2, type: "contract_items" },
      { id: 3, type: "date_divider", label: "TODAY" },
      { id: 4, from: "them", text: "모델 파인튜닝 결과 공유 감사합니다.", time: "10:24 AM" },
      { id: 5, from: "me", text: "다음 배포 일정에 맞춰 API 응답 스키마도 정리해서 전달드리겠습니다.", time: "10:28 AM" },
    ],
    sharedFiles: [],
    sharedLinks: [],
  },
  {
    id: 2,
    name: "Blue Retail Co.",
    project: "E-commerce Platform UX/UI Redesign",
    initials: "BR",
    time: "Yesterday",
    lastMsg: "모바일 프로토타입 2차 피드백 전달했습니다.",
    unread: 1,
    messages: [
      { id: 1, type: "system_intro" },
      { id: 2, type: "contract_items" },
      { id: 3, type: "date_divider", label: "YESTERDAY" },
      { id: 4, from: "them", text: "모바일 프로토타입 2차 피드백 전달했습니다.", time: "Yesterday 3:10 PM" },
    ],
    sharedFiles: [],
    sharedLinks: [],
  },
  {
    id: 3,
    name: "Crypto Systems",
    project: "Bitcoin Auto-Trading System Development",
    initials: "CS",
    time: "2 days ago",
    lastMsg: "코어 로직 설계안 검토 후 회신 부탁드립니다.",
    unread: 0,
    messages: [
      { id: 1, type: "system_intro" },
      { id: 2, type: "contract_items" },
      { id: 3, type: "date_divider", label: "2 DAYS AGO" },
      { id: 4, from: "them", text: "코어 로직 설계안 검토 후 회신 부탁드립니다.", time: "2 days ago 11:20 AM" },
    ],
    sharedFiles: [],
    sharedLinks: [],
  },
];

const CONTRACT_MODAL_DEFS = [
  { key: "scope",       label: "1.  작업 범위",             Component: ScopeModal },
  { key: "deliverable", label: "2. 최종 전달물 정의서",     Component: DeliverablesModal },
  { key: "schedule",    label: "3. 마감 일정 및 마일스톤", Component: ScheduleModal },
  { key: "payment",     label: "4. 총 금액",               Component: PaymentModal },
  { key: "revision",    label: "5. 수정 가능 범위",         Component: RevisionModal },
  { key: "completion",  label: "6. 완료 기준",              Component: CompletionModal },
  { key: "terms",       label: "7. 추가 특약 (선택)",       Component: SpecialTermsModal },
];

const INITIAL_STATUSES = {
  scope: "논의 중", deliverable: "미확정", schedule: "논의 중",
  payment: "미확정", revision: "미확정", completion: "논의 중", terms: "미확정",
};

const INITIAL_PROJECT_PROGRESS_STATUSES = {
  scope: "협의완료",
  deliverable: "협의완료",
  schedule: "협의완료",
  payment: "협의완료",
  revision: "협의완료",
  completion: "협의완료",
  terms: "논의 중",
};

const INITIAL_PROJECT_MEETING_STATUSES = INITIAL_PROJECT_PROGRESS_STATUSES;

const isAgreementCompleted = (s) => s === "확정" || s === "협의완료";

function statusStyle(s) {
  if (s === "논의 중")  return { bg: "#FEF3C7", text: "#D97706" };
  if (s === "제안됨")   return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (s === "확정")     return { bg: "#DCFCE7", text: "#16A34A" };
  if (s === "협의완료") return { bg: "#DCFCE7", text: "#16A34A" };
  return { bg: "#F1F5F9", text: "#64748B" };
}

function ContractMeetingTab({ initialContactId = 1, initialContacts = CONTRACT_MOCK_CONTACTS, initialStatuses = INITIAL_STATUSES, showModalHeaderStatusBadge = true, showDashboardMoveButton = false }) {
  const user = useStore(s => s.user);
  const [, setSearchParams] = useSearchParams();
  const [contacts, setContacts]           = useState(initialContacts);
  const [activeId, setActiveId]           = useState(initialContactId);
  const [searchVal, setSearchVal]         = useState("");
  const [msgInput, setMsgInput]           = useState("");
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerTab, setDrawerTab]         = useState("파일");
  const [openModal, setOpenModal]         = useState(null);
  const [acceptedIds, setAcceptedIds]     = useState([]);
  const [itemStatuses, setItemStatuses]   = useState(initialStatuses);
  const msgContainerRef                   = useRef(null);

  const activeContact = contacts.find(c => c.id === activeId);
  const filtered      = contacts.filter(c =>
    c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.project.toLowerCase().includes(searchVal.toLowerCase())
  );

  const confirmedCount = Object.values(itemStatuses).filter(isAgreementCompleted).length;

  useEffect(() => {
    if (msgContainerRef.current)
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
  }, [activeId, contacts]);

  const sendMessage = () => {
    const text = msgInput.trim();
    if (!text) return;
    const newMsg = { id: Date.now(), from: "me", text, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, time: "방금" } : c));
    setMsgInput("");
  };

  const handleAccept = (id) => setAcceptedIds(prev => [...prev, id]);
  const handlePropose = (key) => {
    setItemStatuses(prev => ({ ...prev, [key]: "제안됨" }));
    setOpenModal(null);
  };

  const ActiveModal = CONTRACT_MODAL_DEFS.find(m => m.key === openModal)?.Component;
  const DRAWER_TABS = ["사진/동영상", "파일", "링크"];

  /* ── 특수 메시지 렌더러 ── */
  const renderSystemIntro = (id) => (
    <div key={id} style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 14, padding: "14px 18px", margin: "0 0 12px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0EA5E9", letterSpacing: "0.04em", marginBottom: 6, fontFamily: F }}>시스템 메시지</div>
      <p style={{ margin: 0, fontSize: 13, color: "#0369A1", lineHeight: 1.75, fontFamily: F }}>
        계약 세부 협의의 미팅이 시작되었어요. 자유 미팅에서 상호 수락이 확인되어, 이제 계약 범위·일정·금액을 구체적으로 정리하는 단계에요.
      </p>
    </div>
  );

  const renderContractItems = (id) => (
    <div key={id} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 14, overflow: "hidden", margin: "0 0 12px" }}>
      {/* 헤더 */}
      <div style={{ padding: "13px 16px 11px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>📋</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: F }}>계약 세부 협의의 항목</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#3B82F6",
          background: "#EFF6FF", border: "1px solid #BFDBFE",
          padding: "2px 10px", borderRadius: 99, fontFamily: F,
        }}>진행율 {Math.round((confirmedCount / 6) * 100)}%</span>
      </div>
      {/* 항목 목록 */}
      {CONTRACT_MODAL_DEFS.map((m, i) => {
        const ss = statusStyle(itemStatuses[m.key]);
        return (
          <div
            key={m.key}
            onClick={() => setOpenModal(m.key)}
            style={{
              padding: "12px 16px", display: "flex", alignItems: "center",
              justifyContent: "space-between", cursor: "pointer",
              borderBottom: i < CONTRACT_MODAL_DEFS.length - 1 ? "1px solid #F8FAFC" : "none",
              transition: "background 0.13s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 500, fontFamily: F }}>{m.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: ss.text, background: ss.bg,
                padding: "3px 10px", borderRadius: 99, fontFamily: F,
              }}>{itemStatuses[m.key]}</span>
              <span style={{ fontSize: 14, color: "#C4C9D4" }}>›</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDateDivider = (id, label) => (
    <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
    </div>
  );

  const renderSystemRequest = (msg) => {
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
              onClick={() => handleAccept(activeContact.id)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", color: "white", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer" }}
            >요청 수락하기</button>
            <button style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#374151", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer" }}>
              프로젝트 상세 내용 페이지로 이동
            </button>
          </div>
        ) : (
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F5F3FF)", border: "1.5px solid #C7D2FE", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1E40AF", fontFamily: F, fontWeight: 600 }}>
            ✅ 요청을 수락했습니다. 계약 상세 협의 미팅으로 이동합니다.
          </div>
        )}
      </div>
    );
  };

  const renderSystemNotice = (msg) => (
    <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 99, padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{msg.text}</span>
      </div>
    </div>
  );

  const renderMsg = (msg) => {
    if (msg.type === "system_intro")    return renderSystemIntro(msg.id);
    if (msg.type === "contract_items")  return renderContractItems(msg.id);
    if (msg.type === "date_divider")    return renderDateDivider(msg.id, msg.label);
    if (msg.type === "system_request")  return renderSystemRequest(msg);
    if (msg.type === "system_notice")   return renderSystemNotice(msg);

    const isMe = msg.from === "me";
    const contactHero = CHAT_CONTRACT_HEROES[activeContact.id];
    return (
      <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
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
            <div style={{
              background: isMe ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#F8FAFC",
              color: isMe ? "white" : "#1E293B",
              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 18px", fontSize: 13.4, fontFamily: F, lineHeight: 1.6,
              boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
              border: isMe ? "none" : "1px solid #F1F5F9",
            }}>{msg.text}</div>
            <span style={{ fontSize: 10.4, color: "#94A3B8", fontFamily: F, flexShrink: 0, marginBottom: 2 }}>{msg.time}</span>
          </div>
        </div>
        {isMe && (
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(99,102,241,0.3)" }}>
            <img
              src={user?.heroImage || user?.profileImage || user?.picture || heroDefault}
              alt="me"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", minHeight: 1050, gap: 0, overflow: "hidden" }}>

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
          {filtered.map(contact => (
            <div
              key={contact.id}
              onClick={() => { setActiveId(contact.id); setDrawerOpen(false); setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c)); }}
              style={{
                display: "flex", gap: 10, padding: "13px 14px",
                background: activeId === contact.id ? "#EFF6FF" : "white",
                borderLeft: `3px solid ${activeId === contact.id ? "#3B82F6" : "transparent"}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (activeId !== contact.id) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (activeId !== contact.id) e.currentTarget.style.background = "white"; }}
            >
              <AvatarCircle initials={contact.initials} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: F }}>{contact.name}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{contact.time}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", fontFamily: F, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.project}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.lastMsg}</span>
                  {contact.unread > 0 && (
                    <span style={{ background: "#3B82F6", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", flexShrink: 0, marginLeft: 4 }}>{contact.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 계약 세부 협의 항목 카드 */}
        <div style={{ flexShrink: 0, borderTop: "2px solid #EFF6FF", background: "white", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: F }}>계약 세부 협의 항목</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: confirmedCount === 7 ? "#16A34A" : "#3B82F6", background: confirmedCount === 7 ? "#F0FDF4" : "#EFF6FF", border: `1px solid ${confirmedCount === 7 ? "#BBF7D0" : "#BFDBFE"}`, borderRadius: 99, padding: "3px 10px", fontFamily: F }}>진행률 {Math.round((confirmedCount / 7) * 100)}%</span>
          </div>
          {CONTRACT_MODAL_DEFS.map((m) => {
            const ss = statusStyle(itemStatuses[m.key]);
            return (
              <div
                key={m.key}
                onClick={() => setOpenModal(m.key)}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 50%, #EDE9FE 100%)"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                  cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
                  background: "transparent",
                  border: "1px solid transparent",
                }}
              >
                <span style={{ fontSize: 15, color: "#374151", fontWeight: 500, fontFamily: F }}>{m.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ss.text, background: ss.bg, borderRadius: 99, padding: "3px 10px", fontFamily: F, flexShrink: 0 }}>{itemStatuses[m.key]}</span>
                  <span style={{ fontSize: 14, color: "#C4C9D4" }}>›</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 인라인 모달 — 왼쪽 패널 위 오버레이 (채팅은 오른쪽에서 계속 가능) */}
        {openModal && ActiveModal && (
          <ActiveModal
            inline={true}
            onClose={() => setOpenModal(null)}
            onSubmit={() => handlePropose(openModal)}
            showHeaderStatusBadge={showModalHeaderStatusBadge}
            moduleStatus={itemStatuses[openModal]}
          />
        )}
      </div>

      {/* ── 오른쪽: 채팅 영역 ── */}
      {activeContact && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", position: "relative" }}>

          {/* 채팅 헤더 */}
          <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
            <AvatarCircle initials={activeContact.initials} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", fontFamily: F }}>{activeContact.name}</div>
              <div style={{ fontSize: 11, color: "#64748B", fontFamily: F }}>Project: {activeContact.project}</div>
            </div>
            {/* 진행 프로젝트 미팅 탭: 대시보드 이동 버튼 */}
            {showDashboardMoveButton ? (
              <button
                onClick={() => setSearchParams({ tab: "project_manage" }, { replace: true })}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(99,102,241,0.28)"; }}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 3px 10px rgba(99,102,241,0.28)", transition: "background 0.15s, box-shadow 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                대시보드 이동
              </button>
            ) : null}
            {/* 진행 카운터 */}
            <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: F, flexShrink: 0 }}>{confirmedCount}/7 항 완료</span>
            {/* 서랍장 토글 */}
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

          {/* 채팅 + 서랍장 가로 분할 */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* 메시지 영역 */}
            <div ref={msgContainerRef} style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {activeContact.messages
                .filter(msg => msg.type !== "contract_items")
                .map(msg => renderMsg(msg))}
              <div style={{ height: 1 }} />
            </div>

            {/* 서랍장 */}
            {drawerOpen && (
              <div style={{ width: 280, flexShrink: 0, borderLeft: "1.5px solid #F1F5F9", background: "#FAFBFC", display: "flex", flexDirection: "column" }}>
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
                    <div style={{ color: "#94A3B8", fontSize: 12, fontFamily: F, textAlign: "center", marginTop: 40 }}>공유된 사진/동영상이 없습니다.</div>
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
                            <div key={i} style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer" }}
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
                          <a key={i} href={link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 8, textDecoration: "none" }}
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
          <div style={{ borderTop: "1.5px solid #F1F5F9", padding: "12px 16px", background: "white", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="메시지를 입력하세요..."
              style={{ flex: 1, border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", background: "#FAFBFC", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = "#93C5FD"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
            <button style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            <button
              onClick={sendMessage}
              disabled={!msgInput.trim()}
              style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: msgInput.trim() ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: msgInput.trim() ? "pointer" : "default", flexShrink: 0, transition: "background 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function ProjectMeetingTab({ initialContactId = 1 }) {
  return (
    <ContractMeetingTab
      initialContactId={initialContactId}
      initialContacts={PROJECT_MEETING_MOCK_CONTACTS}
      initialStatuses={INITIAL_PROJECT_MEETING_STATUSES}
      showModalHeaderStatusBadge={false}
      showDashboardMoveButton={true}
    />
  );
}

/* ── IncomeTab (수입/정산 관리) ──────────────────────────────── */
const INCOME_DATA = [
  { date: "2026-03-02", type: "income",  title: "Website Development 1차 정산", category: "Website Development", amount: 4500000 },
  { date: "2026-03-02", type: "income",  title: "App Deployment 선급금",         category: "App Deployment",      amount: 524 },
  { date: "2026-03-03", type: "income",  title: "Consulting 착수금",             category: "Consulting",          amount: 89000 },
  { date: "2026-03-04", type: "income",  title: "App Deployment 중도금",         category: "App Deployment",      amount: 32874 },
  { date: "2026-03-05", type: "income",  title: "Website Development 2차",       category: "Website Development", amount: 30000 },
  { date: "2026-03-07", type: "income",  title: "Other 잡수입",                  category: "Other",               amount: 393840 },
  { date: "2026-03-09", type: "expense", title: "서버 호스팅 비용",               category: "운영비",              amount: 3900 },
  { date: "2026-03-10", type: "income",  title: "App Deployment 완료 정산",       category: "App Deployment",      amount: 119147 },
  { date: "2026-03-10", type: "expense", title: "디자인 툴 구독",                 category: "구독",                amount: 100000 },
  { date: "2026-03-12", type: "income",  title: "Consulting 완료금",             category: "Consulting",          amount: 211101 },
  { date: "2026-03-13", type: "income",  title: "Website Development 잔금",      category: "Website Development", amount: 11900 },
  { date: "2026-03-13", type: "expense", title: "외주 디자이너 비용",             category: "외주",                amount: 10000 },
  { date: "2026-03-14", type: "income",  title: "Other 프리랜서 수당",            category: "Other",               amount: 206377 },
  { date: "2026-03-15", type: "income",  title: "App Deployment 보너스",         category: "App Deployment",       amount: 48800 },
  { date: "2026-03-17", type: "expense", title: "AWS 비용",                       category: "운영비",              amount: 1000 },
  { date: "2026-03-19", type: "income",  title: "Consulting 추가 계약금",         category: "Consulting",          amount: 59648 },
];

const INCOME_COLORS = {
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

  // 해당 월 필터된 데이터
  const filtered = INCOME_DATA.filter(d => {
    const [y, mo] = d.date.split("-").map(Number);
    return d.type === incomeMode && y === year && mo - 1 === month;
  });

  // 날짜별 집계
  const byDate = {};
  filtered.forEach(d => {
    if (!byDate[d.date]) byDate[d.date] = { total: 0, count: 0, items: [] };
    byDate[d.date].total += d.amount;
    byDate[d.date].count += 1;
    byDate[d.date].items.push(d);
  });

  // 달력 생성
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
    const scrollY = window.scrollY;
    setPopupPos({ top: rect.bottom + scrollY + 6, left: rect.left + window.scrollX });
    setSelectedDate(dateStr);
  };

  // 바깥 클릭으로 팝업/년월 피커 닫기
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

  // 월별 전체 리스트 (날짜순)
  const listData = INCOME_DATA.filter(d => {
    const [y, mo] = d.date.split("-").map(Number);
    return d.type === incomeMode && y === year && mo - 1 === month;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const selectedItems = selectedDate ? (byDate[selectedDate]?.items || []) : [];

  return (
    <div style={{ fontFamily: F }}>
      {/* ── 상단 컨트롤 바 */}
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
          {/* 수입/지출 토글 */}
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #E2E8F0", background: "white" }}>
            <button
              onClick={() => setIncomeMode("income")}
              style={{ padding: "7px 18px", border: "none", background: incomeMode === "income" ? "linear-gradient(135deg, #60a5fa, #3b82f6)" : "transparent", color: incomeMode === "income" ? "white" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>수입보기</button>
            <button
              onClick={() => setIncomeMode("expense")}
              style={{ padding: "7px 18px", border: "none", background: incomeMode === "expense" ? "linear-gradient(135deg, #f87171, #ef4444)" : "transparent", color: incomeMode === "expense" ? "white" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>지출보기</button>
          </div>
        </div>
      </div>

      {/* ── 캘린더/리스트 뷰 토글 */}
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

      {/* ── 캘린더 뷰 */}
      {viewMode === "calendar" && (
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "visible", position: "relative" }}>
          {/* 요일 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #F1F5F9" }}>
            {weekdays.map((w, i) => (
              <div key={w} style={{ textAlign: "center", padding: "12px 0", fontSize: 13, fontWeight: 700, fontFamily: F, color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#94A3B8" }}>{w}</div>
            ))}
          </div>
          {/* 날짜 격자 */}
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
                <div
                  key={day}
                  onClick={(e) => handleDateClick(day, e)}
                  style={{
                    minHeight: 90, padding: "8px 6px", cursor: "pointer",
                    borderRight: "1px solid #F8FAFC", borderBottom: "1px solid #F8FAFC",
                    background: isSelected ? "#EFF6FF" : "white",
                    transition: "background 0.12s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F8FAFC"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                >
                  {/* 날짜 숫자 */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26, borderRadius: "50%",
                    background: isToday ? "#3B82F6" : "none",
                    fontSize: 14, fontWeight: isToday ? 800 : 500, fontFamily: F,
                    color: isToday ? "white" : isSun ? "#EF4444" : isSat ? "#3B82F6" : "#1E293B",
                    marginBottom: 2,
                  }}>{day}</div>
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

      {/* ── 리스트 뷰 */}
      {viewMode === "list" && (
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {listData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 15, fontFamily: F }}>이달 {isIncome ? "수입" : "지출"} 내역이 없습니다.</div>
          ) : (
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {/* 그룹 헤더 + 항목 */}
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

      {/* ── 날짜 클릭 팝업 (backdrop 없이) */}
      {selectedDate && selectedItems.length > 0 && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            top: popupPos.top,
            left: Math.min(popupPos.left, window.innerWidth - 320),
            zIndex: 3000,
            width: 290,
            background: "white",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
            border: "1.5px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
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
export default function PartnerDashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "schedule";
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });
  const [projectManageTarget] = useState(location.state?.projectId ?? null);
  const [projectMeetingTarget, setProjectMeetingTarget] = useState(null);
  const currentMilestones = MOCK_MANAGE_PROJECTS.flatMap(p =>
    p.milestones
      .filter(m => m.status === "IN_PROGRESS" || m.status === "PENDING")
      .slice(0, 1)
      .map(m => ({ projectId: p.id, projectTitle: p.title, milestoneTitle: m.title, status: m.status }))
  );

  // 콘텐츠 패널 — 스케줄 탭은 패딩 0 (FullCalendar가 영역 전체 사용)
  const isScheduleTab = activeTab === "schedule";
  const isFreeMeetingTab = activeTab === "free_meeting" || activeTab === "contract_meeting" || activeTab === "project_meeting";
  const isApplicationsTab = activeTab === "apply_active" || activeTab === "apply_done";
  const contractContactId = Number(searchParams.get("contactId") || 1);

  const openContractMeetingFromApply = useCallback((proj) => {
    const next = { tab: "contract_meeting" };
    if (proj?.meetingContactId) next.contactId = String(proj.meetingContactId);
    if (proj?.id) next.projectId = String(proj.id);
    setSearchParams(next, { replace: true });
  }, [setSearchParams]);

  const renderContent = () => {
    if (isScheduleTab) return <ScheduleTab />;
    if (isApplicationsTab) return <ApplicationsTab activeTab={activeTab} onGoContractMeeting={openContractMeetingFromApply} />;
    if (activeTab === "income")   return <IncomeTab />;
    if (activeTab === "guarantee") return <GuaranteeTab />;
    if (activeTab === "interests") return <InterestsTab />;
    if (activeTab === "project_manage") {
      return (
        <ProjectManageTab
          onGoSchedule={() => setActiveTab("schedule")}
          initialSelectedId={projectManageTarget}
          onOpenProjectMeeting={(contactId) => {
            setProjectMeetingTarget(contactId);
            setActiveTab("project_meeting");
          }}
        />
      );
    }
    if (activeTab === "portfolio_add")  return <PortfolioAddTab />;
    if (activeTab === "evaluation")      return <EvaluationTab />;
    if (activeTab === "free_meeting")    return <FreeMeetingTab />;
    if (activeTab === "contract_meeting") return <ContractMeetingTab initialContactId={contractContactId} />;
    if (activeTab === "project_meeting") return <ProjectMeetingTab initialContactId={projectMeetingTarget || 1} />;
    const label = SECTIONS.flatMap(s => s.items).find(i => i.key === activeTab)?.label || "";
    return <ComingSoonDash label={label} />;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: F }}>
      <Header_partner />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ─── 파트너 배너 카드 ─── */}
        <PartnerBannerCard activePage="dashboard" />

        {/* ─── 탭 + 콘텐츠 영역 ─── */}
        <div style={{ display: "flex", gap: 12, alignItems: activeTab === "free_meeting" ? "stretch" : "flex-start", marginLeft: -38, marginRight: -38 }}>

          {/* 왼쪽 컬럼: 사이드바 + 마일스톤 카드 */}
          <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 88, alignSelf: "flex-start" }}>

            {/* 사이드바 */}
            <div style={{ background: "white", borderRadius: 16, padding: "12px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowY: "auto" }}>
              {SECTIONS.map((sec, si) => (
                <div key={si}>
                  {sec.title && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "10px 16px 4px", fontFamily: F, textTransform: "uppercase" }}>
                      {sec.title}
                    </div>
                  )}
                  {sec.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "10px 16px", borderRadius: 10, border: "none",
                        background: activeTab === item.key ? "#EFF6FF" : "transparent",
                        color: activeTab === item.key ? "#3B82F6" : "#475569",
                        fontSize: 14,
                        fontWeight: activeTab === item.key ? 700 : 500,
                        cursor: "pointer", fontFamily: F,
                        transition: "all 0.15s",
                        marginBottom: 2,
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
                      onClick={() => setActiveTab("project_manage")}
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
            padding: (isScheduleTab || isFreeMeetingTab) ? "0" : "32px 36px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            minHeight: (activeTab === "contract_meeting" || activeTab === "project_meeting") ? 900 : activeTab === "free_meeting" ? 760 : 600,
            overflow: (isScheduleTab || activeTab === "free_meeting") ? "hidden" : (activeTab === "contract_meeting" || activeTab === "project_meeting") ? "auto" : "visible",
          }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
