import { AiParticipant, Message } from './storage';

export interface AIResponse {
  content: string;
  error?: string;
}

// Formats message history for the AI, combining it into a clean transcript log
function formatGroupChatPrompt(
  aiName: string,
  systemPrompt: string,
  messages: Message[]
): { systemInstruction: string; userPrompt: string } {
  const log = messages
    .slice(-15) // last 15 messages for context
    .map(msg => {
      const sender = (msg.sender === 'user' || msg.sender === 'You') ? 'User' : msg.sender;
      return `${sender}: ${msg.content}`;
    })
    .join('\n');

  const systemInstruction = `${systemPrompt}

IMPORTANT: You are participating in a group chat with a human user and other AIs.
You are "${aiName}".
The conversation transcript is formatted as "Sender Name: Message".
You must ONLY output your own next message.
Do NOT write dialogue for other participants.
Do NOT prefix your response with your name (do not write "${aiName}: ...").
Speak directly as "${aiName}".`;

  const userPrompt = `Here is the conversation transcript so far:
${log}

Respond as "${aiName}":`;

  return { systemInstruction, userPrompt };
}

// Call Gemini API directly via fetch
async function callGemini(participant: AiParticipant, messages: Message[]): Promise<AIResponse> {
  const { apiKey, model, name, systemPrompt } = participant;
  if (!apiKey) {
    return { content: '', error: `API Key is missing for ${name}` };
  }

  try {
    const { systemInstruction, userPrompt } = formatGroupChatPrompt(name, systemPrompt, messages);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${response.status}`;
      if (response.status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate')) {
        return { content: '', error: 'rate_limited' };
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Empty response from Gemini API');
    }

    // Strip out any duplicate prefix name if generated (e.g. "Gemini AI: Hello" -> "Hello")
    const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const cleanContent = content.replace(new RegExp(`^${escapedName}:\\s*`, 'i'), '').trim();

    return { content: cleanContent };
  } catch (error: any) {
    console.error(`Gemini API error for ${name}:`, error);
    return { content: '', error: error.message || 'Unable to reach Gemini API' };
  }
}

// Call any OpenAI-compatible endpoint (Groq, local Ollama, LM Studio, etc.)
async function callOpenAICompatible(participant: AiParticipant, messages: Message[]): Promise<AIResponse> {
  const { apiUrl, apiKey, model, name, systemPrompt } = participant;
  if (!apiUrl) {
    return { content: '', error: `API URL is missing for ${name}` };
  }

  try {
    const { systemInstruction, userPrompt } = formatGroupChatPrompt(name, systemPrompt, messages);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${response.status}`;
      if (response.status === 429 || errMsg.toLowerCase().includes('rate') || response.statusText.toLowerCase().includes('rate')) {
        return { content: '', error: 'rate_limited' };
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI API');
    }

    // Strip out any duplicate prefix name if generated
    const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const cleanContent = content.replace(new RegExp(`^${escapedName}:\\s*`, 'i'), '').trim();

    return { content: cleanContent };
  } catch (error: any) {
    console.error(`OpenAI compatible API error for ${name}:`, error);
    return { content: '', error: error.message || 'Unable to reach the AI endpoint' };
  }
}

export const aiOrchestrator = {
  async callAI(participant: AiParticipant, messages: Message[]): Promise<AIResponse> {
    if (participant.apiType === 'gemini') {
      return callGemini(participant, messages);
    } else {
      return callOpenAICompatible(participant, messages);
    }
  }
};
