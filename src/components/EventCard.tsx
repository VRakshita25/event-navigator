import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Building, 
  Link as LinkIcon, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { Event, Priority } from '@/types';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onToggleStage: (stageId: string, isCompleted: boolean) => void;
}

export function EventCard({ event, onEdit, onDelete, onToggleStage }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const now = new Date();

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-priority-high text-white';
      case 'medium': return 'bg-priority-medium text-white';
      case 'low': return 'bg-priority-low text-white';
    }
  };

  const completedStages = event.stages?.filter(s => s.is_completed).length || 0;
  const totalStages = event.stages?.length || 0;
  const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <Card className="glass hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        {/* Progress bar */}
        {totalStages > 0 && (
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {event.category && (
                  <Badge style={{ backgroundColor: event.category.color }} className="text-white">
                    {event.category.name}
                  </Badge>
                )}
                <Badge className={getPriorityColor(event.priority)}>
                  {event.priority}
                </Badge>
                {event.attachments && event.attachments.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Paperclip className="h-3 w-3" />
                    {event.attachments.length}
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-heading font-semibold truncate">{event.title}</h3>
              
              {/* Description */}
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
              )}
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.venue}
                  </span>
                )}
                {event.organizer && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {event.organizer}
                  </span>
                )}
                {event.registration_link && (
                  <a 
                    href={event.registration_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Register
                  </a>
                )}
              </div>
              
              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {event.tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      style={{ borderColor: tag.color, color: tag.color }}
                      className="text-xs"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(event.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stages toggle */}
          {event.stages && event.stages.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <span>{completedStages}/{totalStages} stages completed</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          
          {/* Expanded stages */}
          {expanded && event.stages && (
            <div className="mt-4 space-y-2">
              {event.stages.map((stage) => {
                const isPast = isBefore(new Date(stage.deadline_end), now) && !stage.is_completed;
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      stage.is_completed ? 'bg-success/10' : 
                      isPast ? 'bg-destructive/10' : 'bg-muted/50'
                    }`}
                  >
                    <button
                      onClick={() => onToggleStage(stage.id, !stage.is_completed)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        stage.is_completed ? 'bg-success border-success' : 'border-muted-foreground hover:border-primary'
                      }`}
                    >
                      {stage.is_completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </button>
                    <span className={`flex-1 ${stage.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {stage.name}
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${
                      isPast ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {format(new Date(stage.deadline_end), 'MMM d, HH:mm')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Attachments */}
          {expanded && event.attachments && event.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Attachments</p>
              <div className="space-y-1">
                {event.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
