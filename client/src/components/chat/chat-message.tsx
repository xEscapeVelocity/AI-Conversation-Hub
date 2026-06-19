import { format } from 'date-fns';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  sender: string;
  timestamp: Date;
}

export function ChatMessage({ content, sender, timestamp }: ChatMessageProps) {
  const isUser = sender.toLowerCase() === 'user' || sender === 'You';
  
  const displayName = isUser ? 'You' : sender;
  const Icon = isUser ? User : Bot;

  // Colors based on sender
  const bgColor = isUser 
    ? 'bg-purple-500' 
    : sender.toLowerCase().includes('gemini') 
      ? 'bg-blue-500' 
      : 'bg-indigo-500';

  const messageStyle = isUser 
    ? 'bg-purple-600 text-white shadow-sm shadow-purple-100/50 rounded-2xl rounded-tr-none border border-purple-700/10' 
    : 'bg-white border border-gray-150 shadow-sm rounded-2xl rounded-tl-none text-gray-800';

  return (
    <div className={cn('flex items-start space-x-3.5', isUser && 'flex-row-reverse space-x-reverse')}>
      <div className={cn('w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5', bgColor)}>
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
