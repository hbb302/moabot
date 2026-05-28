# 모아봇 — 「모두의 아이디어」 아이디어 고도화 프로그램 안내 챗봇 (기술 분야)

> 2026년 「모두의 아이디어」 아이디어 고도화 프로그램 1차 심사 통과 제안자(기술 분야 40명) 대상 안내 챗봇.
> 가이드북 버전: 260528 (2026-05-28 수령)

## 폴더 구조

```
moabot/
├── index.html               # 챗봇 UI (풀스크린 단일 페이지)
├── guidebook_text.txt        # 가이드북 본문 (시스템 프롬프트에 삽입됨)
├── api/
│   └── chat.js               # Vercel Serverless Function (Claude API 프록시)
├── vercel.json               # Vercel 배포 설정
├── package.json              # 의존성 정의
├── suggested_questions.json  # 추천 질문 8개 (UI에도 하드코딩됨)
├── .gitignore
└── README.md                 # 본 파일
```

## 주요 특징

- **할루시네이션 5중 방어**:
  1. 가이드북 전문을 시스템 프롬프트에 삽입 (RAG 없이 컨텍스트 전체 보유)
  2. 절대 준수 5규칙 (가이드북 외 정보 금지, 추측 금지 등)
  3. 출처 표시 의무화 (모든 답변에 가이드북 장·절 표기)
  4. temperature=0
  5. 응답 후 자체 점검 (검증관 모델이 JSON으로 verified 판정)

- **공식 톤 "~합니다" 통일**
- **모바일 우선 디자인** (QR 코드 진입 가정)
- **Prompt Caching 적용** (가이드북 캐싱으로 비용 90% 절감)

## 배포

별도 배포 가이드(`deploy_guide.md`) 참조. 요약:
1. console.anthropic.com에서 API 키 발급
2. GitHub에 본 폴더 업로드
3. Vercel에서 GitHub 연동 → 환경변수 `ANTHROPIC_API_KEY` 등록
4. 자동 배포 → URL 확인 → QR 코드 생성

## 환경변수

| 이름 | 설명 | 필수 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console에서 발급한 API 키 | 필수 |

## 로컬 테스트

```bash
npm install
npm install -g vercel
vercel dev
# http://localhost:3000 접속
```

`.env.local` 파일에 `ANTHROPIC_API_KEY=sk-ant-...` 추가 필요.

## 운영 비용

- Vercel 무료 플랜 (정적 호스팅 + Serverless Function 한도 내)
- Claude API: 사용량 기반 (예상 800회 질문 기준 3~5만원)
- 행사 종료 후 Vercel 프로젝트 삭제 + API 키 폐기 → 추가 비용 0원

## 분야

본 챗봇은 **기술 분야** 전용입니다. 정책 분야 챗봇은 별도 인스턴스로 구축 예정.

## 문의

프로그램 담당: **02-6338-1726** · **rnbdp@rnbdp.com**
