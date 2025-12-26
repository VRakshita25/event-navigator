import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, LogOut, Clock, CheckCircle2, AlertCircle, Target, TrendingUp, X } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isBefore } from 'date-fns';
import { Event, EventFormData, Priority } from '@/types';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { events, isLoading, createEvent, toggleStage, deleteEvent, isCreating } = useEvents();
  const { categories } = useCategories();
  const { tags } = useTags();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    venue: '',
    organizer: '',
    priority: 'medium',
    category_id: '',
    stages: [{ name: '', deadline: new Date() }],
    tag_ids: [],
  });

  const handleCreateEvent = async () => {
    if (!formData.title) return;
    await createEvent(formData);
    setFormData({
      title: '',
      description: '',
      venue: '',
      organizer: '',
      priority: 'medium',
      category_id: '',
      stages: [{ name: '', deadline: new Date() }],
      tag_ids: [],
    });
    setIsAddDialogOpen(false);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [...formData.stages, { name: '', deadline: new Date() }],
    });
  };

  const removeStage = (index: number) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index),
    });
  };

  const updateStage = (index: number, field: 'name' | 'deadline', value: string | Date) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  // Analytics calculations
  const now = new Date();
  const allStages = events.flatMap(e => e.stages || []);
  const upcomingStages = allStages.filter(s => !s.is_completed && new Date(s.deadline) > now);
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const todayDeadlines = upcomingStages.filter(s => isToday(new Date(s.deadline))).length;
  const weekDeadlines = upcomingStages.filter(s => isThisWeek(new Date(s.deadline))).length;
  const monthDeadlines = upcomingStages.filter(s => isThisMonth(new Date(s.deadline))).length;

  // Filter events
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-priority-high text-white';
      case 'medium': return 'bg-priority-medium text-white';
      case 'low': return 'bg-priority-low text-white';
    }
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
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-heading font-bold">EventFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
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

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Event Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Hackathon 2024"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event details..."
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v: Priority) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Location"
                    />
                  </div>
                  <div>
                    <Label>Organizer</Label>
                    <Input
                      value={formData.organizer}
                      onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                      placeholder="Organization name"
                    />
                  </div>
                </div>

                {/* Stages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Stages / Deadlines</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addStage}>
                      <Plus className="h-3 w-3 mr-1" /> Add Stage
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.stages.map((stage, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="Stage name (e.g., Registration)"
                          value={stage.name}
                          onChange={(e) => updateStage(idx, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="datetime-local"
                          value={stage.deadline instanceof Date ? format(stage.deadline, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => updateStage(idx, 'deadline', new Date(e.target.value))}
                          className="w-48"
                        />
                        {formData.stages.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeStage(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreateEvent} className="w-full gradient-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to get started</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="glass hover:shadow-lg transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {event.category && (
                          <Badge style={{ backgroundColor: event.category.color }} className="text-white">
                            {event.category.name}
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-heading font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      
                      {/* Stages */}
                      {event.stages && event.stages.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {event.stages.map((stage) => (
                            <div
                              key={stage.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                stage.is_completed ? 'bg-success/10' : 
                                isBefore(new Date(stage.deadline), now) ? 'bg-destructive/10' : 'bg-muted'
                              }`}
                            >
                              <button
                                onClick={() => toggleStage({ stageId: stage.id, isCompleted: !stage.is_completed })}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  stage.is_completed ? 'bg-success border-success' : 'border-muted-foreground'
                                }`}
                              >
                                {stage.is_completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </button>
                              <span className={stage.is_completed ? 'line-through text-muted-foreground' : ''}>
                                {stage.name}
                              </span>
                              <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(stage.deadline), 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEvent(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}