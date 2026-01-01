import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useNotifications } from '@/hooks/useNotifications';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Plus, 
  LogOut, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Search,
  Filter,
  Bell,
  Volume2,
  VolumeX,
  Settings,
  User
} from 'lucide-react';
import { isToday, isThisWeek } from 'date-fns';
import { Event, EventFormData, Priority } from '@/types';
import { EventDialog } from '@/components/EventDialog';
import { EventCard } from '@/components/EventCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { events, isLoading, createEvent, updateEvent, toggleStage, deleteEvent, isCreating, isUpdating } = useEvents();
  const { categories } = useCategories();
  const { tags } = useTags();
  const { preferences, updatePreferences } = useNotifications(events);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created');

  const handleCreateEvent = async (formData: EventFormData) => {
    await createEvent(formData);
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (editingEvent) {
      await updateEvent({ id: editingEvent.id, formData });
      setEditingEvent(null);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingEvent(null);
  };

  // Analytics calculations
  const now = new Date();
  const allStages = events.flatMap(e => e.stages || []);
  const upcomingStages = allStages.filter(s => !s.is_completed && new Date(s.deadline_end) > now);
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const todayDeadlines = upcomingStages.filter(s => isToday(new Date(s.deadline_end))).length;
  const weekDeadlines = upcomingStages.filter(s => isThisWeek(new Date(s.deadline_end))).length;

  // Filter and sort events
  let filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags?.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || event.category_id === filterCategory;
    const matchesPriority = filterPriority === 'all' || event.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Sort
  filteredEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        const aDeadline = a.stages?.[0]?.deadline_end || a.created_at;
        const bDeadline = b.stages?.[0]?.deadline_end || b.created_at;
        return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

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
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-heading font-bold">EventFlow</h1>
          </div>
          <nav className="hidden md:flex items-center gap-4">
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
            <NavLink 
              to="/settings" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-medium"
            >
              Settings
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {/* Notification settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {todayDeadlines > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                      {todayDeadlines}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Notification Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound" className="flex items-center gap-2">
                      {preferences?.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Sound Alerts
                    </Label>
                    <Switch
                      id="sound"
                      checked={preferences?.sound_enabled ?? true}
                      onCheckedChange={(checked) => updatePreferences({ sound_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="on-day">On the day</Label>
                    <Switch
                      id="on-day"
                      checked={preferences?.notify_on_day ?? true}
                      onCheckedChange={(checked) => updatePreferences({ notify_on_day: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="1-day">1 day before</Label>
                    <Switch
                      id="1-day"
                      checked={preferences?.notify_1_day_before ?? true}
                      onCheckedChange={(checked) => updatePreferences({ notify_1_day_before: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="7-days">7 days before</Label>
                    <Switch
                      id="7-days"
                      checked={preferences?.notify_7_days_before ?? true}
                      onCheckedChange={(checked) => updatePreferences({ notify_7_days_before: checked })}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <NavLink to="/profile" className="block">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </div>
                </NavLink>
                <NavLink to="/settings" className="block">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </div>
                </NavLink>
                <DropdownMenuSeparator />
                <div 
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-3xl font-heading font-bold">{events.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-heading font-bold">{completedEvents}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-3xl font-heading font-bold">{todayDeadlines}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-3xl font-heading font-bold">{weekDeadlines}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter, and Add */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest First</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {searchQuery || filterCategory !== 'all' || filterPriority !== 'all' 
                    ? 'No matching events' 
                    : 'No events yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterCategory !== 'all' || filterPriority !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first event to get started'}
                </p>
                {!searchQuery && filterCategory === 'all' && filterPriority === 'all' && (
                  <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" /> Create Event
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStage={(stageId, isCompleted) => toggleStage({ stageId, isCompleted })}
              />
            ))
          )}
        </div>
      </main>

      {/* Event Dialog */}
      <EventDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        event={editingEvent}
        categories={categories}
        tags={tags}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
