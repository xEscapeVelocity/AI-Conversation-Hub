import { format } from 'date-fns';
import { 
  Bot, 
  Cpu, 
  Sparkles, 
  User, 
  Zap, 
  Code, 
  Terminal, 
  Smile, 
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';

interface ChatMessageProps {
  content: string;
  sender: string;
  timestamp: Date;
}

const iconMap: Record<string, any> = {
  bot: Bot,
  cpu: Cpu,
  sparkles: Sparkles,
  user: User,
  zap: Zap,
  code: Code,
  terminal: Terminal,
  smile: Smile,
  messagesquare: MessageSquare
};

const colorMap: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-600/10',
    text: 'text-blue-600',
    shadow: 'shadow-blue-100/50'
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-600/10',
    text: 'text-purple-600',
    shadow: 'shadow-purple-100/50'
  },
  emerald: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600/10',
    text: 'text-emerald-600',
    shadow: 'shadow-emerald-100/50'
  },
  orange: {
    bg: 'bg-orange-500',
    border: 'border-orange-600/10',
    text: 'text-orange-600',
    shadow: 'shadow-orange-100/50'
  },
  rose: {
    bg: 'bg-rose-500',
    border: 'border-rose-600/10',
    text: 'text-rose-600',
    shadow: 'shadow-rose-100/50'
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-600/10',
    text: 'text-amber-600',
    shadow: 'shadow-amber-100/50'
  },
  indigo: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600/10',
    text: 'text-indigo-600',
    shadow: 'shadow-indigo-100/50'
  }
};

export function ChatMessage({ content, sender, timestamp }: ChatMessageProps) {
  const isUser = sender.toLowerCase() === 'user' || sender === 'You';
  
  // Find AI settings in storage
  const participants = storage.getAiParticipants();
  const participant = participants.find(p => p.name.toLowerCase() === sender.toLowerCase());

  const iconName = isUser ? 'user' : (participant?.icon || 'bot');
  const colorName = isUser ? 'purple' : (participant?.color || 'indigo');

  const Icon = iconMap[iconName] || Bot;
  const colors = colorMap[colorName] || colorMap.indigo;

  const displayName = isUser ? 'You' : sender;

  const messageStyle = isUser 
    ? 'bg-purple-600 text-white shadow-sm shadow-purple-100/50 rounded-2xl rounded-tr-none border border-purple-700/10' 
    : 'bg-white border border-gray-150 shadow-sm rounded-2xl rounded-tl-none text-gray-800';

  return (
    <div className={cn('flex items-start space-x-3.5', isUser && 'flex-row-reverse space-x-reverse')}>
      <div className={cn('w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 text-white', colors.bg)}>
        <Icon className="text-white text-sm" size={16} />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className={cn('flex items-center space-x-2 mb-1', isUser && 'justify-end')}>
          <span className="font-semibold text-sm text-gray-900">{displayName}</span>
          <span className="text-[10px] text-gray-400 font-medium">
            {format(timestamp, 'h:mm a')}
          </span>
        </div>
        <div className={cn('p-3.5 text-sm leading-relaxed whitespace-pre-wrap', messageStyle)}>
          {content}
        </div>
      </div>
    </div>
  );
}
