import { nanoid } from 'nanoid';

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  conversationId: string;
}

export interface AiParticipant {
  id: string;
  name: string;
  apiType: 'gemini' | 'openai-compatible';
  apiUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  status: 'online' | 'rate_limited' | 'offline';
  isActive: boolean;
  rateLimitUsage: number;
  lastActive: string;
  icon?: string; // 'bot' | 'cpu' | 'sparkles' | 'zap' | 'code' | 'terminal'
  color?: string; // 'blue' | 'purple' | 'emerald' | 'orange' | 'rose' | 'amber' | 'indigo'
}

export interface Conversation {
  id: string;
  isAutoMode: boolean;
  maxAutoRounds: number;
  currentRounds: number;
  responseDelay: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  MESSAGES: 'ai_hub_messages',
  PARTICIPANTS: 'ai_hub_participants',
  CONVERSATIONS: 'ai_hub_conversations',
};

// Default AI participants to show initially
const DEFAULT_PARTICIPANTS: AiParticipant[] = [
  {
    id: 'default-gemini',
    name: 'Gemini AI',
    apiType: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    model: 'gemini-2.5-flash',
    systemPrompt: 'You are Gemini AI participating in a group conversation with other AIs and a human user. Keep responses conversational, insightful, and engaging. Build on what others have said.',
    status: 'online',
    isActive: true,
    rateLimitUsage: 0,
    lastActive: new Date().toISOString(),
    icon: 'bot',
    color: 'blue',
  },
  {
    id: 'default-groq',
    name: 'Groq AI (Llama)',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.groq.com/openai/v1',
    apiKey: localStorage.getItem('groq_api_key') || '',
    model: 'llama-3.3-70b-versatile',
    systemPrompt: 'You are Groq AI, known for fast processing. You are in a group chat with Gemini AI, local models, and a human user. Keep responses efficient, direct, and rapid.',
    status: 'online',
    isActive: true,
    rateLimitUsage: 0,
    lastActive: new Date().toISOString(),
    icon: 'zap',
    color: 'orange',
  },
];

export const storage = {
  // --- Conversations ---
  getConversations(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  },

  getConversation(id: string): Conversation | null {
    const list = this.getConversations();
    return list.find(c => c.id === id) || null;
  },

  createConversation(id = nanoid()): Conversation {
    const newConv: Conversation = {
      id,
      isAutoMode: false,
      maxAutoRounds: 10,
      currentRounds: 0,
      responseDelay: 3,
      createdAt: new Date().toISOString(),
    };
    const list = this.getConversations();
    list.push(newConv);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list));
    return newConv;
  },

  updateConversation(id: string, updates: Partial<Conversation>): Conversation {
    const list = this.getConversations();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) {
      // Auto create if not exists
      const newConv = this.createConversation(id);
      return this.updateConversation(newConv.id, updates);
    }
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(list));
    return updated;
  },

  // --- Messages ---
  getMessages(conversationId: string): Message[] {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const list: Message[] = data ? JSON.parse(data) : [];
    return list.filter(m => m.conversationId === conversationId);
  },

  createMessage(msg: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMsg: Message = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...msg,
    };
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const list: Message[] = data ? JSON.parse(data) : [];
    list.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(list));
    return newMsg;
  },

  clearMessages(conversationId: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const list: Message[] = data ? JSON.parse(data) : [];
    const filtered = list.filter(m => m.conversationId !== conversationId);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filtered));
  },

  // --- AI Participants ---
  getAiParticipants(): AiParticipant[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (!data) {
      // Seed initial default models
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
      return DEFAULT_PARTICIPANTS;
    }
    return JSON.parse(data);
  },

  saveAiParticipants(participants: AiParticipant[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  },

  addAiParticipant(participant: Omit<AiParticipant, 'id' | 'status' | 'rateLimitUsage' | 'lastActive'>): AiParticipant {
    const newAi: AiParticipant = {
      id: nanoid(),
      status: 'online',
      rateLimitUsage: 0,
      lastActive: new Date().toISOString(),
      ...participant,
    };
    const list = this.getAiParticipants();
    list.push(newAi);
    this.saveAiParticipants(list);
    return newAi;
  },

  updateAiParticipant(id: string, updates: Partial<AiParticipant>): AiParticipant {
    const list = this.getAiParticipants();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error(`AI Participant with ID ${id} not found.`);
    }
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.saveAiParticipants(list);
    return updated;
  },

  deleteAiParticipant(id: string): void {
    const list = this.getAiParticipants();
    const filtered = list.filter(p => p.id !== id);
    this.saveAiParticipants(filtered);
  },
};
