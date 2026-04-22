-- ══════════════════════════════════════════════════════════════════
--  완료된 프로젝트 3개의 계약 세부협의 항목 (PROJECT_MODULES) 시드 데이터
--  project_id : 1104 = Festory
--              1105 = Alpha-Helix
--              1106 = DevBridge Platform
--  모든 항목 상태: 협의완료
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1104  Festory (전국 축제 정보 통합 플랫폼)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO PROJECT_MODULES (project_id, module_key, status, data, last_modifier_id, last_modifier_name)
VALUES
(1104, 'scope',
 '협의완료',
 '{"text":"사용자 위치 기반 축제 추천 시스템, React 프론트엔드 + Node.js 백엔드 + 외부 축제 데이터 연동 API. 지도 기반 UI, 실시간 업데이트, 즐겨찾기 기능 포함."}',
 3024, 'client_hylee'),

(1104, 'deliverable',
 '협의완료',
 '{"text":"GitHub 소스코드 저장소 (main 브랜치), 배포된 웹 서비스 URL, Swagger API 문서, 운영 가이드 PDF, 데이터베이스 ERD 문서."}',
 3024, 'client_hylee'),

(1104, 'schedule',
 '협의완료',
 '{"text":"1단계 기획·설계: 2025.07.01~07.15 / 2단계 프론트엔드 구현: 07.16~08.15 / 3단계 백엔드·API 연동: 08.16~09.20 / 4단계 테스트·배포: 09.21~10.20. 총 16주."}',
 3024, 'client_hylee'),

(1104, 'payment',
 '협의완료',
 '{"text":"총 계약금액 8,000,000원. ① 착수금 2,400,000원 (30% — 계약 체결 시) / ② 중도금 3,200,000원 (40% — 2단계 완료 시) / ③ 잔금 2,400,000원 (30% — 최종 납품 시)."}',
 3024, 'client_hylee'),

(1104, 'revision',
 '협의완료',
 '{"text":"납품 후 14일 이내 발견된 버그 수정 무상 제공. 기능 추가 및 변경은 별도 견적 협의. 디자인 수정 1회 무상 포함. 외부 API 스펙 변경에 의한 재작업은 제외."}',
 3024, 'client_hylee'),

(1104, 'completion',
 '협의완료',
 '{"text":"핵심 기능(위치 기반 추천, 검색, 상세 페이지) 정상 작동. Lighthouse 성능 점수 80점 이상. Chrome / Safari / Firefox 호환성 확인. 회원가입·로그인 시나리오 테스트 통과."}',
 3024, 'client_hylee'),

(1104, 'terms',
 '협의완료',
 '{"text":"개발 완료 후 소스코드 전체 클라이언트 이관. 1개월 무상 유지보수 포함. 외부 API 키(지도·축제DB)는 클라이언트 측 발급 및 적용 책임. 비밀유지 계약 별도 체결."}',
 3024, 'client_hylee')

ON DUPLICATE KEY UPDATE
  status            = VALUES(status),
  data              = VALUES(data),
  last_modifier_id  = VALUES(last_modifier_id),
  last_modifier_name= VALUES(last_modifier_name);


-- ──────────────────────────────────────────────────────────────────
-- 1105  Alpha-Helix (마이크로서비스 아키텍처 설계·구현)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO PROJECT_MODULES (project_id, module_key, status, data, last_modifier_id, last_modifier_name)
VALUES
(1105, 'scope',
 '협의완료',
 '{"text":"마이크로서비스 아키텍처 설계, Docker / Kubernetes 기반 인프라 구성, CI/CD 파이프라인 구축(Jenkins + GitHub Actions), Prometheus·Grafana 모니터링 설정."}',
 3024, 'client_hylee'),

(1105, 'deliverable',
 '협의완료',
 '{"text":"아키텍처 설계 문서 (Draw.io), Docker Compose 및 K8s 매니페스트 파일, Jenkins/GitHub Actions 파이프라인 설정 파일, Grafana 모니터링 대시보드 스냅샷 및 설정."}',
 3024, 'client_hylee'),

(1105, 'schedule',
 '협의완료',
 '{"text":"1단계 아키텍처 설계: 2025.06.01~06.30 / 2단계 인프라 구성: 07.01~08.15 / 3단계 CI/CD 파이프라인: 08.16~09.15 / 4단계 모니터링·최적화: 09.16~10.01. 총 18주."}',
 3024, 'client_hylee'),

(1105, 'payment',
 '협의완료',
 '{"text":"총 계약금액 12,000,000원. ① 착수금 3,600,000원 (30%) / ② 중도금 4,800,000원 (40% — 인프라 구성 완료 시) / ③ 잔금 3,600,000원 (30% — 최종 인수인계 시)."}',
 3024, 'client_hylee'),

(1105, 'revision',
 '협의완료',
 '{"text":"아키텍처 설계 변경 2회 무상 포함. 인프라 버그·장애 수정 30일 무상 지원. 추가 서비스 통합 또는 새 MSA 컴포넌트 추가는 별도 견적. IaC 스크립트 수정은 제한 없음."}',
 3024, 'client_hylee'),

(1105, 'completion',
 '협의완료',
 '{"text":"전체 서비스 컨테이너 정상 기동 확인. 배포 파이프라인 자동화 테스트 전 단계 통과. API 응답시간 P95 500ms 이하. 무중단 롤링 업데이트 시연 완료."}',
 3024, 'client_hylee'),

(1105, 'terms',
 '협의완료',
 '{"text":"AWS 인프라 사용 비용 클라이언트 부담. 운영 환경 접근 권한(IAM 계정) 이관 포함. 3개월 기술 지원 제공 (월 4시간 이내). 장애 대응 핫라인 제공."}',
 3024, 'client_hylee')

ON DUPLICATE KEY UPDATE
  status            = VALUES(status),
  data              = VALUES(data),
  last_modifier_id  = VALUES(last_modifier_id),
  last_modifier_name= VALUES(last_modifier_name);


-- ──────────────────────────────────────────────────────────────────
-- 1106  DevBridge Platform (플랫폼 DB·알고리즘·배포)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO PROJECT_MODULES (project_id, module_key, status, data, last_modifier_id, last_modifier_name)
VALUES
(1106, 'scope',
 '협의완료',
 '{"text":"플랫폼 DB 설계 및 구현 (MySQL), 파트너-클라이언트 매칭 알고리즘 개발, AWS 기반 배포 및 운영 환경 구성, 관리자 콘솔 기능 개발 (사용자·프로젝트 관리)."}',
 3024, 'client_hylee'),

(1106, 'deliverable',
 '협의완료',
 '{"text":"최종 ERD 및 DB 마이그레이션 스크립트, 매칭 알고리즘 소스코드 및 단위 테스트, 배포 설정 파일 (docker-compose, nginx), 관리자 콘솔 URL 및 운영 매뉴얼."}',
 3024, 'client_hylee'),

(1106, 'schedule',
 '협의완료',
 '{"text":"1단계 DB 설계: 2025.05.01~05.31 / 2단계 알고리즘 개발: 06.01~07.15 / 3단계 배포 구성: 07.16~08.31 / 4단계 관리자 콘솔: 09.01~09.30. 총 22주."}',
 3024, 'client_hylee'),

(1106, 'payment',
 '협의완료',
 '{"text":"총 계약금액 15,000,000원. ① 착수금 4,500,000원 (30%) / ② 중도금 6,000,000원 (40% — 알고리즘 개발 완료 시) / ③ 잔금 4,500,000원 (30% — 최종 배포 완료 시)."}',
 3024, 'client_hylee'),

(1106, 'revision',
 '협의완료',
 '{"text":"DB 스키마 변경 3회 무상 포함 (단, 데이터 마이그레이션 포함 시 1회로 산정). 매칭 알고리즘 파라미터 조정 횟수 제한 없음. 관리자 UI 수정은 별도 협의."}',
 3024, 'client_hylee'),

(1106, 'completion',
 '협의완료',
 '{"text":"전체 API 엔드포인트 통합 테스트 통과. 매칭 알고리즘 정확도 85% 이상 (테스트 데이터셋 기준). 스테이징·프로덕션 환경 배포 완료. 관리자 콘솔 주요 기능 시연 완료."}',
 3024, 'client_hylee'),

(1106, 'terms',
 '협의완료',
 '{"text":"플랫폼 특성상 지속적 기능 개선 우선 협의 권리 부여. 소스코드 GitHub 이관 및 배포 인수인계 포함. 향후 1년간 유료 유지보수 계약 우선 협상권 제공."}',
 3024, 'client_hylee')

ON DUPLICATE KEY UPDATE
  status            = VALUES(status),
  data              = VALUES(data),
  last_modifier_id  = VALUES(last_modifier_id),
  last_modifier_name= VALUES(last_modifier_name);
