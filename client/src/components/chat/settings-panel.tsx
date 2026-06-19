import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X, Eye, EyeOff, Save, Plus, Edit2, Trash2, ArrowLeft, Bot, Sparkles, Cpu, Download, Upload, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AiParticipant, storage } from '@/lib/storage';

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
}

export function SettingsPanel({
  isOpen,
  onClose,
  participants,
  onParticipantsChange,
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  const { toast } = useToast();
  
  // Custom AI edit state
  const [editingAi, setEditingAi] = useState<Partial<AiParticipant> | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isScanning, setIsScanning] = useState(false);

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
      a.download = `aiconvohub-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-50 transition-opacity" onClick={onClose} />

      <div className="fixed lg:relative inset-y-0 right-0 lg:right-auto w-full max-w-md lg:w-96 bg-white border-l border-gray-150 z-50 lg:z-auto flex flex-col h-full shadow-2xl lg:shadow-none transition-transform duration-300">
        
        {/* Settings Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
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

              {/* Chat & Auto Mode Settings */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
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