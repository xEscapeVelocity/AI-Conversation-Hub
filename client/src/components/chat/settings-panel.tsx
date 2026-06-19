import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { X, Eye, EyeOff, Save, Plus, Edit2, Trash2, ArrowLeft, Bot, Sparkles, Cpu } from 'lucide-react';
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

                {/* Max Auto Rounds */}
                <div className="space-y-1.5">
                  <Label className="block text-xs font-semibold text-gray-600 uppercase">Max Auto Rounds</Label>
                  <Select
                    value={settings.maxAutoRounds.toString()}
                    onValueChange={(value) => onSettingsChange({ ...settings, maxAutoRounds: parseInt(value) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 rounds</SelectItem>
                      <SelectItem value="10">10 rounds</SelectItem>
                      <SelectItem value="20">20 rounds</SelectItem>
                      <SelectItem value="50">50 rounds</SelectItem>
                      <SelectItem value="-1">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
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

            </div>
          )}
        </div>
      </div>
    </>
  );
}