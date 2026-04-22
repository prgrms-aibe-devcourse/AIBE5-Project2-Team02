/**
 * 대시보드용 — "내가 등록한 프로젝트" + 받은 지원자 목록을 합쳐 보여주는 탭 (CLIENT 전용).
 *
 * - GET /api/projects/me?status=...  : 본인이 등록한 프로젝트
 * - GET /api/applications/received   : 본인이 받은 모든 지원
 * - 두 결과를 projectId 기준으로 join하여 "프로젝트 + 지원자 N명" 카드로 노출
 *
 * mode prop 으로 보여줄 status 셋을 결정한다.
 *   - "active"   : RECRUITING/IN_PROGRESS  (지원 받는 중 + 진행 중)
 *   - "accepted" : ACCEPTED/CONTRACTED 지원이 1건 이상인 프로젝트
 *   - "closed"   : COMPLETED/CLOSED       (종료/완료)
 */
import { useEffect, useMemo, useState } from "react";
import { projectsApi, applicationsApi } from "../../api";

const F = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const PRIMARY_GRAD = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)";

const MODE_CONFIG = {
  active: {
    title: "지원받는 프로젝트",
    desc: "현재 모집 중이거나 진행 중인 내 프로젝트입니다.",
    projectStatuses: ["RECRUITING", "IN_PROGRESS"],
    appFilter: () => true,
  },
  accepted: {
    title: "계약 대기 / 계약 중인 프로젝트",
    desc: "지원자를 합격시켜 계약을 진행 중인 프로젝트입니다.",
    projectStatuses: ["RECRUITING", "CLOSED", "IN_PROGRESS"],
    appFilter: (a) => ["ACCEPTED", "CONTRACTED", "IN_PROGRESS"].includes(a.status),
    requireApp: true,
  },
  closed: {
    title: "종료된 프로젝트",
    desc: "완료되었거나 마감된 프로젝트입니다.",
    projectStatuses: ["COMPLETED", "CLOSED"],
    appFilter: () => true,
  },
};

export default function ClientProjectsTab({ mode = "active" }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.active;
  const [projects, setProjects] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      projectsApi.myList(cfg.projectStatuses),
      applicationsApi.receivedList().catch(() => []),
    ])
      .then(([projList, appList]) => {
        setProjects(projList || []);
        setApps(appList || []);
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || "불러오기 실패"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [mode]);

  const handleAction = async (appId, newStatus, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      setBusyId(appId);
      await applicationsApi.updateStatus(appId, newStatus);
      reload();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "상태 변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  /** 모집 완료 — 선택된 ACCEPTED 지원자 1명 확정 + 다른 지원자 자동 REJECTED + project CLOSED. */
  const handleCloseRecruiting = async (project, acceptedApp) => {
    if (!acceptedApp) {
      alert("먼저 합격(ACCEPTED) 처리한 지원자가 있어야 모집 완료할 수 있어요.");
      return;
    }
    const ok = window.confirm(
      `[${project.title}] 모집을 마감하고 [${acceptedApp.partnerName || acceptedApp.partnerUsername}] 님과 계약을 진행할까요?\n다른 지원자는 자동으로 거절 처리됩니다.`
    );
    if (!ok) return;
    try {
      setBusyId(project.id);
      await applicationsApi.closeRecruiting(project.id, acceptedApp.id);
      reload();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "모집 완료 실패");
    } finally {
      setBusyId(null);
    }
  };

  /** 계약 세부협의 미팅 시작 — application 을 CONTRACTED 로 전환 + 미팅 탭 자동 이동 신호. */
  const handleStartContractMeeting = async (project, acceptedApp) => {
    if (!acceptedApp) return;
    try {
      setBusyId(acceptedApp.id);
      await applicationsApi.updateStatus(acceptedApp.id, "CONTRACTED");
      window.dispatchEvent(new CustomEvent("devbridge:start-contract-meeting", {
        detail: { projectId: project.id, applicationId: acceptedApp.id, partner: acceptedApp, project },
      }));
      reload();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "계약 미팅 시작 실패");
    } finally {
      setBusyId(null);
    }
  };

  /** 세부협의 완료 — application IN_PROGRESS + project IN_PROGRESS. 양쪽 진행 대시보드에 등장. */
  const handleFinalizeContract = async (project, acceptedApp) => {
    if (!acceptedApp) return;
    const ok = window.confirm(`[${project.title}] 계약 세부협의를 완료하고 본 프로젝트를 시작할까요?\n양쪽 대시보드의 '진행 프로젝트' 탭에 추가됩니다.`);
    if (!ok) return;
    try {
      setBusyId(acceptedApp.id);
      await applicationsApi.updateStatus(acceptedApp.id, "IN_PROGRESS");
      try {
        await projectsApi.updateStatus(project.id, "IN_PROGRESS");
      } catch (_) { /* projectsApi.updateStatus 가 없거나 실패해도 application 전이는 유지 */ }
      reload();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "세부협의 완료 실패");
    } finally {
      setBusyId(null);
    }
  };

  const cards = useMemo(() => {
    const byProject = new Map();
    for (const p of projects) byProject.set(p.id, { project: p, apps: [] });
    for (const a of apps) {
      if (!cfg.appFilter(a)) continue;
      const slot = byProject.get(a.projectId);
      if (slot) slot.apps.push(a);
    }
    let arr = Array.from(byProject.values());
    if (cfg.requireApp) arr = arr.filter((x) => x.apps.length > 0);
    return arr;
  }, [projects, apps, cfg]);

  return (
    <div>
      <Header title={cfg.title} desc={cfg.desc} />
      {loading && <Empty msg="불러오는 중..." />}
      {!loading && error && <Empty msg={error} tone="error" />}
      {!loading && !error && cards.length === 0 && (
        <Empty msg="해당 단계의 프로젝트가 아직 없어요." />
      )}
      {!loading && !error && cards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cards.map(({ project, apps }) => (
            <ProjectCard
              key={project.id}
              project={project}
              apps={apps}
              busyId={busyId}
              onAction={handleAction}
              onCloseRecruiting={handleCloseRecruiting}
              onStartContractMeeting={handleStartContractMeeting}
              onFinalizeContract={handleFinalizeContract}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ title, desc }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{
        fontSize: 34, fontWeight: 900, margin: "0 0 8px", fontFamily: F,
        background: PRIMARY_GRAD, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", backgroundClip: "text",
        letterSpacing: "-0.5px", lineHeight: 1.2,
      }}>{title}</h1>
      <p style={{ fontSize: 14, color: "#64748B", margin: 0, fontFamily: F, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function Empty({ msg, tone = "neutral" }) {
  const color = tone === "error" ? "#B91C1C" : "#64748B";
  return (
    <div style={{
      padding: "60px 20px", textAlign: "center", color, fontFamily: F, fontSize: 14,
      background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 16,
    }}>{msg}</div>
  );
}

function ProjectCard({ project, apps, busyId, onAction, onCloseRecruiting, onStartContractMeeting, onFinalizeContract }) {
  const tags = Array.isArray(project.tags) ? project.tags : [];
  // 워크플로우 상태 판단
  const acceptedApp = apps.find((a) => a.status === "ACCEPTED") || null;
  const contractedApp = apps.find((a) => a.status === "CONTRACTED") || null;
  const inProgressApp = apps.find((a) => a.status === "IN_PROGRESS") || null;
  const projStatus = project.status;

  // phase: "recruiting_with_accepted" → "ready_for_meeting" → "in_meeting" → "in_progress"
  let phaseAction = null;
  if (projStatus === "RECRUITING" && acceptedApp && !contractedApp && !inProgressApp) {
    phaseAction = {
      label: "✓ 모집 완료",
      gradient: "linear-gradient(135deg, #86EFAC 0%, #4ADE80 50%, #22C55E 100%)",
      shadow: "0 4px 14px rgba(34,197,94,0.35)",
      onClick: () => onCloseRecruiting?.(project, acceptedApp),
      busy: busyId === project.id,
      hint: `${acceptedApp.partnerName || acceptedApp.partnerUsername} 님과 계약 진행`,
    };
  } else if (projStatus === "CLOSED" && acceptedApp && !contractedApp && !inProgressApp) {
    phaseAction = {
      label: "💬 계약 세부협의 미팅 시작",
      gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%)",
      shadow: "0 4px 14px rgba(59,130,246,0.35)",
      onClick: () => onStartContractMeeting?.(project, acceptedApp),
      busy: busyId === acceptedApp.id,
      hint: "계약 세부 협의 미팅으로 이동",
    };
  } else if (contractedApp) {
    phaseAction = {
      label: "✅ 세부협의 완료 → 프로젝트 시작",
      gradient: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #D97706 100%)",
      shadow: "0 4px 14px rgba(245,158,11,0.35)",
      onClick: () => onFinalizeContract?.(project, contractedApp),
      busy: busyId === contractedApp.id,
      hint: "양쪽 진행 프로젝트 대시보드에 등록",
    };
  } else if (inProgressApp) {
    phaseAction = {
      label: "🚀 진행 중인 프로젝트",
      gradient: "linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)",
      shadow: "none",
      onClick: null,
      busy: false,
      hint: "진행 프로젝트 대시보드에서 관리하세요",
      readonly: true,
    };
  }

  return (
    <div style={{
      padding: 22, background: "#fff", border: "1px solid #E2E8F0",
      borderRadius: 16, boxShadow: "0 1px 3px rgba(15,23,42,0.04)", fontFamily: F,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>{project.title}</h3>
        <StatusPill status={project.status} />
      </div>
      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 12px", lineHeight: 1.55 }}>{project.desc || "설명이 등록되지 않았어요."}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {tags.slice(0, 6).map((t, i) => (
          <span key={i} style={{
            padding: "4px 10px", background: "#F1F5F9", borderRadius: 999,
            fontSize: 11, color: "#475569", fontWeight: 500,
          }}>{t.startsWith("#") ? t : `#${t}`}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#64748B", marginBottom: 12 }}>
        {project.price && <span>예상 견적: <b style={{ color: "#0F172A" }}>{project.price}</b></span>}
        {project.period && <span>기간: <b style={{ color: "#0F172A" }}>{project.period}</b></span>}
        {project.deadline && <span>마감: <b style={{ color: "#0F172A" }}>{project.deadline}</b></span>}
      </div>

      {/* 워크플로우 액션 버튼 — 단계별로 색상/문구가 바뀜 */}
      {phaseAction && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "14px 16px", marginBottom: 14, borderRadius: 12,
          background: "#FAFCFF", border: "1px solid #E0E7FF",
        }}>
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
            <span style={{ color: "#1E40AF", fontWeight: 700 }}>다음 단계</span>
            {phaseAction.hint && <span style={{ marginLeft: 8, color: "#64748B" }}>· {phaseAction.hint}</span>}
          </div>
          <button
            onClick={phaseAction.onClick || undefined}
            disabled={phaseAction.busy || phaseAction.readonly}
            style={{
              padding: "10px 22px", borderRadius: 10, border: "none",
              background: phaseAction.gradient, color: phaseAction.readonly ? "#3730A3" : "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F,
              boxShadow: phaseAction.shadow, cursor: phaseAction.readonly ? "default" : (phaseAction.busy ? "not-allowed" : "pointer"),
              opacity: phaseAction.busy ? 0.6 : 1, whiteSpace: "nowrap", letterSpacing: "-0.2px",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            onMouseEnter={(e) => { if (!phaseAction.readonly) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >{phaseAction.busy ? "처리 중…" : phaseAction.label}</button>
        </div>
      )}

      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", marginBottom: 8 }}>
          지원자 {apps.length}명
        </div>
        {apps.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94A3B8" }}>아직 지원자가 없어요.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {apps.slice(0, 5).map((a) => (
              <ApplicantRow key={a.id} app={a} busy={busyId === a.id} onAction={onAction} />
            ))}
            {apps.length > 5 && (
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>+{apps.length - 5}명 더…</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicantRow({ app, busy, onAction }) {
  const statusColor = STATUS_COLOR[app.status] || { bg: "#F1F5F9", color: "#475569" };
  // 상태별 가능한 액션
  const actions = [];
  if (app.status === "APPLIED") {
    actions.push({ label: "합격", to: "ACCEPTED", color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" });
    actions.push({ label: "거절", to: "REJECTED", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", confirm: "이 지원을 거절하시겠어요?" });
  } else if (app.status === "ACCEPTED") {
    actions.push({ label: "계약 체결", to: "CONTRACTED", color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" });
  } else if (app.status === "CONTRACTED") {
    actions.push({ label: "작업 시작", to: "IN_PROGRESS", color: "#854D0E", bg: "#FEF9C3", border: "#FDE68A" });
  } else if (app.status === "IN_PROGRESS") {
    actions.push({ label: "완료 처리", to: "COMPLETED", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1", confirm: "이 지원을 완료 처리하시겠어요?" });
  }

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 8, padding: "8px 10px", background: "#F8FAFC", borderRadius: 8,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>
          {app.partnerName || app.partnerUsername || `파트너 #${app.partnerUserId}`}
        </div>
        {app.message && (
          <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
            {app.message.length > 80 ? app.message.slice(0, 80) + "…" : app.message}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("ko-KR") : ""}
        </span>
        <span style={{
          padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: statusColor.bg, color: statusColor.color,
        }}>{STATUS_LABEL[app.status] || app.status}</span>
        {actions.map((act) => (
          <button
            key={act.to}
            onClick={() => onAction(app.id, act.to, act.confirm)}
            disabled={busy}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: act.bg, color: act.color, border: `1px solid ${act.border}`,
              cursor: busy ? "not-allowed" : "pointer", fontFamily: F,
              opacity: busy ? 0.5 : 1, whiteSpace: "nowrap",
            }}
          >{busy ? "…" : act.label}</button>
        ))}
      </div>
    </div>
  );
}

const STATUS_LABEL = {
  APPLIED: "검토 중",
  ACCEPTED: "합격",
  REJECTED: "불합격",
  CONTRACTED: "계약 완료",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
  WITHDRAWN: "철회됨",
};

const STATUS_COLOR = {
  APPLIED:    { bg: "#EFF6FF", color: "#1D4ED8" },
  ACCEPTED:   { bg: "#F0FDF4", color: "#15803D" },
  REJECTED:   { bg: "#FEF2F2", color: "#B91C1C" },
  CONTRACTED: { bg: "#FFF7ED", color: "#C2410C" },
  IN_PROGRESS:{ bg: "#FEF9C3", color: "#854D0E" },
  COMPLETED:  { bg: "#F1F5F9", color: "#475569" },
  WITHDRAWN:  { bg: "#FEE2E2", color: "#B91C1C" },
};

function StatusPill({ status }) {
  if (!status) return null;
  const map = {
    "모집중":     { bg: "#EFF6FF", color: "#1D4ED8" },
    "진행중":     { bg: "#FEF9C3", color: "#854D0E" },
    "완료":       { bg: "#F1F5F9", color: "#475569" },
    "마감":       { bg: "#FEE2E2", color: "#B91C1C" },
    "RECRUITING": { bg: "#EFF6FF", color: "#1D4ED8" },
    "IN_PROGRESS":{ bg: "#FEF9C3", color: "#854D0E" },
    "COMPLETED":  { bg: "#F1F5F9", color: "#475569" },
    "CLOSED":     { bg: "#FEE2E2", color: "#B91C1C" },
  };
  const c = map[status] || { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, fontFamily: F, whiteSpace: "nowrap",
    }}>{status}</span>
  );
}
