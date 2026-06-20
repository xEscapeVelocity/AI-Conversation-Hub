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
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Layers
} from 'lucide-react';
import { CouncilLogo } from '@/components/chat/council-logo';
import { nanoid } from 'nanoid';
import { storage, Message, AiParticipant, Conversation } from '@/lib/storage';
import { aiOrchestrator } from '@/lib/ai-orchestrator';
import { cn } from '@/lib/utils';

export default function Chat() {
  const [conversationId, setConversationId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiParticipants, setAiParticipants] = useState<AiParticipant[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sidebar visibility states
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Conversation editing states
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingConvTitle, setEditingConvTitle] = useState('');

  // Darkmode theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Glassmorphism and Accent color theme state
  const [themeStyle, setThemeStyle] = useState<'standard' | 'glass'>(() => {
    const saved = localStorage.getItem('themeStyle');
    return (saved === 'standard' || saved === 'glass') ? saved : 'standard';
  });

  const [themeColor, setThemeColor] = useState<string>(() => {
    const saved = localStorage.getItem('themeColor');
    return saved || 'blue';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('theme-standard', 'theme-glass');
    root.classList.add(`theme-${themeStyle}`);
    
    const colorClasses = [
      'accent-blue', 'accent-green', 'accent-red', 'accent-yellow', 'accent-purple', 'accent-slate',
      'accent-teal', 'accent-pink', 'accent-orange', 'accent-indigo', 'accent-mint', 'accent-rose'
    ];
    colorClasses.forEach(cls => root.classList.remove(cls));
    root.classList.add(`accent-${themeColor}`);
    
    localStorage.setItem('themeStyle', themeStyle);
    localStorage.setItem('themeColor', themeColor);
  }, [themeStyle, themeColor]);
  
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
      replyMode: 'sequential',
      contextLimit: 15,
      creditSaver: false
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

  // Load / Initialize conversation on launch
  useEffect(() => {
    const list = storage.getConversations();
    setConversations(list);
    
    let conv = list[0];
    if (!conv) {
      conv = storage.createConversation();
      setConversations([conv]);
    }
    
    loadChatSession(conv);

    // Initial check for mobile size
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    }
  }, []);

  // Helper to load chat states
  const loadChatSession = (conv: Conversation) => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    
    setConversationId(conv.id);
    setMessages(storage.getMessages(conv.id));
    setAiParticipants(storage.getAiParticipants());
    setIsAutoMode(conv.isAutoMode ?? false);
    isAutoModeRef.current = conv.isAutoMode ?? false;
    currentRoundsRef.current = conv.currentRounds || 0;
    
    setStats({
      totalMessages: storage.getMessages(conv.id).length,
      autoRounds: conv.currentRounds || 0,
      duration: '0m 0s'
    });
    
    startTimeRef.current = new Date();
  };

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

  // Create a brand new chat session
  const handleNewChat = () => {
    const newConv = storage.createConversation();
    const list = storage.getConversations();
    setConversations(list);
    loadChatSession(newConv);
    toast({
      title: 'New Chat Created',
      description: 'Started a fresh group conversation.',
    });
  };

  // Switch between previous chats
  const handleSwitchChat = (id: string) => {
    const conv = storage.getConversation(id);
    if (conv) {
      loadChatSession(conv);
    }
  };

  // Delete a conversation
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering switch chat on click
    
    storage.deleteConversation(id);
    const list = storage.getConversations();
    setConversations(list);
    
    // If we deleted the active chat, switch to another or create a new one
    if (id === conversationId) {
      if (list.length > 0) {
        // Delete current and list has items: load first
        const nextConv = list.filter(c => c.id !== id)[0] || list[0];
        if (nextConv) {
          loadChatSession(nextConv);
        }
      } else {
        // Delete current and list is empty: create fresh chat
        const fresh = storage.createConversation();
        setConversations([fresh]);
        loadChatSession(fresh);
      }
    }
    
    toast({
      title: 'Chat Deleted',
      description: 'Conversation history was permanently cleared.',
    });
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    if (newTitle.trim()) {
      storage.updateConversation(id, { title: newTitle.trim() });
      setConversations(storage.getConversations());
    }
    setEditingConvId(null);
  };

  const groupConversationsByDate = (convs: Conversation[]) => {
    const sorted = [...convs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    sorted.forEach(c => {
      const date = new Date(c.createdAt);
      if (date >= today) {
        groups['Today'].push(c);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(c);
      } else if (date >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups['Older'].push(c);
      }
    });

    return groups;
  };

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
            const response = await aiOrchestrator.callAI(
              ai, 
              currentMessages, 
              settingsRef.current.contextLimit, 
              settingsRef.current.creditSaver
            );
            
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
          const response = await aiOrchestrator.callAI(
            ai, 
            currentMessages, 
            settingsRef.current.contextLimit, 
            settingsRef.current.creditSaver
          );
          
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
        description: `Reached maximum limit of ${maxRounds} messages.`,
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
      const response = await aiOrchestrator.callAI(
        ai, 
        currentMessages, 
        settingsRef.current.contextLimit, 
        settingsRef.current.creditSaver
      );
      
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

    // Automatically name the conversation if it was using the default name
    const currentMessages = storage.getMessages(conversationId);
    const isFirstMessage = currentMessages.length === 1;
    const activeConv = storage.getConversation(conversationId);
    if (isFirstMessage && activeConv && (activeConv.title?.startsWith('Chat ') || activeConv.title?.startsWith('Conversation '))) {
      const firstMessageExcerpt = messageInput.slice(0, 26) + (messageInput.length > 26 ? '...' : '');
      storage.updateConversation(conversationId, { title: firstMessageExcerpt });
      setConversations(storage.getConversations());
    }

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
    <div className="relative flex h-screen overflow-hidden bg-background-gradient text-gray-900 dark:text-slate-100">
      {/* Dynamic Animated Glass Aurora Orbs */}
      {themeStyle === 'glass' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--orb-color-1)] blur-[80px] dark:blur-[120px] animate-aurora-slow" />
          <div className="absolute top-[30%] left-[25%] w-[40%] h-[40%] rounded-full bg-[var(--orb-color-3)] blur-[90px] dark:blur-[130px] animate-aurora-mid" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[var(--orb-color-2)] blur-[100px] dark:blur-[150px] animate-aurora-reverse" />
        </div>
      )}

      {/* Left Sidebar Mobile Backdrop */}
      {isLeftSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar Mobile Backdrop */}
      {isRightSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setIsRightSidebarOpen(false)}
        />
      )}
      
      {/* ================= COLUMN 1: LEFT SIDEBAR (Chats List) ================= */}
      <div 
        className={cn(
          "w-64 flex flex-col h-full flex-shrink-0 transition-all duration-300 z-40 lg:relative absolute inset-y-0 left-0 border-r border-slate-950/20 dark:border-slate-800/40",
          themeStyle === 'glass' ? "glass-panel text-gray-900 dark:text-white" : "bg-slate-900 text-white",
          isLeftSidebarOpen 
            ? "translate-x-0 w-64 opacity-100" 
            : "-translate-x-full lg:-translate-x-0 lg:w-0 overflow-hidden border-none opacity-0 lg:opacity-100"
        )}
      >
        {/* App Title */}
        <div className={cn(
          "p-5 flex items-center justify-between",
          themeStyle === 'glass' ? "border-b border-gray-150 dark:border-slate-800/40" : "border-b border-slate-800"
        )}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-md">
              <CouncilLogo className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">Council.</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl"
            onClick={() => setIsLeftSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl h-10 shadow-md border-indigo-700/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Scrollable list of past conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500 italic px-3">No conversations yet</p>
          ) : (
            (() => {
              const groups = groupConversationsByDate(conversations);
              return Object.entries(groups).map(([groupTitle, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={groupTitle} className="space-y-1">
                    <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {groupTitle}
                    </h3>
                    {items.map((conv) => {
                      const isEditing = editingConvId === conv.id;
                      return (
                        <div 
                          key={conv.id}
                          onClick={() => !isEditing && handleSwitchChat(conv.id)}
                          onDoubleClick={() => {
                            setEditingConvId(conv.id);
                            setEditingConvTitle(conv.title || '');
                          }}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150",
                            conv.id === conversationId 
                              ? (themeStyle === 'glass' 
                                  ? "glass-gloss text-indigo-600 dark:text-indigo-400 font-bold" 
                                  : "bg-slate-800 text-indigo-400 font-bold border border-slate-700/50") 
                              : (themeStyle === 'glass'
                                  ? "text-gray-500 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-800/20 hover:text-gray-900 dark:hover:text-white"
                                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white")
                          )}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2 flex-1">
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingConvTitle}
                                onChange={(e) => setEditingConvTitle(e.target.value)}
                                onBlur={() => handleRenameChat(conv.id, editingConvTitle)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameChat(conv.id, editingConvTitle);
                                  } else if (e.key === 'Escape') {
                                    setEditingConvId(null);
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-xs focus:outline-none w-full",
                                  themeStyle === 'glass'
                                    ? "glass-input text-gray-900 dark:text-white border border-indigo-500"
                                    : "bg-slate-700 text-white border border-indigo-500"
                                )}
                              />
                            ) : (
                              <span className="truncate">{conv.title}</span>
                            )}
                          </div>
                          
                          {!isEditing && (
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingConvId(conv.id);
                                  setEditingConvTitle(conv.title || '');
                                }}
                                className="hover:text-indigo-400 p-0.5 rounded transition-colors"
                                title="Rename chat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteChat(conv.id, e)}
                                className="hover:text-red-400 p-0.5 rounded transition-colors"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* ================= COLUMN 2: CENTER AREA (Chat window) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/20 dark:bg-slate-950/20">
        
        {/* Chat Area Top Header */}
        <div className={cn(
          "hidden lg:flex p-4 flex-shrink-0 items-center justify-between shadow-sm z-20",
          themeStyle === 'glass' ? "glass-panel" : "bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-800"
        )}>
          <div className="flex items-center space-x-3">
            {/* Left Sidebar Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              title={isLeftSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {isLeftSidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
            </Button>
            
            <div className="border-l border-gray-100 dark:border-slate-850 pl-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {conversations.find(c => c.id === conversationId)?.title || "Group Conversation"}
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold flex items-center mt-0.5">
                <Users className="mr-1.5 w-3.5 h-3.5 text-indigo-500" />
                {activeParticipantsCount} active models
                <span className="mx-2 text-gray-200 dark:text-slate-700">|</span>
                <span className="text-gray-500 dark:text-slate-400">
                  Mode: <strong className="text-indigo-600 dark:text-indigo-400 font-bold capitalize">{settings.replyMode}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800" 
              onClick={() => setThemeStyle(themeStyle === 'glass' ? 'standard' : 'glass')} 
              title={themeStyle === 'glass' ? "Switch to standard theme" : "Switch to glass theme"}
            >
              <Layers className={cn("w-4.5 h-4.5", themeStyle === 'glass' && "text-indigo-600 dark:text-indigo-400")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800" onClick={handleExportConversation} title="Export transcript">
              <Download className="w-4.5 h-4.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => setIsSettingsOpen(true)} title="Manage settings">
              <Settings className="w-4.5 h-4.5" />
            </Button>
            {/* Right Sidebar Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              title={isRightSidebarOpen ? "Hide Controls" : "Show Controls"}
            >
              {isRightSidebarOpen ? <PanelRightClose className="w-4.5 h-4.5" /> : <PanelRight className="w-4.5 h-4.5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Header with AI Status */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-800 flex-shrink-0 flex items-center justify-between p-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 dark:text-slate-400 rounded-xl" onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}>
            <PanelLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xs font-bold text-gray-900 dark:text-white flex items-center font-bold tracking-wide">
            <CouncilLogo className="mr-1.5 w-4.5 h-4.5" />
            Council.
          </h1>
          <div className="flex items-center space-x-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 dark:text-slate-400 rounded-xl" onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}>
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 dark:text-slate-400 rounded-xl" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-12">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm shadow-indigo-50">
                <Bot className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Group Chat Space</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Welcome! This is your local group chat. Select or add AIs in the panel, and send a message below to start collaborating.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, idx) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  sender={message.sender}
                  timestamp={new Date(message.timestamp)}
                  index={idx}
                />
              ))}
            </div>
          )}

          {/* Typing Indicators */}
          {typingAIs.map((name) => (
            <div key={name} className="flex items-start space-x-3.5 animate-fade-in">
              <div className="w-8.5 h-8.5 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="text-gray-500 dark:text-slate-400 text-sm" size={16} />
              </div>
              <div className="flex-1 max-w-[80%]">
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold ml-1 mb-1 block uppercase tracking-wide">{name} is thinking...</span>
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl rounded-tl-none p-3.5 max-w-xs shadow-sm shadow-black/5">
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
        <div className={cn(
          "p-4 lg:p-5 flex-shrink-0 shadow-lg shadow-black/5 z-10",
          themeStyle === 'glass' ? "glass-panel" : "bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800"
        )}>
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
                className={cn(
                  "pr-12 py-5.5 rounded-xl text-sm shadow-sm focus-visible:ring-indigo-600",
                  themeStyle === 'glass'
                    ? "glass-input text-gray-900 dark:text-white border border-gray-150 dark:border-slate-800"
                    : "border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white"
                )}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg animate-fade-in"
                disabled={!messageInput.trim() || activeParticipantsCount === 0}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= COLUMN 3: RIGHT SIDEBAR (Active Collaborators & Controls) ================= */}
      <div 
        className={cn(
          "w-80 flex flex-col h-full flex-shrink-0 transition-all duration-300 z-40 lg:relative absolute inset-y-0 right-0",
          themeStyle === 'glass' ? "glass-panel" : "bg-white dark:bg-slate-900 border-l border-gray-150 dark:border-slate-800",
          isRightSidebarOpen 
            ? "translate-x-0 w-80 opacity-100" 
            : "translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none opacity-0 lg:opacity-100"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-6 flex items-center justify-between",
          themeStyle === 'glass' ? "border-b border-gray-150 dark:border-slate-800/40" : "border-b border-gray-150 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-950/20"
        )}>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="text-indigo-600 mr-2 w-4.5 h-4.5" />
            Session Hub
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-8 w-8 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            onClick={() => setIsRightSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
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
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 space-y-3 flex-shrink-0">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Execution Control
          </h3>
          
          <Button
            onClick={handleLetThemTalk}
            disabled={isAutoMode}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl h-10 shadow-sm"
          >
            <Play className="mr-2 w-3.5 h-3.5" />
            Let Them Talk
          </Button>

          <Button
            onClick={handleSendOneMessage}
            disabled={isAutoMode}
            variant="outline"
            className="w-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border-indigo-100 dark:border-slate-800 text-xs font-bold rounded-xl h-10"
          >
            <MessageCircle className="mr-2 w-3.5 h-3.5" />
            Send One Message
          </Button>

          <Button
            onClick={handleStopConversation}
            disabled={!isAutoMode}
            variant="destructive"
            className="w-full text-xs font-bold rounded-xl h-10 shadow-sm"
          >
            <Square className="mr-2 w-3.5 h-3.5" />
            Stop Conversation
          </Button>

          {/* Clear Chat button removed - users can manage chats via the sidebar */}
        </div>

        <div className={cn(
          "p-6 flex-shrink-0",
          themeStyle === 'glass' ? "border-t border-gray-150 dark:border-slate-800/40" : "border-t border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/30"
        )}>
          <Card className={cn(
            "shadow-none rounded-2xl",
            themeStyle === 'glass' ? "glass-panel" : "border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-950"
          )}>
            <CardContent className="p-4">
              <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Session Stats</h4>
              <div className="space-y-2 text-xs font-semibold text-gray-600 dark:text-slate-400">
                <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-1.5">
                  <span>Messages:</span>
                  <span className="text-gray-900 dark:text-white font-bold">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-1.5">
                  <span>Auto Messages:</span>
                  <span className="text-gray-900 dark:text-white font-bold">{stats.autoRounds}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Duration:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.duration}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
        theme={theme}
        onThemeChange={setTheme}
        themeStyle={themeStyle}
        onThemeStyleChange={setThemeStyle}
        themeColor={themeColor}
        onThemeColorChange={setThemeColor}
      />
    </div>
  );
}
