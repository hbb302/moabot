# 모아봇 배포 가이드 (비개발자용)

> 코드 한 줄도 안 만지고 모아봇을 인터넷에 배포해서 QR 코드까지 만드는 전체 과정입니다.
> 예상 소요 시간: 처음 하시면 **40분 ~ 1시간**, 익숙해지면 15분.
> 예상 비용: 처음 한 번 신용카드 등록 시 $5 충전 (약 7,000원). 행사 종료까지 이걸로 충분.

---

## 전체 흐름 (10단계)

```
1. Anthropic 가입 → 2. API 키 발급 → 3. 크레딧 충전
4. GitHub 가입 → 5. 새 저장소 생성 → 6. 폴더 업로드
7. Vercel 가입 → 8. 저장소 연결 → 9. 환경변수 등록 → 10. QR 코드 생성
```

---

## 1단계. Anthropic 콘솔 가입

**왜?** 모아봇의 두뇌인 Claude를 사용하려면 Anthropic 계정과 API 키가 필요합니다.

**방법**
1. 웹브라우저로 https://console.anthropic.com 접속
2. 우측 상단 "Sign Up" 클릭
3. 이메일 + 비밀번호 또는 Google 계정으로 가입
4. 가입 후 이메일 인증 (받은 메일에서 링크 클릭)

---

## 2단계. API 키 발급

**방법**
1. 콘솔 로그인 후 좌측 메뉴에서 **"API Keys"** 클릭
2. 우측 상단 **"Create Key"** 버튼 클릭
3. Key Name 입력란에 `모아봇` 입력 → "Create Key" 클릭
4. **나타난 키 전체를 메모장에 복사 저장** (sk-ant-api03-... 로 시작하는 긴 문자열)
   - ⚠️ **이 키는 창을 닫으면 다시 볼 수 없습니다.** 반드시 안전한 곳에 저장.
5. "Done" 클릭

> **보안 주의**: 이 키는 비밀번호와 같습니다. 절대 깃허브에 직접 올리거나 누구에게 공유하지 마십시오. 본 가이드 9단계에서 Vercel 환경변수로 안전하게 등록합니다.

---

## 3단계. 크레딧 충전 (신용카드 등록)

**왜?** Anthropic API는 사용량만큼 결제하는 방식입니다. 최소 $5(약 7,000원)를 미리 충전해두면 됩니다.

**방법**
1. 좌측 메뉴 **"Plans & Billing"** 또는 **"Billing"** 클릭
2. **"Add payment method"** 클릭 → 신용/체크카드 정보 등록 (해외 결제 가능 카드)
3. **"Buy credits"** 또는 자동 충전(Auto-reload) 설정
   - 권장: $5 ~ $10 한 번 충전 (행사 기간 전체 충당 가능)
4. 사용량 한도(Spend Limit) 설정 권장:
   - "Usage Limits" → 월 한도 예: $30 설정 → 폭주 시 자동 차단

---

## 4단계. GitHub 가입 (또는 로그인)

**왜?** Vercel은 GitHub 저장소를 자동 배포하는 서비스입니다.

**방법**
1. https://github.com 접속 → "Sign up" 클릭
2. 이메일 + 사용자명 + 비밀번호 입력하여 가입
3. 이메일 인증 완료

이미 GitHub 계정이 있으면 4단계 건너뛰기.

---

## 5단계. 새 저장소 생성

**방법**
1. GitHub 로그인 후 우측 상단 **"+"** 아이콘 → **"New repository"** 클릭
2. Repository name: `moabot` 입력
3. Description (선택): `모두의 아이디어 멘토링 안내 챗봇`
4. **Public** 선택 (Vercel 무료 플랜 호환)
5. 다른 옵션은 그대로 두고 하단 **"Create repository"** 클릭

---

## 6단계. moabot 폴더 GitHub 업로드 (드래그앤드롭)

**방법**
1. 5단계에서 만든 저장소 화면에서 **"uploading an existing file"** 링크 클릭
   - 또는 "Add file" → "Upload files"
2. PC에서 `moabot` 폴더를 열어 **모든 파일과 하위 폴더(api 폴더 포함)를 드래그**해서 GitHub 화면에 놓기
   - 업로드할 파일 목록:
     - `index.html`
     - `guidebook_text.txt`
     - `api/chat.js`
     - `vercel.json`
     - `package.json`
     - `suggested_questions.json`
     - `.gitignore`
     - `README.md`
3. 화면 하단 **"Commit changes"** 클릭 (코멘트는 그대로 두면 됨)

업로드가 완료되면 저장소 화면에 8개 파일과 api 폴더가 표시됩니다.

---

## 7단계. Vercel 가입 (GitHub 연동)

**방법**
1. https://vercel.com 접속
2. **"Sign Up"** 클릭 → **"Continue with GitHub"** 선택
3. GitHub 권한 승인 (Authorize Vercel)
4. 가입 완료 후 대시보드 진입

---

## 8단계. moabot 저장소 임포트

**방법**
1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. 좌측 "Import Git Repository" 목록에서 `moabot` 저장소 우측 **"Import"** 버튼 클릭
   - 목록에 안 보이면 "Adjust GitHub App Permissions"로 권한 추가
3. **Framework Preset**: "Other" 자동 인식 (그대로 둠)
4. **Root Directory**: 그대로 `.`
5. **아직 "Deploy" 누르지 말기!** 다음 9단계 먼저 진행.

---

## 9단계. 환경변수 등록 (가장 중요)

**왜?** API 키를 코드에 직접 넣지 않고 Vercel에 안전하게 보관합니다.

**방법**
1. 8단계 화면 하단에서 **"Environment Variables"** 섹션 펼치기
2. **Key** 입력란에: `ANTHROPIC_API_KEY` (정확히 이 이름)
3. **Value** 입력란에: 2단계에서 저장한 API 키 전체 붙여넣기 (sk-ant-...)
4. **"Add"** 버튼 클릭
5. 화면 하단 **"Deploy"** 버튼 클릭

배포가 시작되며 약 1~2분 소요됩니다. 완료되면 **"Congratulations!"** 화면이 나타납니다.

---

## 10단계. URL 확인 + QR 코드 생성

**URL 확인**
1. 배포 완료 화면에서 미리보기 이미지 위의 **URL** 확인 (예: `moabot-xxx.vercel.app`)
2. 그 URL 클릭하여 모아봇 페이지가 정상적으로 열리는지 확인
3. 추천 질문 하나 클릭하여 답변이 잘 나오는지 테스트

**QR 코드 생성** (무료, 회원가입 불필요)
- 옵션 A: 네이버 QR 코드 → https://qr.naver.com (로그인 후 무료, 디자인 옵션 풍부)
- 옵션 B: 무료 사이트 → https://www.qr-code-generator.com 또는 https://qrcode-monkey.com
  1. URL 입력란에 9단계 Vercel URL 붙여넣기
  2. "Generate QR Code" 클릭
  3. **PNG로 다운로드** (인쇄용은 1000×1000 이상 해상도 권장)

**포스터 적용**
- 다운받은 QR 이미지를 행사 안내 포스터 디자인에 첨부
- QR 아래에 안내문 권장: `스마트폰으로 스캔 → 모아봇 챗봇 바로 연결`

---

## (선택) 도메인 변경

Vercel 기본 URL이 `moabot-xxx.vercel.app` 형태라 길게 느껴질 수 있습니다. 무료로 더 짧은 이름으로 바꿀 수 있습니다.

1. Vercel 프로젝트 → **"Settings"** → **"Domains"**
2. **"Edit"** → 원하는 이름 입력 (예: `moabot-2026`)
3. 새 URL `moabot-2026.vercel.app`이 즉시 적용됨
4. 이 URL로 QR 코드 재생성하여 포스터에 첨부

---

## 운영 중 확인 사항

### 비용 모니터링
- 주 1회 https://console.anthropic.com/settings/billing 에서 사용량 확인
- 예상: 6개월간 $5 ~ $30 (7,000원 ~ 40,000원)
- 행사 종료 후: API 키 폐기 (콘솔에서 키 삭제 가능) → 추가 비용 0원

### Vercel 무료 한도
- 월 100GB 대역폭 / 100GB-시간 Serverless 실행 → **40명 사용 규모로는 무료 한도 내 충분**

### 모아봇 사용 통계 확인 (선택)
- Vercel 대시보드 → 프로젝트 → "Analytics" → 방문자 수, API 호출 수 확인 가능

---

## 문제 해결 (자주 발생하는 오류)

### 1. Vercel 배포 후 화면이 안 열림 / 404
- 6단계에서 파일이 빠졌을 수 있음 → GitHub 저장소에 8개 파일 모두 있는지 확인
- `index.html`이 최상위에 있어야 함 (폴더 안에 들어 있으면 안 됨)

### 2. 챗봇이 "일시적으로 응답을 받지 못했습니다" 라고만 나옴
- 9단계 환경변수가 잘못 등록됐을 가능성
- Vercel 프로젝트 → Settings → Environment Variables → `ANTHROPIC_API_KEY` 값 확인
- 키 수정 후 Vercel 대시보드 → Deployments → 최신 항목 우측 "..." → "Redeploy" 클릭

### 3. 모든 답변이 "가이드북에 명시되지 않은 사항입니다..." 로만 나옴
- `guidebook_text.txt` 파일이 GitHub 저장소에 업로드되지 않았을 가능성
- GitHub 저장소에서 `guidebook_text.txt` 클릭하여 본문이 보이는지 확인
- 비어 있거나 깨진 경우 6단계 재업로드

### 4. API 키가 노출됐다고 알림이 옴
- 즉시 https://console.anthropic.com/settings/keys 에서 해당 키 삭제 (Revoke)
- 새 키 발급 → Vercel 환경변수 업데이트 → Redeploy

### 5. 비용이 예상보다 많이 나옴
- console.anthropic.com → Usage Limits에서 월 한도 낮추기
- 또는 API 키 일시 비활성화

---

## 행사 종료 후 (정리)

1. **Anthropic API 키 폐기**: 콘솔 → API Keys → 해당 키 옆 "..." → "Revoke"
2. **Vercel 프로젝트 삭제 (선택)**: 대시보드 → 프로젝트 → Settings → 하단 "Delete Project"
3. **GitHub 저장소는 보관 권장** (재사용 또는 정책 분야 챗봇 복제 시 유용)

---

## 정책 분야 챗봇 추가 배포 시

같은 코드를 재사용하여 정책 분야 챗봇을 만들 수 있습니다.

1. GitHub에서 `moabot` 저장소 → **"Fork"** 또는 새 저장소 생성
2. 정책 분야 매뉴얼을 `guidebook_text.txt`로 대체
3. `index.html`의 헤더 텍스트 "기술 분야 멘토링 안내" → "정책 분야 멘토링 안내"로 수정
4. `api/chat.js`의 "기술 분야" 관련 문구를 "정책 분야"로 수정
5. Vercel에서 새 프로젝트로 임포트 → 같은 API 키 사용 가능

---

## 문의

배포 중 막히는 부분이 있으면 본 가이드에서 어느 단계인지 알려주시면 도와드리겠습니다.
사업 내용 관련 문의는 「모두의 아이디어」 대국민 상담센터 **1811-6095** (평일 09:00~18:00).
