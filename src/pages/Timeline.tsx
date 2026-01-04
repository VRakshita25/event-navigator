import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Calendar as CalendarIcon, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle
} from 'lucide-react';
import { format, isBefore, isToday, isTomorrow, addDays, isWithinInterval, startOfDay } from 'date-fns';
import { Event, EventFormData, EventStage } from '@/types';
import { EventDialog } from '@/components/EventDialog';
import { NavLink } from '@/components/NavLink';

interface TimelineItem {
  stage: EventStage & { deadline_start?: string | null; deadline_end: string };
  event: Event;
  date: Date;
  isStart: boolean;
}

export default function TimelinePage() {
  const { signOut } = useAuth();
  const { events, isLoading, createEvent, updateEvent, toggleStage, isCreating, isUpdating } = useEvents();
  const { categories } = useCategories();
  const { tags } = useTags();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const now = new Date();

  // Build timeline items from all stages
  const timelineItems: TimelineItem[] = events.flatMap(event => 
    (event.stages || []).flatMap(stage => {
      const items: TimelineItem[] = [];
      const stageWithDates = stage as EventStage & { deadline_start?: string | null; deadline_end: string };
      
      // Add end date
      items.push({
        stage: stageWithDates,
        event,
        date: new Date(stageWithDates.deadline_end),
        isStart: false
      });
      
      // Add start date if exists
      if (stageWithDates.deadline_start) {
        items.push({
          stage: stageWithDates,
          event,
          date: new Date(stageWithDates.deadline_start),
          isStart: true
        });
      }
      
      return items;
    })
  );

  // Filter and sort
  const filteredItems = timelineItems
    .filter(item => {
      if (filter === 'upcoming') return item.date >= startOfDay(now);
      if (filter === 'past') return item.date < startOfDay(now);
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date
  const groupedByDate = filteredItems.reduce((acc, item) => {
    const dateKey = format(item.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingEvent(null);
  };

  const handleSubmit = async (formData: EventFormData) => {
    if (editingEvent) {
      await updateEvent({ id: editingEvent.id, formData });
    } else {
      await createEvent(formData);
    }
    setEditingEvent(null);
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d');
  };

  const getItemStatus = (item: TimelineItem) => {
    if (item.stage.is_completed) return 'completed';
    if (isBefore(item.date, now)) return 'missed';
    if (isToday(item.date)) return 'today';
    if (isWithinInterval(item.date, { start: now, end: addDays(now, 7) })) return 'soon';
    return 'future';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-heading font-bold">EventFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <nav className="flex items-center gap-4">
              <NavLink 
                to="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-foreground font-medium"
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/calendar" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-foreground font-medium"
              >
                Calendar
              </NavLink>
              <NavLink 
                to="/timeline" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-foreground font-medium"
              >
                Timeline
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-heading font-bold">Timeline</h2>
          <div className="flex gap-2">
            {(['upcoming', 'past', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {Object.keys(groupedByDate).length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} deadlines</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {Object.entries(groupedByDate).map(([dateKey, items]) => (
              <div key={dateKey} className="mb-8">
                {/* Date header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
                    <CalendarIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold">
                    {getDateLabel(dateKey)}
                  </h3>
                </div>

                {/* Items for this date */}
                <div className="ml-12 space-y-3">
                  {items.map((item, idx) => {
                    const status = getItemStatus(item);
                    return (
                      <Card 
                        key={`${item.stage.id}-${item.isStart ? 'start' : 'end'}-${idx}`}
                        className={`glass cursor-pointer hover:shadow-md transition-all ${
                          status === 'missed' ? 'border-destructive/50' :
                          status === 'today' ? 'border-warning/50' :
                          status === 'completed' ? 'border-success/50' : ''
                        }`}
                        onClick={() => handleEdit(item.event)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {/* Status icon */}
                              <div className="mt-0.5">
                                {status === 'completed' ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : status === 'missed' ? (
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant={item.isStart ? 'outline' : 'default'}
                                    className={item.isStart ? 'border-success text-success' : 'bg-primary'}
                                  >
                                    {item.isStart ? 'Starts' : 'Deadline'}
                                  </Badge>
                                  {item.event.category && (
                                    <Badge 
                                      style={{ backgroundColor: item.event.category.color }}
                                      className="text-white text-xs"
                                    >
                                      {item.event.category.name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium">{item.stage.name}</p>
                                <p className="text-sm text-muted-foreground">{item.event.title}</p>
                              </div>
                            </div>
                            
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(item.date, 'HH:mm')}
                              </div>
                            </div>
                          </div>
                          
                          {/* Toggle completion */}
                          {!item.isStart && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <Button
                                size="sm"
                                variant={item.stage.is_completed ? 'outline' : 'default'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStage({ stageId: item.stage.id, isCompleted: !item.stage.is_completed });
                                }}
                              >
                                {item.stage.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        event={editingEvent}
        categories={categories}
        tags={tags}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
