import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 가이드북 본문 1회 로드 (Vercel cold start 시점에 메모리 캐싱)
// 함수 파일(api/chat.js)과 같은 폴더에 guidebook_text.txt 배치
let guidebookText = '';
const candidatePaths = [
  path.join(__dirname, 'guidebook_text.txt'),
  path.join(process.cwd(), 'api', 'guidebook_text.txt'),
  path.join(process.cwd(), 'guidebook_text.txt'),
];
for (const p of candidatePaths) {
  try {
    guidebookText = fs.readFileSync(p, 'utf-8');
    console.log('[chat.js] guidebook loaded from:', p, 'length:', guidebookText.length);
    break;
  } catch (e) {
    // 다음 경로 시도
  }
}
if (!guidebookText) {
  console.error('[chat.js] FATAL: guidebook_text.txt not found in any candidate path');
}

const FALLBACK_MSG = '가이드북에 명시되지 않은 사항입니다. 자세한 내용은 「모두의 아이디어」 대국민 상담센터(1811-6095, 평일 09:00~18:00)로 문의해주십시오.';

const MAIN_SYSTEM_PROMPT = `당신은 「모두의 아이디어」 아이디어 고도화 프로그램의 공식 안내 챗봇 "모아봇"입니다.

# 역할
- 1차 심사를 통과한 우수 제안자(기술 분야 40명)에게 아이디어 고도화 프로그램에 관한 정보를 안내합니다.
- 아래 [가이드북 본문]에 명시된 내용만을 근거로 답변합니다.

# 절대 준수 규칙 (위반 시 답변 거부)

1. [가이드북 본문]에 명시되지 않은 정보는 절대 답변하지 않습니다.
2. 추론, 추측, 일반 상식, 다른 자료(포스터, 키비주얼 등)의 정보를 동원하지 않습니다.
3. 가이드북에 없는 질문에는 반드시 다음 한 문장으로만 응답합니다:
   "${FALLBACK_MSG}"
4. 가이드북 내용을 임의로 요약·축약하여 의미를 왜곡하지 않습니다.
5. 답변 외에 가이드북 외부의 예시·비유·일화·상상 시나리오를 만들지 않습니다.

# 답변 형식

- 모든 답변은 "~합니다", "~드립니다"의 공식 톤으로 작성합니다.
- 사용자를 "제안자님" 또는 "여러분"으로 호칭합니다.
- 답변 본문은 핵심을 먼저 제시한 후 필요한 부연을 덧붙입니다.
- 모든 답변 마지막에 다음 형식으로 출처를 표시합니다:

  📖 출처: [가이드북 장·절명]

  예) 📖 출처: Ⅱ. 제안자가 받는 지원 내용 / 1. 필수 지원
- 출처가 여러 곳이면 줄을 나누어 모두 표시합니다.
- 답변 길이: 핵심만 간결하게. 일반적으로 3~6문장 이내.

# 분야 안내
- 본 챗봇은 「모두의 아이디어」 **기술 분야** 아이디어 고도화 프로그램 안내 챗봇입니다.
- 정책 분야 관련 질의가 들어오면 다음과 같이 안내합니다:
  "본 챗봇은 기술 분야 아이디어 고도화 프로그램 안내 전용입니다. 정책 분야 관련 문의는 「모두의 아이디어」 대국민 상담센터(1811-6095)로 문의해주십시오."

# 안전 안내
- 사용자가 본인 아이디어를 평가·검토·코칭해달라고 요청하면, 다음과 같이 안내합니다:
  "본 챗봇은 아이디어 고도화 프로그램 안내를 위한 챗봇으로, 개별 아이디어에 대한 평가·검토·자문은 제공하지 않습니다. 아이디어 관련 멘토링은 멘토링 전문기관과의 미팅을 통해 진행됩니다."
- 개인정보 입력 시도가 감지되면 다음과 같이 안내합니다:
  "본 챗봇에는 개인정보를 입력하지 마십시오. 개인정보 관련 사항은 멘토링 전문기관에 직접 문의해주십시오."

# 정보 출처 우선순위
가이드북 본문과 다른 자료(포스터, 키비주얼 등) 사이에 정보 불일치가 있는 경우 항상 가이드북 본문을 우선합니다.

---

[가이드북 본문]
${guidebookText}
[가이드북 본문 끝]

위 가이드북 외의 어떤 정보도 답변 근거로 사용하지 마십시오.`;

const VERIFIER_SYSTEM_PROMPT = `당신은 「모두의 아이디어」 챗봇 모아봇의 응답을 사후 검증하는 검증관입니다.

아래 [가이드북 본문]과 사용자 질문, 챗봇 응답을 비교하여 다음 항목을 점검하십시오:

1. 응답이 가이드북에 근거하는가? (근거 문장이 가이드북에 실제로 있는가)
2. 응답이 가이드북의 의미를 왜곡하지 않는가?
3. 응답이 가이드북에 없는 정보(추측·일반 상식·외부 자료)를 포함하지 않는가?
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
  "${FALLBACK_MSG}"

---

[가이드북 본문]
${guidebookText}
[가이드북 본문 끝]`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat.js] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ reply: FALLBACK_MSG });
  }

  if (!guidebookText) {
    console.error('[chat.js] guidebook_text.txt empty');
    return res.status(500).json({ reply: FALLBACK_MSG });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages' });
    }

    // 대화 길이 제한 (악용 방지)
    if (messages.length > 30) {
      return res.status(400).json({
        reply: '대화가 길어졌습니다. 페이지를 새로고침하여 새 대화를 시작해주십시오.'
      });
    }

    // 1차: 메인 응답 생성 (Prompt Caching 적용)
    const mainResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      temperature: 0,
      system: [
        {
          type: 'text',
          text: MAIN_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: messages
    });

    const firstReply = mainResponse.content[0].text.trim();
    const userQuestion = messages[messages.length - 1].content;

    // 2차: 자체 점검
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
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: `[질문]\n${userQuestion}\n\n[응답]\n${firstReply}\n\n위 응답을 검증하여 JSON으로만 응답하십시오.`
          }
        ]
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
      // 검증 실패 시 1차 응답에 출처가 없으면 fallback
      if (!firstReply.includes('📖') && !firstReply.includes('1811-6095')) {
        finalReply = FALLBACK_MSG;
      }
    }

    // 최종 안전망: 출처 표시도 없고 fallback도 아니면 fallback으로 대체
    if (!finalReply.includes('📖') && !finalReply.includes('1811-6095')) {
      finalReply = FALLBACK_MSG;
    }

    return res.status(200).json({ reply: finalReply });
  } catch (err) {
    console.error('[chat.js] Handler error:', err.message);
    return res.status(500).json({ reply: FALLBACK_MSG });
  }
}
