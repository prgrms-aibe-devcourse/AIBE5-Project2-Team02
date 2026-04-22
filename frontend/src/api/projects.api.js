/**
 * 프로젝트 관련 API.
 * - 백엔드: ProjectController (/api/projects/**)
 */
import api from './axios';

// 로딩 속도 위해 표시 개수 제한 (DB는 그대로 1000개 유지). 복원하려면 SAMPLE_SIZE를 늘리거나 slice 제거.
const SAMPLE_SIZE = 500;

export const projectsApi = {
  /** 프로젝트 전체 목록 (ProjectSummaryResponse[]) — 프론트 표시는 SAMPLE_SIZE개로 제한 (신규 우선) */
  list: () => api.get('/projects').then((r) => [...r.data].sort((a, b) => b.id - a.id).slice(0, SAMPLE_SIZE)),

  /** 프로젝트 상세 */
  detail: (id) => api.get(`/projects/${id}`).then((r) => r.data),

  /** 특정 username 사용자가 등록한 프로젝트 목록 (채팅 - 상대 프로젝트 카드 보여주기용) */
  byUsername: (username) => api.get(`/projects/by-username/${encodeURIComponent(username)}`).then((r) => r.data),

  /** 프로젝트 등록 (JWT 필수) */
  create: (payload) => api.post('/projects', payload).then((r) => r.data),

  /** 프로젝트 수정 (작성자 본인만, JWT 필수) */
  update: (id, payload) => api.put(`/projects/${id}`, payload).then((r) => r.data),

  /** 프로젝트 삭제 (작성자 본인만, JWT 필수) */
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),

  /** 내가 등록한 프로젝트 목록 (JWT 필수) — 대시보드 '시작 전 프로젝트' 탭용.
   *  status: 단일/배열/콤마 문자열 모두 허용. 예: 'IN_PROGRESS' / ['RECRUITING','IN_PROGRESS'] / 'IN_PROGRESS,COMPLETED' */
  myList: (status) => {
    const params = {};
    if (status) {
      params.status = Array.isArray(status) ? status.join(',') : String(status);
    }
    return api.get('/projects/me', { params }).then((r) => r.data);
  },

  /** 프로젝트 status 만 변경 (작성자 본인만). status: RECRUITING|IN_PROGRESS|COMPLETED|CLOSED */
  updateStatus: (id, status) =>
    api.patch(`/projects/${id}/status`, { status }).then((r) => r.data),
};

