import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { Event, EventFormData } from '@/types';
import { EventDialog } from '@/components/EventDialog';
import { NavLink } from '@/components/NavLink';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { events, isLoading, createEvent, updateEvent, isCreating, isUpdating } = useEvents();
  const { categories } = useCategories();
  const { tags } = useTags();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Get all stages with their dates
  const getStagesForDate = (date: Date) => {
    return events.flatMap(event => 
      (event.stages || []).filter(stage => {
        const startDate = stage.deadline_start ? new Date(stage.deadline_start) : null;
        const endDate = new Date(stage.deadline_end);
        return (startDate && isSameDay(startDate, date)) || isSameDay(endDate, date);
      }).map(stage => ({ ...stage, event }))
    );
  };

  // Get events with deadlines on a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.stages?.some(stage => {
        const startDate = stage.deadline_start ? new Date(stage.deadline_start) : null;
        const endDate = new Date(stage.deadline_end);
        return (startDate && isSameDay(startDate, date)) || isSameDay(endDate, date);
      })
    );
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateStages = getStagesForDate(selectedDate);

  // Dates with events for highlighting
  const datesWithEvents = events.flatMap(event => 
    (event.stages || []).flatMap(stage => {
      const dates = [new Date(stage.deadline_end)];
      if (stage.deadline_start) dates.push(new Date(stage.deadline_start));
      return dates;
    })
  );

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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="lg:col-span-2 glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-bold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                modifiers={{
                  hasEvent: (date) => datesWithEvents.some(d => isSameDay(d, date)),
                }}
                modifiersStyles={{
                  hasEvent: { 
                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                    fontWeight: 'bold'
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card className="glass">
            <CardContent className="p-6">
              <h3 className="text-lg font-heading font-semibold mb-4">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>

              {selectedDateStages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No deadlines on this date</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateStages.map((stage) => {
                    const isStart = stage.deadline_start && isSameDay(new Date(stage.deadline_start), selectedDate);
                    return (
                      <div 
                        key={stage.id} 
                        className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleEdit(stage.event)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={isStart ? 'outline' : 'default'}
                            className={isStart ? 'border-success text-success' : 'bg-primary'}
                          >
                            {isStart ? 'Starts' : 'Ends'}
                          </Badge>
                          {stage.is_completed && (
                            <Badge variant="outline" className="border-success text-success">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{stage.name}</p>
                        <p className="text-sm text-muted-foreground">{stage.event.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(isStart ? stage.deadline_start! : stage.deadline_end), 'HH:mm')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
