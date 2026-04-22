/**
 * 백엔드 AI 프록시 호출.
 * Gemini API 키는 백엔드에만 존재하므로 브라우저에는 절대 노출되지 않는다.
 *
 * @param {Array<{role: "user"|"bot", text: string}>} messages - 화면에서 쓰는 메시지 배열
 * @param {string} systemInstruction - 페이지별 역할 프롬프트
 * @returns {Promise<string>} Gemini의 답변 텍스트
 */
export async function chatWithAI(messages, systemInstruction) {
  // 화면용 role("bot") → Gemini용 role("model") 변환
  const history = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    text: m.text,
  }));

  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI 요청 실패 (${res.status})`);
  }

  const data = await res.json();
  return data.reply;
}

/**
 * 백엔드 /api/ai/extract 엔드포인트 호출 (JSON 전용 / responseMimeType=application/json).
 * @param {string} systemInstruction - 시스템 지시문
 * @param {string} text - 분석할 원본 텍스트
 * @returns {Promise<string>} JSON 포맷 문자열
 */
export async function extractWithAI(systemInstruction, text) {
  const res = await fetch("/api/ai/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI 요청 실패 (${res.status})`);
  }

  const data = await res.json();
  return data.reply;
}
