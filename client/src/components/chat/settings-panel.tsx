import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X, Eye, EyeOff, Save, Plus, Edit2, Trash2, ArrowLeft, Bot, Sparkles, Cpu, Download, Upload, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AiParticipant, storage } from '@/lib/storage';

interface AiPreset {
  name: string;
  provider: string;
  category: 'Google Gemini' | 'OpenAI Direct' | 'Anthropic (OpenRouter)' | 'DeepSeek Direct' | 'Groq Cloud' | 'Mistral AI' | 'Local / Offline';
  apiType: 'gemini' | 'openai-compatible';
  apiUrl: string;
  model: string;
  systemPrompt: string;
  apiKeyLink: string;
  icon: string;
  color: string;
}

const AI_PRESETS: AiPreset[] = [
  // --- Google Gemini ---
  {
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'Google Gemini',
    apiType: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
    systemPrompt: 'You are Gemini 2.5 Flash, a fast and smart assistant. Keep responses concise, collaborative, and helpful.',
    apiKeyLink: 'https://aistudio.google.com/',
    icon: 'sparkles',
    color: 'blue'
  },
  {
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    category: 'Google Gemini',
    apiType: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-pro',
    systemPrompt: 'You are Gemini 2.5 Pro, a deep reasoning assistant. Keep responses thoughtful, highly analytical, and clear.',
    apiKeyLink: 'https://aistudio.google.com/',
    icon: 'sparkles',
    color: 'indigo'
  },
  {
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    category: 'Google Gemini',
    apiType: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash',
    systemPrompt: 'You are Gemini 1.5 Flash, a versatile assistant. Keep responses conversational and direct.',
    apiKeyLink: 'https://aistudio.google.com/',
    icon: 'sparkles',
    color: 'blue'
  },
  {
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    category: 'Google Gemini',
    apiType: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-pro',
    systemPrompt: 'You are Gemini 1.5 Pro, an advanced analytical agent. Provide thorough and logical explanations.',
    apiKeyLink: 'https://aistudio.google.com/',
    icon: 'sparkles',
    color: 'indigo'
  },

  // --- OpenAI Direct ---
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'OpenAI Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    systemPrompt: 'You are GPT-4o, a highly capable conversational assistant. Provide structured, accurate, and detailed replies.',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    icon: 'cpu',
    color: 'purple'
  },
  {
    name: 'GPT-4o-mini',
    provider: 'OpenAI',
    category: 'OpenAI Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: 'You are GPT-4o-mini, a fast and cost-efficient assistant. Keep replies focused, brief, and logical.',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    icon: 'cpu',
    color: 'purple'
  },
  {
    name: 'o1-mini',
    provider: 'OpenAI',
    category: 'OpenAI Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.openai.com/v1',
    model: 'o1-mini',
    systemPrompt: 'You are o1-mini, a reasoning assistant. Explain your thought process logically and build on previous messages.',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    icon: 'code',
    color: 'purple'
  },
  {
    name: 'o1-preview',
    provider: 'OpenAI',
    category: 'OpenAI Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.openai.com/v1',
    model: 'o1-preview',
    systemPrompt: 'You are o1-preview, an advanced reasoning model. Approach complex problems step-by-step and write detailed code/explanations.',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    icon: 'code',
    color: 'purple'
  },

  // --- Anthropic via OpenRouter ---
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic via OpenRouter',
    category: 'Anthropic (OpenRouter)',
    apiType: 'openai-compatible',
    apiUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
    systemPrompt: 'You are Claude 3.5 Sonnet, a highly creative and articulate assistant. Keep your responses engaging, eloquent, and build on others ideas.',
    apiKeyLink: 'https://openrouter.ai/keys',
    icon: 'bot',
    color: 'rose'
  },
  {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic via OpenRouter',
    category: 'Anthropic (OpenRouter)',
    apiType: 'openai-compatible',
    apiUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-haiku',
    systemPrompt: 'You are Claude 3.5 Haiku, a quick and clever assistant. Keep your answers direct, lively, and to-the-point.',
    apiKeyLink: 'https://openrouter.ai/keys',
    icon: 'bot',
    color: 'rose'
  },
  {
    name: 'Claude 3 Opus',
    provider: 'Anthropic via OpenRouter',
    category: 'Anthropic (OpenRouter)',
    apiType: 'openai-compatible',
    apiUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3-opus',
    systemPrompt: 'You are Claude 3 Opus, an exceptionally deep and nuanced thinking model. Synthesize details from the entire conversation.',
    apiKeyLink: 'https://openrouter.ai/keys',
    icon: 'bot',
    color: 'rose'
  },

  // --- DeepSeek Direct ---
  {
    name: 'DeepSeek Chat (V3)',
    provider: 'DeepSeek',
    category: 'DeepSeek Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    systemPrompt: 'You are DeepSeek Chat, a highly smart and efficient assistant. Provide clear, direct, and well-structured responses.',
    apiKeyLink: 'https://platform.deepseek.com/api_keys',
    icon: 'terminal',
    color: 'emerald'
  },
  {
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    category: 'DeepSeek Direct',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-coder',
    systemPrompt: 'You are DeepSeek Coder, a specialized assistant for programming and technical queries. Write clean, comments-explained code.',
    apiKeyLink: 'https://platform.deepseek.com/api_keys',
    icon: 'code',
    color: 'emerald'
  },

  // --- Groq Cloud ---
  {
    name: 'Llama 3.3 70B (Groq)',
    provider: 'Groq',
    category: 'Groq Cloud',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-specdec',
    systemPrompt: 'You are Llama 3.3 70B via Groq. Be fast, direct, conversational, and provide structured explanations.',
    apiKeyLink: 'https://console.groq.com/keys',
    icon: 'zap',
    color: 'orange'
  },
  {
    name: 'Mixtral 8x7B (Groq)',
    provider: 'Groq',
    category: 'Groq Cloud',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.groq.com/openai/v1',
    model: 'mixtral-8x7b-32768',
    systemPrompt: 'You are Mixtral 8x7B. Provide logical, well-structured, and helpful answers.',
    apiKeyLink: 'https://console.groq.com/keys',
    icon: 'zap',
    color: 'amber'
  },
  {
    name: 'Llama 3.1 8B (Groq)',
    provider: 'Groq',
    category: 'Groq Cloud',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    systemPrompt: 'You are Llama 3.1 8B, a lightweight and speedy conversational agent. Keep replies short and casual.',
    apiKeyLink: 'https://console.groq.com/keys',
    icon: 'zap',
    color: 'orange'
  },

  // --- Mistral AI ---
  {
    name: 'Mistral Large',
    provider: 'Mistral AI',
    category: 'Mistral AI',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    systemPrompt: 'You are Mistral Large, a high-quality model designed for complex multi-lingual reasoning and coding.',
    apiKeyLink: 'https://console.mistral.ai/api-keys',
    icon: 'messagesquare',
    color: 'amber'
  },
  {
    name: 'Mistral Codestral',
    provider: 'Mistral AI',
    category: 'Mistral AI',
    apiType: 'openai-compatible',
    apiUrl: 'https://api.mistral.ai/v1',
    model: 'codestral-latest',
    systemPrompt: 'You are Codestral, Mistral\'s premier code generation model. Provide direct programming solutions.',
    apiKeyLink: 'https://console.mistral.ai/api-keys',
    icon: 'code',
    color: 'amber'
  },

  // --- Local / Offline ---
  {
    name: 'Local Llama 3 (Ollama)',
    provider: 'Ollama',
    category: 'Local / Offline',
    apiType: 'openai-compatible',
    apiUrl: 'http://localhost:11434/v1',
    model: 'llama3',
    systemPrompt: 'You are a local Llama 3 model running offline. Keep your responses short and direct.',
    apiKeyLink: 'https://ollama.com/',
    icon: 'terminal',
    color: 'emerald'
  },
  {
    name: 'Local Mistral (Ollama)',
    provider: 'Ollama',
    category: 'Local / Offline',
    apiType: 'openai-compatible',
    apiUrl: 'http://localhost:11434/v1',
    model: 'mistral',
    systemPrompt: 'You are a local Mistral model running offline. Provide direct and helpful answers.',
    apiKeyLink: 'https://ollama.com/',
    icon: 'terminal',
    color: 'emerald'
  },
  {
    name: 'LM Studio Server',
    provider: 'LM Studio',
    category: 'Local / Offline',
    apiType: 'openai-compatible',
    apiUrl: 'http://localhost:1234/v1',
    model: 'lmstudio',
    systemPrompt: 'You are a local model running in LM Studio. Provide helpful, structured answers.',
    apiKeyLink: 'https://lmstudio.ai/',
    icon: 'cpu',
    color: 'indigo'
  }
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: AiParticipant[];
  onParticipantsChange: (participants: AiParticipant[]) => void;
  settings: {
    responseDelay: number;
    maxAutoRounds: number;
    handleRateLimits: boolean;
    exportFormat: string;
    replyMode?: string;
    contextLimit?: number;
    creditSaver?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  themeStyle: 'standard' | 'glass';
  onThemeStyleChange: (style: 'standard' | 'glass') => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  participants,
  onParticipantsChange,
  settings,
  onSettingsChange,
  theme,
  onThemeChange,
  themeStyle,
  onThemeStyleChange,
  themeColor,
  onThemeColorChange,
}: SettingsPanelProps) {
  const { toast } = useToast();
  
  // Custom AI edit state
  const [editingAi, setEditingAi] = useState<Partial<AiParticipant> | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isScanning, setIsScanning] = useState(false);
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleToggleActive = (id: string, active: boolean) => {
    try {
      const updated = storage.updateAiParticipant(id, { isActive: active });
      onParticipantsChange(storage.getAiParticipants());
      toast({
        title: active ? 'AI Activated' : 'AI Deactivated',
        description: `${updated.name} has been ${active ? 'added to' : 'removed from'} the group chat.`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to update participant.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAi = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      storage.deleteAiParticipant(id);
      onParticipantsChange(storage.getAiParticipants());
      toast({
        title: 'AI Deleted',
        description: `"${name}" has been removed.`,
      });
    }
  };

  const handleStartAdd = () => {
    setEditingAi({
      name: '',
      apiType: 'gemini',
      apiUrl: 'https://generativelanguage.googleapis.com',
      apiKey: '',
      model: 'gemini-2.5-flash',
      systemPrompt: 'You are a helpful AI assistant in a group chat. Keep responses concise and engaging.',
      isActive: true,
    });
    setErrors({});
  };

  const handleStartEdit = (p: AiParticipant) => {
    setEditingAi({ ...p });
    setErrors({});
  };

  const handleSaveAi = () => {
    if (!editingAi) return;

    // Validate
    const newErrors: Record<string, string> = {};
    if (!editingAi.name?.trim()) newErrors.name = 'Name is required';
    if (!editingAi.model?.trim()) newErrors.model = 'Model name is required';
    if (editingAi.apiType === 'openai-compatible' && !editingAi.apiUrl?.trim()) {
      newErrors.apiUrl = 'API URL is required for OpenAI-compatible endpoints';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingAi.id) {
        // Edit existing
        storage.updateAiParticipant(editingAi.id, editingAi);
        toast({
          title: 'AI Config Updated',
          description: `"${editingAi.name}" was saved successfully.`,
        });
      } else {
        // Add new
        storage.addAiParticipant(editingAi as any);
        toast({
          title: 'AI Added',
          description: `"${editingAi.name}" was successfully added to your list.`,
        });
      }

      onParticipantsChange(storage.getAiParticipants());
      setEditingAi(null);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to save AI participant.',
        variant: 'destructive',
      });
    }
  };

  const handleApiTypeChange = (value: 'gemini' | 'openai-compatible') => {
    if (!editingAi) return;

    let defaultUrl = '';
    let defaultModel = '';

    if (value === 'gemini') {
      defaultUrl = 'https://generativelanguage.googleapis.com';
      defaultModel = 'gemini-2.5-flash';
    } else {
      defaultUrl = 'https://api.groq.com/openai/v1';
      defaultModel = 'llama-3.3-70b-versatile';
    }

    setEditingAi(prev => ({
      ...prev,
      apiType: value,
      apiUrl: defaultUrl,
      model: defaultModel,
    }));
  };

  const handleScanOllama = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Invalid response structure from Ollama.');
      }

      const existingParticipants = storage.getAiParticipants();
      let addedCount = 0;

      data.models.forEach((model: any) => {
        const modelName = model.name;
        const exists = existingParticipants.some(
          p => p.apiUrl === 'http://localhost:11434/v1' && p.model === modelName
        );

        if (!exists) {
          storage.addAiParticipant({
            name: `Ollama: ${modelName.split(':')[0]}`,
            apiType: 'openai-compatible',
            apiUrl: 'http://localhost:11434/v1',
            apiKey: '',
            model: modelName,
            systemPrompt: 'You are a local AI assistant running via Ollama. Keep your responses short and natural.',
            isActive: true,
            icon: 'cpu',
            color: 'emerald'
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        onParticipantsChange(storage.getAiParticipants());
        toast({
          title: 'Ollama Scan Completed',
          description: `Discovered and added ${addedCount} new local model(s)!`,
        });
      } else {
        toast({
          title: 'Ollama Scan Completed',
          description: 'No new models found. All local Ollama models are already registered.',
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Ollama Connection Failed',
        description: 'Make sure Ollama is running at http://localhost:11434 and CORS is enabled (e.g. OLLAMA_ORIGINS="*" ollama serve).',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportWorkspace = () => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        conversations: storage.getConversations(),
        messages: JSON.parse(localStorage.getItem('ai_hub_messages') || '[]'),
        participants: storage.getAiParticipants(),
        settings: settings
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `council-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Exported',
        description: 'Workspace state was saved to a JSON file successfully.',
      });
    } catch (e: any) {
      toast({
        title: 'Export Failed',
        description: e.message || 'Unknown error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup.conversations || !backup.participants || !backup.messages) {
          throw new Error('Invalid backup file structure.');
        }

        if (confirm('Importing this backup will completely overwrite your current conversations, messages, and custom AI configurations. Are you sure you want to proceed?')) {
          localStorage.setItem('ai_hub_conversations', JSON.stringify(backup.conversations));
          localStorage.setItem('ai_hub_messages', JSON.stringify(backup.messages));
          localStorage.setItem('ai_hub_participants', JSON.stringify(backup.participants));
          
          if (backup.settings) {
            localStorage.setItem('ai_hub_global_settings', JSON.stringify(backup.settings));
          }

          toast({
            title: 'Workspace Restored',
            description: 'Restarting application to apply backup data...',
          });

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err: any) {
        toast({
          title: 'Import Failed',
          description: err.message || 'Could not parse JSON backup file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPreset = (preset: AiPreset) => {
    setEditingAi({
      name: preset.name,
      apiType: preset.apiType,
      apiUrl: preset.apiUrl,
      apiKey: '',
      model: preset.model,
      systemPrompt: preset.systemPrompt,
      icon: preset.icon,
      color: preset.color,
      isActive: true
    });
    setErrors({});
    toast({
      title: 'Preset Applied',
      description: `Configured fields for ${preset.name}. Please enter your API key to save.`,
    });
    setTimeout(() => {
      apiKeyInputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-50 transition-opacity" onClick={onClose} />

      <div className={cn(
        "fixed lg:relative inset-y-0 right-0 lg:right-auto w-full max-w-md lg:w-96 z-50 lg:z-auto flex flex-col h-full shadow-2xl lg:shadow-none transition-transform duration-300",
        themeStyle === 'glass' ? "glass-panel" : "bg-white border-l border-gray-150"
      )}>
        
        {/* Settings Header */}
        <div className={cn(
          "p-5 flex items-center justify-between",
          themeStyle === 'glass' ? "border-b border-gray-150 dark:border-slate-850" : "border-b border-gray-100 bg-gray-50/50"
        )}>
          {editingAi ? (
            <button 
              onClick={() => setEditingAi(null)}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Control Hub</h2>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {editingAi ? (
            /* --- Form: Add / Edit AI Participant --- */
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Sparkles className="w-4 h-4 text-indigo-500 mr-2 animate-pulse" />
                  {editingAi.id ? `Edit ${editingAi.name}` : 'Create Custom AI'}
                </h3>
              </div>

              {/* Name */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">AI Display Name</Label>
                <Input
                  placeholder="e.g. Local Llama 3"
                  value={editingAi.name || ''}
                  onChange={e => setEditingAi({ ...editingAi, name: e.target.value })}
                  className={cn(errors.name && 'border-red-500 focus-visible:ring-red-500')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* API Provider Type */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">API Provider Format</Label>
                <Select
                  value={editingAi.apiType}
                  onValueChange={handleApiTypeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select API type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini API</SelectItem>
                    <SelectItem value="openai-compatible">OpenAI-Compatible (Groq, Ollama, LM Studio, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Base URL */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">API Base URL</Label>
                <Input
                  placeholder="e.g. http://localhost:11434/v1"
                  value={editingAi.apiUrl || ''}
                  onChange={e => setEditingAi({ ...editingAi, apiUrl: e.target.value })}
                  className={cn(errors.apiUrl && 'border-red-500 focus-visible:ring-red-500')}
                />
                {errors.apiUrl && <p className="text-xs text-red-500 mt-1 font-medium">{errors.apiUrl}</p>}
                <p className="text-[10px] text-gray-500 mt-1">
                  {editingAi.apiType === 'gemini' 
                    ? 'Default: https://generativelanguage.googleapis.com' 
                    : 'Enter custom API URL. (For Ollama: http://localhost:11434/v1)'}
                </p>
              </div>

              {/* Model Name */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Model Name</Label>
                <Input
                  placeholder="e.g. llama3:8b, gemini-2.5-flash"
                  value={editingAi.model || ''}
                  onChange={e => setEditingAi({ ...editingAi, model: e.target.value })}
                  className={cn(errors.model && 'border-red-500 focus-visible:ring-red-500')}
                />
                {errors.model && <p className="text-xs text-red-500 mt-1 font-medium">{errors.model}</p>}
              </div>

              {/* API Key */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">API Key / Token</Label>
                <div className="relative">
                  <Input
                    ref={apiKeyInputRef}
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter API Secret key (optional for local models)"
                    value={editingAi.apiKey || ''}
                    onChange={e => setEditingAi({ ...editingAi, apiKey: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Stored securely in your local browser storage.</p>
              </div>

              {/* System Prompt */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">AI System Instructions (Prompt)</Label>
                <Textarea
                  placeholder="Define this agent's personality, behavior, or expertise..."
                  value={editingAi.systemPrompt || ''}
                  onChange={e => setEditingAi({ ...editingAi, systemPrompt: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Icon selection */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Avatar Icon</Label>
                <Select
                  value={editingAi.icon || 'bot'}
                  onValueChange={(val) => setEditingAi({ ...editingAi, icon: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bot">Bot (Assistant)</SelectItem>
                    <SelectItem value="cpu">CPU (Processor)</SelectItem>
                    <SelectItem value="sparkles">Sparkles (Creative)</SelectItem>
                    <SelectItem value="zap">Lightning (Fast)</SelectItem>
                    <SelectItem value="code">Code (Programmer)</SelectItem>
                    <SelectItem value="terminal">Terminal (Technical)</SelectItem>
                    <SelectItem value="smile">Smile (Friendly)</SelectItem>
                    <SelectItem value="messagesquare">Bubble (Chatty)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color selection */}
              <div>
                <Label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Theme Color</Label>
                <Select
                  value={editingAi.color || 'indigo'}
                  onValueChange={(val) => setEditingAi({ ...editingAi, color: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indigo">Indigo</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="emerald">Emerald</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="rose">Rose</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingAi(null)}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveAi}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Agent
                </Button>
              </div>
            </div>
          ) : (
            /* --- View: List of AIs & Settings --- */
            <div className="space-y-6">
              
              {/* Custom AI Participants List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Bot className="w-4.5 h-4.5 mr-2 text-indigo-600" />
                    AI Group Participants
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Button 
                      onClick={handleScanOllama}
                      disabled={isScanning}
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg"
                      title="Scan local Ollama server for models"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isScanning && "animate-spin")} />
                      Scan Ollama
                    </Button>
                    <Button 
                      onClick={handleStartAdd} 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add AI
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {participants.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <p className="text-sm text-gray-500 font-medium">No AIs configured.</p>
                      <p className="text-xs text-gray-400 mt-1">Add your first AI agent above!</p>
                    </div>
                  ) : (
                    participants.map((p) => (
                      <div 
                        key={p.id} 
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all flex items-center justify-between bg-white",
                          p.isActive 
                            ? 'border-indigo-100 shadow-sm shadow-indigo-100/50 hover:border-indigo-200' 
                            : 'border-gray-150 opacity-70 hover:opacity-90'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 font-semibold px-2 py-0.5 rounded-full capitalize">
                              {p.apiType === 'gemini' ? 'Gemini' : 'OpenAI'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-400">
                            <span>Model: <span className="font-mono text-[10px] text-gray-600">{p.model}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={p.isActive}
                            onCheckedChange={(checked) => handleToggleActive(p.id, checked)}
                          />
                          
                          <div className="flex items-center border-l border-gray-100 pl-2 space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                              onClick={() => handleStartEdit(p)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDeleteAi(p.id, p.name)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Preset Catalog */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-3">
                <button
                  onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  <span className="flex items-center">
                    <Sparkles className="w-4.5 h-4.5 mr-2 text-indigo-500 animate-pulse" />
                    AI Preset Catalog
                  </span>
                  {isCatalogExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                </button>
                
                {isCatalogExpanded && (() => {
                  const presetsByCategory = AI_PRESETS.reduce((acc, preset) => {
                    if (!acc[preset.category]) {
                      acc[preset.category] = [];
                    }
                    acc[preset.category].push(preset);
                    return acc;
                  }, {} as Record<string, typeof AI_PRESETS[0][]>);

                  return (
                    <div className="space-y-3.5 pt-1.5 animate-fade-in">
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Quickly add popular AI models to your Council. Click **Apply** to pre-populate details, then enter your API key to save! Get keys from the links.
                      </p>
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {Object.entries(presetsByCategory).map(([category, items]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-1 pt-1">
                              {category}
                            </h4>
                            <div className="space-y-2">
                              {items.map((preset) => (
                                <div 
                                  key={preset.name}
                                  className="p-3 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/30 dark:bg-slate-950/20 hover:border-indigo-100 transition-colors flex items-center justify-between"
                                >
                                  <div className="min-w-0 flex-1 pr-3">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-semibold text-xs text-gray-800 dark:text-slate-200">{preset.name}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 truncate mt-0.5 font-mono">{preset.model}</p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <a 
                                      href={preset.apiKeyLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                                      title={`Get ${preset.provider} API Key`}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <Button
                                      onClick={() => handleApplyPreset(preset)}
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:border-slate-800 px-2 rounded-lg"
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Appearance & Themes */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Layers className="w-4.5 h-4.5 text-indigo-650 dark:text-indigo-400 mr-2" />
                  Appearance & Themes
                </h3>

                {/* Theme Style: Standard vs Glass */}
                <div className="space-y-2">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Theme Interface Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={themeStyle === 'standard' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onThemeStyleChange('standard')}
                      className="text-xs rounded-xl font-bold h-9"
                    >
                      Standard Matte
                    </Button>
                    <Button
                      variant={themeStyle === 'glass' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onThemeStyleChange('glass')}
                      className="text-xs rounded-xl font-bold h-9"
                    >
                      Aero Glassmorphism
                    </Button>
                  </div>
                </div>

                {/* Theme Mode: Light vs Dark */}
                <div className="space-y-2">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Theme Color Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onThemeChange('light')}
                      className="text-xs rounded-xl font-bold h-9"
                    >
                      Light Mode
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onThemeChange('dark')}
                      className="text-xs rounded-xl font-bold h-9"
                    >
                      Dark Mode
                    </Button>
                  </div>
                </div>

                {/* Accent Color Palette */}
                <div className="space-y-2.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Accent Theme Color</Label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { id: 'blue', hex: '#3B82F6', label: 'Blue' },
                      { id: 'green', hex: '#10B981', label: 'Green' },
                      { id: 'red', hex: '#EF4444', label: 'Red' },
                      { id: 'yellow', hex: '#F59E0B', label: 'Yellow' },
                      { id: 'purple', hex: '#8B5CF6', label: 'Purple' },
                      { id: 'slate', hex: '#64748B', label: 'Slate' },
                      { id: 'teal', hex: '#14B8A6', label: 'Teal' },
                      { id: 'pink', hex: '#EC4899', label: 'Pink' },
                      { id: 'orange', hex: '#F97316', label: 'Orange' },
                      { id: 'indigo', hex: '#6366F1', label: 'Indigo' },
                      { id: 'mint', hex: '#34d399', label: 'Mint' },
                      { id: 'rose', hex: '#FB7185', label: 'Rose' }
                    ].map((col) => {
                      const displayHex = col.id === 'mint' ? '#34d399' : col.hex;
                      const isActive = themeColor === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => onThemeColorChange(col.id)}
                          className={cn(
                            "group relative h-9 rounded-xl flex items-center justify-center border transition-all duration-150 shadow-sm bg-white dark:bg-slate-900",
                            isActive 
                              ? "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20" 
                              : "border-gray-200 dark:border-slate-800 hover:border-gray-400 dark:hover:border-slate-700"
                          )}
                          title={col.label}
                          type="button"
                        >
                          <span 
                            className="w-4.5 h-4.5 rounded-full block border border-black/5 shadow-inner" 
                            style={{ backgroundColor: displayHex }} 
                          />
                          {isActive && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[7px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chat & Auto Mode Settings */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Conversation Controls</h3>
                
                {/* Delay Slider */}
                <div className="space-y-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Response Delay (Auto Mode)</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.responseDelay}
                    onChange={(e) => onSettingsChange({ ...settings, responseDelay: parseInt(e.target.value) })}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-1">
                    <span>1 second</span>
                    <span className="text-indigo-600">{settings.responseDelay}s delay</span>
                    <span>10 seconds</span>
                  </div>
                </div>

                 {/* Max Auto Messages */}
                <div className="space-y-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Max Auto Messages</Label>
                  <Select
                    value={settings.maxAutoRounds.toString()}
                    onValueChange={(value) => onSettingsChange({ ...settings, maxAutoRounds: parseInt(value) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Messages</SelectItem>
                      <SelectItem value="10">10 Messages</SelectItem>
                      <SelectItem value="20">20 Messages</SelectItem>
                      <SelectItem value="50">50 Messages</SelectItem>
                      <SelectItem value="-1">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reply Mode Toggle */}
                <div className="space-y-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Group Chat Reply Mode</Label>
                  <Select
                    value={settings.replyMode || 'sequential'}
                    onValueChange={(value) => onSettingsChange({ ...settings, replyMode: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential (One after the other)</SelectItem>
                      <SelectItem value="parallel">Parallel (All AIs respond at once)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-gray-400">Sequential mode lets AIs read each other's replies in real-time.</p>
                </div>

                {/* Rate Limit Checkbox */}
                <div className="flex items-center space-x-2 pt-1.5">
                  <Switch
                    id="handleRateLimits"
                    checked={settings.handleRateLimits}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, handleRateLimits: checked })}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="handleRateLimits" className="text-xs font-semibold text-gray-700">
                      Auto-exclude rate-limited AIs
                    </Label>
                    <p className="text-[10px] text-gray-400">Temporarily skip models that report 429 quota errors.</p>
                  </div>
                </div>

                {/* Export Format */}
                <div className="space-y-1.5 pt-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Transcript Export Format</Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value) => onSettingsChange({ ...settings, exportFormat: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                      <SelectItem value="json">JSON Metadata (.json)</SelectItem>
                      <SelectItem value="md">Markdown Transcript (.md)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Context History Limit */}
                <div className="space-y-1.5 pt-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Context History Limit</Label>
                  <Select
                    value={settings.contextLimit !== undefined ? settings.contextLimit.toString() : "15"}
                    onValueChange={(value) => onSettingsChange({ ...settings, contextLimit: parseInt(value) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Last 5 messages (Lowest cost)</SelectItem>
                      <SelectItem value="10">Last 10 messages (Budget)</SelectItem>
                      <SelectItem value="15">Last 15 messages (Standard)</SelectItem>
                      <SelectItem value="25">Last 25 messages (Balanced)</SelectItem>
                      <SelectItem value="50">Last 50 messages (High coherence)</SelectItem>
                      <SelectItem value="-1">Full Chat History (High cost)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Credit Saver Switch */}
                <div className="flex items-center space-x-2 pt-1.5">
                  <Switch
                    id="creditSaver"
                    checked={settings.creditSaver || false}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, creditSaver: checked })}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="creditSaver" className="text-xs font-semibold text-gray-700">
                      Credit Saver Mode
                    </Label>
                    <p className="text-[10px] text-gray-400">Minifies code blocks and older texts in API prompts to save tokens.</p>
                  </div>
                </div>
              </div>

              {/* Status and Health Check indicators */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Health Monitor</h3>
                <div className="space-y-2.5">
                  {participants.filter(p => p.isActive).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                      <span className="text-gray-700 font-medium">{p.name}</span>
                      <div className="flex items-center space-x-2 font-semibold">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          p.status === 'online' ? 'bg-green-500' :
                          p.status === 'rate_limited' ? 'bg-amber-500' : 'bg-red-500'
                        )} />
                        <span className={cn(
                          "capitalize text-[10px] font-bold tracking-wide",
                          p.status === 'online' ? 'text-green-600' :
                          p.status === 'rate_limited' ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {p.status === 'rate_limited' ? 'Rate Limited' : p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {participants.filter(p => p.isActive).length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center">No active models selected.</p>
                  )}
                </div>
              </div>

              {/* System Tools / Workspace Backup */}
              <div className="border-t border-gray-100 pt-5 space-y-3 pb-4">
                <h3 className="text-sm font-semibold text-gray-900">Workspace Management</h3>
                <p className="text-[10px] text-gray-400">Backup all conversations, settings, and custom AI agents to a JSON file, or restore them.</p>
                <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                  <Button
                    onClick={handleExportWorkspace}
                    variant="outline"
                    className="text-xs font-semibold h-9 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    Export Backup
                  </Button>
                  <label className="cursor-pointer">
                    <span className="text-xs font-semibold h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center bg-white text-gray-900 shadow-sm transition-colors text-center px-2">
                      <Upload className="w-3.5 h-3.5 mr-1.5 text-gray-500 inline" />
                      Import Backup
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportWorkspace}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}