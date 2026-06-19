import { Badge } from '@/components/ui/badge';
import { Bot, Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiParticipant } from '@/lib/storage';

interface AiStatusPanelProps {
  participants: AiParticipant[];
}

const statusConfig = {
  online: {
    label: 'Online',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  rate_limited: {
    label: 'Rate Limited',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500'
  },
  offline: {
    label: 'Offline',
    badgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400'
  }
};

export function AiStatusPanel({ participants }: AiStatusPanelProps) {
  // Only show active participants in the side panel status
  const activeParticipants = participants.filter(p => p.isActive);

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
          activeParticipants.map((participant) => {
            const isGemini = participant.apiType === 'gemini';
            const statusConf = statusConfig[participant.status as keyof typeof statusConfig] || statusConfig.online;
            
            // Dynamic styling based on API format
            const bgColor = isGemini ? 'bg-blue-50/70 border-blue-100/50' : 'bg-indigo-50/70 border-indigo-100/50';
            const textColor = isGemini ? 'text-blue-700' : 'text-indigo-700';
            const Icon = isGemini ? Bot : Cpu;

            return (
              <div 
                key={participant.id} 
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all duration-200', 
                  bgColor
                )}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-gray-100/80", textColor)}>
                      <Icon className="w-4 h-4" />
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
                <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0', statusConf.badgeColor)}>
                  {statusConf.label}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
