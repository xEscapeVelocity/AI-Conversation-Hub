import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/chat-message';
import { AiStatusPanel } from '@/components/chat/ai-status-panel';
import { SettingsPanel } from '@/components/chat/settings-panel';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Play, 
  MessageCircle, 
  Square, 
  Trash2, 
  Settings, 
  Download,
  Send,
  Users,
  Terminal
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { storage, Message, AiParticipant } from '@/lib/storage';
import { aiOrchestrator } from '@/lib/ai-orchestrator';

export default function Chat() {
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiParticipants, setAiParticipants] = useState<AiParticipant[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Multiple AIs can type in parallel
  const [typingAIs, setTypingAIs] = useState<string[]>([]);
  
  const [stats, setStats] = useState({
    totalMessages: 0,
    autoRounds: 0,
    duration: '0m 0s'
  });
  
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      responseDelay: 3,
      maxAutoRounds: 10,
      handleRateLimits: true,
      exportFormat: 'md',
      replyMode: 'sequential'
    };
    const saved = localStorage.getItem('ai_hub_global_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const handleSettingsChange = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('ai_hub_global_settings', JSON.stringify(newSettings));
    
    // Sync to active conversation in database
    if (conversationId) {
      storage.updateConversation(conversationId, {
        responseDelay: newSettings.responseDelay,
        maxAutoRounds: newSettings.maxAutoRounds,
      });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date>(new Date());
  
  // Use references to prevent stale closures in timeouts / asynchronous flow
  const messagesRef = useRef<Message[]>([]);
  const aiParticipantsRef = useRef<AiParticipant[]>([]);
  const isAutoModeRef = useRef<boolean>(false);
  const currentRoundsRef = useRef<number>(0);
  const settingsRef = useRef(settings);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Update refs when state changes
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { aiParticipantsRef.current = aiParticipants; }, [aiParticipants]);
  useEffect(() => { isAutoModeRef.current = isAutoMode; }, [isAutoMode]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Load / Initialize conversation
  useEffect(() => {
    // Check if there's any existing conversation, otherwise create one
    const convs = storage.getConversations();
    let conv = convs[0];
    if (!conv) {
      conv = storage.createConversation();
    }
    
    setConversationId(conv.id);
    setMessages(storage.getMessages(conv.id));
    setAiParticipants(storage.getAiParticipants());
    

    setIsAutoMode(conv.isAutoMode ?? false);
    
    currentRoundsRef.current = conv.currentRounds || 0;
    setStats(prev => ({
      ...prev,
      totalMessages: storage.getMessages(conv.id).length,
      autoRounds: conv.currentRounds || 0
    }));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingAIs]);

  // Update duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current.getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setStats(prev => ({ ...prev, duration: `${minutes}m ${seconds}s` }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Orchestrator: Trigger all active AIs to respond (either sequentially or in parallel based on replyMode setting)
  const triggerAllAIResponses = async (currentConvId: string) => {
    const activeAIs = aiParticipantsRef.current.filter(p => p.isActive && p.status === 'online');
    if (activeAIs.length === 0) return;

    const isParallel = settingsRef.current.replyMode === 'parallel';
    console.log("[Orchestrator] Triggering responses. Mode:", isParallel ? "Parallel" : "Sequential");

    if (isParallel) {
      // --- Parallel Response Mode (All AIs respond at once) ---
      await Promise.all(
        activeAIs.map(async (ai) => {
          // Show typing indicator
          setTypingAIs(prev => [...prev, ai.name]);

          try {
            const currentMessages = storage.getMessages(currentConvId);
            const response = await aiOrchestrator.callAI(ai, currentMessages);
            
            // Remove typing indicator
            setTypingAIs(prev => prev.filter(name => name !== ai.name));

            if (response.error) {
              if (response.error === 'rate_limited') {
                storage.updateAiParticipant(ai.id, { status: 'rate_limited', rateLimitUsage: 100 });
                setAiParticipants(storage.getAiParticipants());
                toast({
                  title: `${ai.name} Rate Limited`,
                  description: 'The AI participant hit its rate limit and was paused.',
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: `${ai.name} Error`,
                  description: response.error,
                  variant: 'destructive',
                });
              }
              return;
            }

            // Save and push AI message
            if (response.content) {
              const aiMsg = storage.createMessage({
                content: response.content,
                sender: ai.name,
                conversationId: currentConvId
              });
              setMessages(prev => [...prev, aiMsg]);
              setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));
            }
          } catch (error) {
            setTypingAIs(prev => prev.filter(name => name !== ai.name));
            console.error(error);
          }
        })
      );
    } else {
      // --- Sequential Response Mode (One after the other) ---
      for (let i = 0; i < activeAIs.length; i++) {
        const ai = activeAIs[i];
        
        // If Auto Mode is turned on while this round is active, exit so Auto Mode can handle sequencing
        if (isAutoModeRef.current) break;

        // Show typing indicator
        setTypingAIs([ai.name]);

        try {
          const currentMessages = storage.getMessages(currentConvId);
          const response = await aiOrchestrator.callAI(ai, currentMessages);
          
          // Remove typing indicator
          setTypingAIs([]);

          if (response.error) {
            if (response.error === 'rate_limited') {
              storage.updateAiParticipant(ai.id, { status: 'rate_limited', rateLimitUsage: 100 });
              setAiParticipants(storage.getAiParticipants());
              toast({
                title: `${ai.name} Rate Limited`,
                description: 'The AI participant hit its rate limit and was paused.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: `${ai.name} Error`,
                description: response.error,
                variant: 'destructive',
              });
            }
            continue;
          }

          // Save and push AI message
          if (response.content) {
            const aiMsg = storage.createMessage({
              content: response.content,
              sender: ai.name,
              conversationId: currentConvId
            });
            setMessages(prev => [...prev, aiMsg]);
            setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));

            // Add a short delay (e.g. 500ms) for natural pacing before triggering the next model
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          setTypingAIs([]);
          console.error(error);
        }
      }
    }
  };

  // Orchestrator: Trigger single AI response (round-robin style)
  const triggerAIResponse = async (currentConvId: string, isSingleStep = false) => {
    // Exit if auto-mode was stopped (for background timeouts)
    if (!isSingleStep && !isAutoModeRef.current) return;

    // Check round count limits
    const maxRounds = settingsRef.current.maxAutoRounds;
    if (!isSingleStep && maxRounds > 0 && currentRoundsRef.current >= maxRounds) {
      handleStopConversation();
      toast({
        title: 'Auto Conversation Completed',
        description: `Reached maximum limit of ${maxRounds} rounds.`,
      });
      return;
    }

    const activeAIs = aiParticipantsRef.current.filter(p => p.isActive && p.status === 'online');
    if (activeAIs.length === 0) {
      handleStopConversation();
      toast({
        title: 'No Active AIs',
        description: 'Please enable at least one active AI participant in the Settings Panel.',
        variant: 'destructive',
      });
      return;
    }

    // Select next AI in round-robin fashion
    const aiIndex = currentRoundsRef.current % activeAIs.length;
    const ai = activeAIs[aiIndex];

    // Show typing indicator
    setTypingAIs([ai.name]);

    try {
      const currentMessages = storage.getMessages(currentConvId);
      const response = await aiOrchestrator.callAI(ai, currentMessages);
      
      // Clear typing indicator
      setTypingAIs([]);

      if (response.error) {
        if (response.error === 'rate_limited') {
          storage.updateAiParticipant(ai.id, { status: 'rate_limited', rateLimitUsage: 100 });
          setAiParticipants(storage.getAiParticipants());
          toast({
            title: `${ai.name} Rate Limited`,
            description: 'Model has hit a rate limit. Skipping to next...',
            variant: 'destructive',
          });
          
          // Skip immediately to the next AI if in auto mode
          if (!isSingleStep && isAutoModeRef.current) {
            currentRoundsRef.current += 1;
            autoTimeoutRef.current = setTimeout(
              () => triggerAIResponse(currentConvId),
              settingsRef.current.responseDelay * 1000
            );
          }
        } else {
          toast({
            title: `${ai.name} Error`,
            description: response.error,
            variant: 'destructive',
          });
          if (!isSingleStep) handleStopConversation();
        }
        return;
      }

      if (response.content) {
        const aiMsg = storage.createMessage({
          content: response.content,
          sender: ai.name,
          conversationId: currentConvId
        });
        setMessages(prev => [...prev, aiMsg]);
        setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));

        if (!isSingleStep) {
          // Increment rounds
          const nextRounds = currentRoundsRef.current + 1;
          currentRoundsRef.current = nextRounds;
          storage.updateConversation(currentConvId, { currentRounds: nextRounds });
          setStats(prev => ({ ...prev, autoRounds: nextRounds }));

          // Schedule next AI reply
          if (isAutoModeRef.current) {
            autoTimeoutRef.current = setTimeout(
              () => triggerAIResponse(currentConvId),
              settingsRef.current.responseDelay * 1000
            );
          }
        }
      }
    } catch (err) {
      setTypingAIs([]);
      if (!isSingleStep) handleStopConversation();
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;

    const userMsg = storage.createMessage({
      content: messageInput,
      sender: 'user',
      conversationId
    });

    setMessages(prev => [...prev, userMsg]);
    setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }));
    setMessageInput('');

    // If auto mode is active, do not interrupt the loop. If manual mode, let all active AIs respond.
    if (!isAutoMode) {
      await triggerAllAIResponses(conversationId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLetThemTalk = () => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    
    // Reset round counters
    isAutoModeRef.current = true;
    setIsAutoMode(true);
    currentRoundsRef.current = 0;
    storage.updateConversation(conversationId, { isAutoMode: true, currentRounds: 0 });
    setStats(prev => ({ ...prev, autoRounds: 0 }));

    // Start immediately
    triggerAIResponse(conversationId);
  };

  const handleStopConversation = () => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    isAutoModeRef.current = false;
    storage.updateConversation(conversationId, { isAutoMode: false });
    setIsAutoMode(false);
    setTypingAIs([]);
  };

  const handleSendOneMessage = () => {
    triggerAllAIResponses(conversationId);
  };

  const handleClearChat = () => {
    handleStopConversation();
    storage.clearMessages(conversationId);
    setMessages([]);
    startTimeRef.current = new Date();
    setStats({ totalMessages: 0, autoRounds: 0, duration: '0m 0s' });
    toast({
      title: 'Chat Cleared',
      description: 'Conversation transcript has been cleared locally.',
    });
  };

  const handleExportConversation = () => {
    const fmt = settings.exportFormat;
    let fileContent = '';
    let filename = `chat-export-${conversationId}.${fmt}`;

    if (fmt === 'json') {
      fileContent = JSON.stringify({
        conversationId,
        exportedAt: new Date().toISOString(),
        stats,
        messages
      }, null, 2);
    } else if (fmt === 'txt') {
      fileContent = `AI GROUP CHAT LOG\nExported: ${new Date().toLocaleString()}\nDuration: ${stats.duration}\nTotal Messages: ${stats.totalMessages}\n========================================\n\n`;
      fileContent += messages.map(m => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const name = m.sender === 'user' ? 'You' : m.sender;
        return `[${time}] ${name}: ${m.content}`;
      }).join('\n\n');
    } else {
      // Markdown
      fileContent = `# AI Group Conversation Log\n\n`;
      fileContent += `* **Exported at:** ${new Date().toLocaleString()}\n`;
      fileContent += `* **Session Duration:** ${stats.duration}\n`;
      fileContent += `* **Total Messages:** ${stats.totalMessages}\n\n`;
      fileContent += `---\n\n`;
      fileContent += messages.map(m => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const name = m.sender === 'user' ? '**You**' : `**${m.sender}**`;
        return `### ${name} *(${time})*\n${m.content}\n`;
      }).join('\n');
    }

    const blob = new Blob([fileContent], { type: fmt === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeParticipantsCount = aiParticipants.filter(p => p.isActive && p.status === 'online').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50/50">
      {/* Mobile Header with AI Status */}
      <div className="lg:hidden bg-white border-b border-gray-150 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 flex items-center">
              <Bot className="text-indigo-600 mr-2 w-5 h-5 animate-pulse" />
              AI Group Chat
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
              {activeParticipantsCount} Active Collaborators
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 rounded-full" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Horizontal scroll list of active bots */}
        <div className="px-4 pb-2 flex space-x-2 overflow-x-auto border-t border-gray-50 pt-2">
          {aiParticipants.filter(p => p.isActive).map(p => (
            <div key={p.id} className="flex items-center space-x-1.5 bg-gray-100/80 px-2.5 py-1 rounded-full border border-gray-150 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
              <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>

        {/* Mobile Control Buttons */}
        <div className="px-4 py-2 border-t border-gray-100 flex space-x-1.5 overflow-x-auto bg-gray-50/30">
          <Button
            onClick={handleLetThemTalk}
            disabled={isAutoMode}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1 h-8 rounded-xl"
          >
            <Play className="mr-1 w-3.5 h-3.5" />
            Auto Talk
          </Button>
          <Button
            onClick={handleSendOneMessage}
            disabled={isAutoMode}
            variant="outline"
            size="sm"
            className="text-xs py-1 h-8 rounded-xl"
          >
            <MessageCircle className="mr-1 w-3.5 h-3.5 text-indigo-600" />
            Step
          </Button>
          <Button
            onClick={handleStopConversation}
            disabled={!isAutoMode}
            variant="destructive"
            size="sm"
            className="text-xs py-1 h-8 rounded-xl"
          >
            <Square className="mr-1 w-3.5 h-3.5" />
            Stop
          </Button>
          <Button
            onClick={handleClearChat}
            variant="ghost"
            size="sm"
            className="text-xs py-1 h-8 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50"
          >
            <Trash2 className="mr-1 w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-150 flex-col flex-shrink-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-150 bg-gray-50/20">
            <h1 className="text-lg font-bold text-gray-900 flex items-center">
              <Bot className="text-indigo-600 mr-2.5 w-6 h-6" />
              AI Conversation Hub
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Local Open-Source Collaboration</p>
          </div>

          {/* AI Status Panel */}
          <div className="flex-1 overflow-y-auto">
            <AiStatusPanel 
              participants={aiParticipants} 
              onReorder={(updated) => {
                setAiParticipants(updated);
                storage.saveAiParticipants(updated);
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="p-6 border-t border-gray-100 space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Execution Control
            </h3>
            
            <Button
              onClick={handleLetThemTalk}
              disabled={isAutoMode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-xl h-10 shadow-sm shadow-indigo-150"
            >
              <Play className="mr-2 w-4 h-4" />
              Let Them Talk
            </Button>

            <Button
              onClick={handleSendOneMessage}
              disabled={isAutoMode}
              variant="outline"
              className="w-full text-indigo-600 hover:bg-indigo-50 border-indigo-100 font-semibold rounded-xl h-10"
            >
              <MessageCircle className="mr-2 w-4 h-4" />
              Send One Message
            </Button>

            <Button
              onClick={handleStopConversation}
              disabled={!isAutoMode}
              variant="destructive"
              className="w-full font-semibold rounded-xl h-10 shadow-sm"
            >
              <Square className="mr-2 w-4 h-4" />
              Stop Conversation
            </Button>

            <Button
              onClick={handleClearChat}
              variant="ghost"
              className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50 font-semibold rounded-xl h-10"
            >
              <Trash2 className="mr-2 w-4 h-4" />
              Clear Chat history
            </Button>
          </div>

          {/* Conversation Stats */}
          <div className="p-6 border-t border-gray-150 bg-gray-50/50">
            <Card className="border-gray-150 shadow-none rounded-2xl bg-white">
              <CardContent className="p-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Session Stats</h4>
                <div className="space-y-2 text-xs font-semibold text-gray-600">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                    <span>Messages:</span>
                    <span className="text-gray-900 font-bold">{stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                    <span>Auto Rounds:</span>
                    <span className="text-gray-900 font-bold">{stats.autoRounds}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Duration:</span>
                    <span className="text-indigo-600 font-bold">{stats.duration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-gray-50/30">
          
          {/* Desktop Chat Header */}
          <div className="hidden lg:block bg-white border-b border-gray-150 p-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-md font-bold text-gray-900">Group Chat</h2>
                <p className="text-xs text-gray-400 font-semibold flex items-center mt-1">
                  <Users className="mr-1.5 w-3.5 h-3.5 text-indigo-500" />
                  {activeParticipantsCount} active models in channel
                  <span className="mx-2 text-gray-200">|</span>
                  <span className={isAutoMode ? 'text-indigo-600 font-bold' : 'text-gray-500'}>
                    {isAutoMode ? 'Auto mode loop active' : 'Manual step mode'}
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100" onClick={handleExportConversation} title="Export transcript">
                  <Download className="w-4.5 h-4.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100" onClick={() => setIsSettingsOpen(true)} title="Manage agents">
                  <Settings className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-12">
                <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl mb-4 shadow-sm shadow-indigo-50">
                  <Bot className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Group Chat Channel</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Welcome! This is your local group chat space. Add your AI agents, configure their API keys, and type below to start talking. Or click <strong className="text-indigo-600 font-bold">Let Them Talk</strong> to trigger an autonomous back-and-forth round.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    content={message.content}
                    sender={message.sender}
                    timestamp={new Date(message.timestamp)}
                  />
                ))}
              </div>
            )}

            {/* Typing Indicators */}
            {typingAIs.map((name) => (
              <div key={name} className="flex items-start space-x-3.5 animate-fade-in">
                <div className="w-8.5 h-8.5 bg-gray-200 border border-gray-300 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="text-gray-500 text-sm" size={16} />
                </div>
                <div className="flex-1 max-w-[80%]">
                  <span className="text-[10px] text-gray-400 font-bold ml-1 mb-1 block uppercase tracking-wide">{name} is thinking...</span>
                  <div className="bg-white border border-gray-150 rounded-2xl rounded-tl-none p-3.5 max-w-xs shadow-sm shadow-black/5">
                    <div className="flex space-x-1 items-center h-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-150 p-4 lg:p-5 flex-shrink-0 shadow-lg shadow-black/5">
            <div className="flex items-center space-x-4 max-w-4xl mx-auto">
              <div className="flex-1 relative flex items-center">
                <Input
                  type="text"
                  placeholder={
                    activeParticipantsCount === 0 
                      ? "Enable or configure AI agents in Settings to start..." 
                      : "Type your message to address the AIs..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={activeParticipantsCount === 0}
                  className="pr-12 py-5.5 rounded-xl border-gray-250 focus-visible:ring-indigo-600 text-sm shadow-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="absolute right-2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  disabled={!messageInput.trim() || activeParticipantsCount === 0}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        participants={aiParticipants}
        onParticipantsChange={setAiParticipants}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
