import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Cpu, 
  Sparkles, 
  User, 
  Zap, 
  Code, 
  Terminal, 
  Smile, 
  MessageSquare,
  GripVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiParticipant } from '@/lib/storage';

interface AiStatusPanelProps {
  participants: AiParticipant[];
  onReorder: (participants: AiParticipant[]) => void;
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

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string; badge: string }> = {
  blue: {
    bg: 'bg-blue-50/70 border-blue-100/50',
    border: 'border-blue-200/50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  purple: {
    bg: 'bg-purple-50/70 border-purple-100/50',
    border: 'border-purple-200/50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  emerald: {
    bg: 'bg-emerald-50/70 border-emerald-100/50',
    border: 'border-emerald-200/50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  orange: {
    bg: 'bg-orange-50/70 border-orange-100/50',
    border: 'border-orange-200/50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  rose: {
    bg: 'bg-rose-50/70 border-rose-100/50',
    border: 'border-rose-200/50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  amber: {
    bg: 'bg-amber-50/70 border-amber-100/50',
    border: 'border-amber-200/50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  indigo: {
    bg: 'bg-indigo-50/70 border-indigo-100/50',
    border: 'border-indigo-200/50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
};

const statusConfig = {
  online: {
    label: 'Online',
    dotColor: 'bg-emerald-500'
  },
  rate_limited: {
    label: 'Rate Limited',
    dotColor: 'bg-amber-500'
  },
  offline: {
    label: 'Offline',
    dotColor: 'bg-gray-400'
  }
};

export function AiStatusPanel({ participants, onReorder }: AiStatusPanelProps) {
  // Only show active participants in the side panel status
  const activeParticipants = participants.filter(p => p.isActive);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetActiveIdx: number) => {
    const sourceActiveIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceActiveIdx === targetActiveIdx) return;

    const draggedItem = activeParticipants[sourceActiveIdx];
    const targetItem = activeParticipants[targetActiveIdx];

    const updated = [...participants];
    const sourceIdx = participants.findIndex(p => p.id === draggedItem.id);
    const targetIdx = participants.findIndex(p => p.id === targetItem.id);

    const [removed] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, removed);

    onReorder(updated);
  };

  return (
    <div className="p-6 border-b border-gray-150">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Active Collaborators ({activeParticipants.length})
        </h3>
      </div>
      
      <div className="space-y-2.5">
        {activeParticipants.length === 0 ? (
          <div className="text-center py-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
            <span className="text-xs text-gray-400 font-medium italic">No active AIs in chat</span>
          </div>
        ) : (
          activeParticipants.map((participant, index) => {
            const statusConf = statusConfig[participant.status as keyof typeof statusConfig] || statusConfig.online;
            
            const iconName = participant.icon || 'bot';
            const colorName = participant.color || 'indigo';

            const Icon = iconMap[iconName] || Bot;
            const colors = colorMap[colorName] || colorMap.indigo;

            return (
              <div 
                key={participant.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-sm bg-white', 
                  colors.bg
                )}
                title="Drag to change reply sequence"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100/80">
                      <Icon className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white', statusConf.dotColor)} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-900 block truncate leading-tight">
                      {participant.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate block">
                      {participant.model}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge variant="outline" className={cn('text-[9px] font-bold px-1.5 py-0 rounded-full capitalize', colors.badge)}>
                    {statusConf.label}
                  </Badge>
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
