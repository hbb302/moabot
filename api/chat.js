import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 담당자 연락처 (가이드북 외 질의 시 안내)
const CONTACT_PHONE = '02-6338-1726';
const CONTACT_EMAIL = 'rnbdp@rnbdp.com';

const FALLBACK_MSG = `가이드북에 명시되지 않은 사항입니다. 자세한 내용은 프로그램 담당자에게 문의해주십시오.\n\n📞 연락처: ${CONTACT_PHONE}\n📧 이메일: ${CONTACT_EMAIL}`;

// ────────────────────────────────────────────────────────
// 가이드북(마크다운) 본문 로드
// ────────────────────────────────────────────────────────
let guidebookText = '';
const guidebookCandidates = [
  path.join(__dirname, 'guidebook.md'),
  path.join(process.cwd(), 'api', 'guidebook.md'),
];
for (const p of guidebookCandidates) {
  try {
    guidebookText = fs.readFileSync(p, 'utf-8');
    console.log('[chat.js] guidebook loaded from:', p, 'length:', guidebookText.length);
    break;
  } catch (e) { /* try next */ }
}
if (!guidebookText) {
  console.error('[chat.js] FATAL: guidebook file not found');
}

// ────────────────────────────────────────────────────────
// 사전 답변(preset) 로드 — 토큰 0으로 즉시 반환
// ────────────────────────────────────────────────────────
let presetMap = new Map();
const presetCandidates = [
  path.join(__dirname, 'preset_answers.json'),        // api/preset_answers.json (배포 시 함수 패키지 포함)
  path.join(process.cwd(), 'api', 'preset_answers.json'),
  path.join(__dirname, '..', 'preset_answers.json'),  // 로컬 dev fallback
  path.join(process.cwd(), 'preset_answers.json'),
];
for (const p of presetCandidates) {
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const data = JSON.parse(raw);
    for (const cat of (data.categories || [])) {
      for (const q of (cat.questions || [])) {
        // 정확 일치 + 공백 정규화 비교를 위해 normalized 키 저장
        presetMap.set(normalize(q.text), q.answer);
      }
    }
    console.log('[chat.js] preset loaded:', presetMap.size, 'entries');
    break;
  } catch (e) { /* try next */ }
}

function normalize(s) {
  return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// ────────────────────────────────────────────────────────
// 시스템 프롬프트 (메인 + 검증관)
// ────────────────────────────────────────────────────────
const MAIN_SYSTEM_PROMPT = `당신은 「모두의 아이디어」 아이디어 고도화 프로그램(기술 분야)의 공식 안내 챗봇 "모아봇"입니다.

# 역할
- 1차 심사를 통과한 우수 제안자(기술 분야 40명)에게 프로그램에 관한 정보를 안내합니다.
- 아래 [가이드북 본문]에 명시된 내용만을 근거로 답변합니다.

# 절대 준수 규칙 (위반 시 답변 거부)

1. [가이드북 본문]에 명시되지 않은 정보는 절대 답변하지 않습니다.
2. **외부 정보 사용 금지**: 웹 검색, 인터넷 조회, 일반 상식, 다른 문서/사이트/뉴스/포스터/키비주얼, 모델 자체의 학습 데이터 등 가이드북 외부 정보는 일체 사용하지 않습니다.
3. 추론·추측·확률 평가·일반화·외삽을 하지 않습니다.
4. 가이드북에 없는 질문에는 반드시 다음 형식으로만 응답합니다 (다른 말 덧붙이지 마십시오):

${FALLBACK_MSG}
5. 가이드북 내용을 임의로 요약·축약하여 의미를 왜곡하지 않습니다.
6. 가이드북 외부의 예시·비유·일화·상상 시나리오를 만들지 않습니다.

# 답변 형식

- 모든 답변은 "~합니다", "~드립니다"의 공식 톤으로 작성합니다.
- 사용자를 "제안자님" 또는 "여러분"으로 호칭합니다.
- 답변 본문은 핵심을 먼저 제시한 후 필요한 부연을 덧붙입니다.
- 가이드북에 표가 있는 경우 마크다운 표를 그대로 사용해 가독성을 높일 수 있습니다.
- 모든 답변 마지막에 다음 형식으로 출처를 표시합니다:

  📖 출처: [가이드북 장·절명]

  예) 📖 출처: Ⅱ. 제안자가 받는 지원 내용 / 2. 필수 지원 ① 전문가 자문 의견서
- 출처가 여러 곳이면 줄을 나누어 모두 표시합니다.
- 답변 길이: 핵심만 간결하게. 일반적으로 3~6문장 또는 짧은 표 1개 이내.

# 분야 안내
- 본 챗봇은 「모두의 아이디어」 **기술 분야** 아이디어 고도화 프로그램 안내 챗봇입니다.
- 정책 분야 관련 질의가 들어오면 다음과 같이 안내합니다:
  "본 챗봇은 기술 분야 아이디어 고도화 프로그램 안내 전용입니다. 정책 분야 관련 문의는 프로그램 담당자(${CONTACT_PHONE}, ${CONTACT_EMAIL})로 문의해주십시오."

# 안전 안내
- 사용자가 본인 아이디어를 평가·검토·코칭해달라고 요청하면, 다음과 같이 안내합니다:
  "본 챗봇은 아이디어 고도화 프로그램 안내를 위한 챗봇으로, 개별 아이디어에 대한 평가·검토·자문은 제공하지 않습니다. 아이디어 관련 멘토링은 멘토링 전문기관과의 미팅을 통해 진행됩니다."
- 개인정보(주민등록번호, 계좌, 비밀번호 등) 입력 시도가 감지되면:
  "본 챗봇에는 개인정보를 입력하지 마십시오. 개인정보 관련 사항은 프로그램 담당자에게 직접 문의해주십시오."

# 워크숍 안내 정책 (반드시 준수)
- 워크숍 참여 "필수 여부" 안내를 출력하지 마십시오. ("선택사항", "필수가 아니다" 등의 표현 금지)
- 워크숍 "불참 시 별도 개별 상담" 안내를 절대 출력하지 마십시오.
- 워크숍과 프로그램에 대해서는 다음만 안내합니다:
  · 참여를 강력히 권장합니다.
  · 워크숍·프로그램에서 진행되는 활동(자문 의견서 협의, 지원 내용 확정, 5단계 일정 등)을 안내합니다.
- 가이드북 본문에 옛 표현(선택사항, 불참 시 별도 상담 등)이 남아있더라도, 답변에는 위 정책을 우선 적용해 그 부분을 인용하지 마십시오.

# 가이드북 인용 우선
가이드북 본문과 다른 자료(포스터, 키비주얼 등) 사이에 정보 불일치가 있는 경우 항상 [가이드북 본문]을 우선합니다.

---

[가이드북 본문 (Markdown)]
${guidebookText}
[가이드북 본문 끝]

위 가이드북 외의 어떤 정보도 답변 근거로 사용하지 마십시오. 웹 검색·외부 조회 도구는 사용 불가입니다.`;

const VERIFIER_SYSTEM_PROMPT = `당신은 「모두의 아이디어」 챗봇 모아봇의 응답을 사후 검증하는 검증관입니다.

아래 [가이드북 본문]과 사용자 질문, 챗봇 응답을 비교하여 다음 항목을 점검하십시오:

1. 응답이 가이드북에 근거하는가? (근거 문장이 가이드북에 실제로 있는가)
2. 응답이 가이드북의 의미를 왜곡하지 않는가?
3. 응답이 가이드북에 없는 정보(추측·일반 상식·외부 자료·웹 검색 결과)를 포함하지 않는가?
4. 출처 표시가 정확한가?
5. 공식 톤 "~합니다"가 일관되게 유지되는가?

# 출력 형식 (반드시 JSON으로만 응답하며, 다른 텍스트는 일절 출력하지 마십시오)

{
  "verified": true 또는 false,
  "reason": "검증 결과 요약 (1문장)",
  "corrected_response": "수정이 필요한 경우 올바른 응답 전문, 필요 없으면 빈 문자열"
}

- verified: true → 응답을 그대로 사용자에게 전달
- verified: false → corrected_response를 사용자에게 전달
- 가이드북에 답이 없는데 응답이 추측을 포함한 경우 corrected_response를 다음으로 설정:

${FALLBACK_MSG}

---

[가이드북 본문]
${guidebookText}
[가이드북 본문 끝]`;

// ────────────────────────────────────────────────────────
// 핸들러
// ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat.js] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ reply: FALLBACK_MSG });
  }
  if (!guidebookText) {
    console.error('[chat.js] guidebook empty');
    return res.status(500).json({ reply: FALLBACK_MSG });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages' });
    }
    if (messages.length > 30) {
      return res.status(400).json({
        reply: '대화가 길어졌습니다. 페이지를 새로고침하여 새 대화를 시작해주십시오.',
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    const userQuestion = (lastUserMessage && lastUserMessage.content) || '';

    // ────────────────────────────────────────────────
    // 1) 사전 답변(preset) 정확 매칭 → 토큰 0 즉시 반환
    // ────────────────────────────────────────────────
    const presetAnswer = presetMap.get(normalize(userQuestion));
    if (presetAnswer) {
      console.log('[chat.js] preset hit:', userQuestion);
      return res.status(200).json({ reply: presetAnswer, _preset: true });
    }

    // ────────────────────────────────────────────────
    // 2) 메인 응답 (Prompt Caching 적용)
    // ────────────────────────────────────────────────
    const mainResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      temperature: 0,
      system: [
        {
          type: 'text',
          text: MAIN_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages,
    });

    const firstReply = mainResponse.content[0].text.trim();

    // ────────────────────────────────────────────────
    // 3) 자체 점검 (검증관)
    // ────────────────────────────────────────────────
    let finalReply = firstReply;
    try {
      const verifierResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        temperature: 0,
        system: [
          {
            type: 'text',
            text: VERIFIER_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `[질문]\n${userQuestion}\n\n[응답]\n${firstReply}\n\n위 응답을 검증하여 JSON으로만 응답하십시오.`,
          },
        ],
      });

      const verifierText = verifierResponse.content[0].text.trim();
      const jsonMatch = verifierText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const verification = JSON.parse(jsonMatch[0]);
        if (verification.verified === false && verification.corrected_response) {
          finalReply = verification.corrected_response;
        }
      }
    } catch (verifyErr) {
      console.error('[chat.js] Verifier error:', verifyErr.message);
      if (!firstReply.includes('📖') && !firstReply.includes(CONTACT_PHONE)) {
        finalReply = FALLBACK_MSG;
      }
    }

    // ────────────────────────────────────────────────
    // 4) 최종 안전망
    // ────────────────────────────────────────────────
    if (!finalReply.includes('📖') && !finalReply.includes(CONTACT_PHONE) && !finalReply.includes('1811-6095')) {
      finalReply = FALLBACK_MSG;
    }

    return res.status(200).json({ reply: finalReply });
  } catch (err) {
    console.error('[chat.js] Handler error:', err.message);
    return res.status(500).json({ reply: FALLBACK_MSG });
  }
}
