# 모아봇 — 「모두의 아이디어」 아이디어 고도화 프로그램 안내 챗봇 (기술 분야)

> 2026년 「모두의 아이디어」 1차 심사 통과 제안자(기술 분야 40명) 대상 안내 챗봇.
> 가이드북 버전: 260528

**서비스 URL**: https://moabot.vercel.app
**저장소**: https://github.com/hbb302/moabot

---

## 폴더 구조

```
moabot/
├── index.html                  ← 챗봇 UI (풀스크린 단일 페이지)
├── api/
│   ├── chat.js                 ← Vercel Serverless Function (Claude API 프록시)
│   ├── guidebook.md            ← 가이드북 본문 (마크다운, 시스템 프롬프트 원재료)
│   └── preset_answers.json     ← 사전 답변 (chat.js 런타임용 사본)
├── preset_answers.json         ← 사전 답변 (UI 정적 fetch용 원본)
├── vercel.json                 ← 배포 설정 + 보안 헤더
├── package.json                ← 의존성 (@anthropic-ai/sdk)
├── .gitignore
├── README.md                   ← 본 파일
├── deploy_guide.md             ← 비개발자용 10단계 배포 가이드
├── test_checklist.md           ← 52개 항목 검증 체크리스트
│
├── qr/                         ← QR 코드 6종 (포스터·디지털용)
│   ├── moabot_QR_인쇄용_2026-05-28.png         (1640×1640, 검정)
│   ├── moabot_QR_브랜드보라_2026-05-28.png     (1640×1640, 보라)
│   ├── moabot_QR_웹용_2026-05-28.png           (615×615, 검정)
│   ├── moabot_QR_로고삽입_검정_2026-05-28.png  (1640×1640, 로고 포함)
│   ├── moabot_QR_로고삽입_보라_2026-05-28.png  (1640×1640, 로고 포함)
│   └── moabot_QR_로고삽입_안전_2026-05-28.png  (1640×1640, 작은 로고)
│
└── docs/                       ← 설계·내부 문서 (git ignore, 로컬 전용)
    ├── design_tokens.md
    ├── system_prompt.md
    └── guidebook_diff_260528.md
```

---

## 주요 특징

### 1. 할루시네이션 5중 방어

1. 가이드북 마크다운 전문을 시스템 프롬프트에 삽입 (RAG 없이 컨텍스트 전체 보유)
2. 절대 준수 규칙 (가이드북 외 정보 금지·추측 금지·웹검색 금지)
3. 출처 표시 의무화 (모든 답변에 가이드북 장·절 표기)
4. `temperature=0`
5. 응답 후 자체 점검 (검증관 모델이 JSON으로 verified 판정)

### 2. 고정 질문 즉시 응답 (토큰 0)

- 5개 카테고리 × 3개 = **15개 고정 질문**
- 사용자가 추천 버튼 클릭 또는 정확 일치 입력 시 **모델 호출 없이 0.6~0.9초** 응답
- 자유 질문만 모델 호출 (Haiku 4.5, 5초 내외)

### 3. 모델·비용

- **Claude Haiku 4.5** + Prompt Caching
- 시스템 프롬프트 17K 토큰 (Haiku 200K 컨텍스트의 8.5% 점유)
- 캐시 적중 1회 약 30원, 캐시 쓰기 약 60원
- $25 충전으로 5,000~8,000회 질문 처리 가능

### 4. 디자인

- 모바일 우선 (QR 진입 가정)
- 풀스크린 단일 페이지
- 보라 그라데이션 헤더 (코랄→핑크→보라→딥퍼플, 키비주얼에서 추출)
- 카테고리별 그룹화 추천 질문 UI

---

## 배포

비개발자용 단계별 가이드: [`deploy_guide.md`](deploy_guide.md)

요약:
1. console.anthropic.com에서 API 키 발급 + 크레딧 충전
2. GitHub에 본 폴더 업로드
3. Vercel에서 GitHub 연동 → 환경변수 `ANTHROPIC_API_KEY` 등록
4. 자동 배포 → URL 확인 → `qr/` 폴더의 QR 코드를 포스터에 첨부

---

## 환경변수

| 이름 | 설명 | 필수 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console에서 발급한 API 키 | ✅ 필수 |

---

## 로컬 테스트

```bash
npm install
npm install -g vercel
vercel dev
# http://localhost:3000 접속
```

`.env.local` 파일에 `ANTHROPIC_API_KEY=sk-ant-...` 추가 필요.

---

## 운영 비용

- Vercel 무료 플랜 (정적 호스팅 + Serverless Function 한도 내)
- Claude API: 사용량 기반 (예상 1,000회 질문 기준 3~5만원)
- 행사 종료 후 Vercel 프로젝트 삭제 + API 키 폐기 → 추가 비용 0원

---

## 검증

배포 완료 후 [`test_checklist.md`](test_checklist.md)의 **52개 항목** 검증.

핵심 필수 통과 항목 8개:
1. 함정 질문 차단 (가이드북 외 정보 거부)
2. 출처 표시 의무
3. 자체 점검 동작
4. 추측 차단
5. 정책 분야 차단
6. 개인정보 차단
7. 회로 설계 차단 (260528 카테고리 삭제 반영)
8. 환영 메시지 신규 명칭 사용

---

## 데이터 관리 메모

### preset_answers.json 동기화 (중요)
사전 답변 수정 시 **두 곳 모두 수정 필요**:
- `preset_answers.json` (루트, UI fetch용)
- `api/preset_answers.json` (chat.js 런타임용)

방법:
```bash
cp preset_answers.json api/preset_answers.json
git add preset_answers.json api/preset_answers.json
git commit -m "update preset answers"
git push
```

### 가이드북 갱신
신규 가이드북 docx 수령 시:
1. `docs/guidebook_diff_*.md` 작성 (v→v+1 변경점 분석)
2. `api/guidebook.md` 새 마크다운으로 교체
3. 챗봇 응답에 영향 있는 변경(명칭·카테고리 등)이 있으면 `preset_answers.json` 함께 수정

---

## 분야

본 챗봇은 **기술 분야 전용**입니다. 정책 분야 챗봇은 별도 인스턴스로 구축 예정.

## 문의

프로그램 담당: **02-6338-1726** · **rnbdp@rnbdp.com**
