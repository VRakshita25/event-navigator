import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Link as LinkIcon, Upload, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Event, EventFormData, Priority, Category, Tag } from '@/types';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  categories: Category[];
  tags: Tag[];
  onSubmit: (formData: EventFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  categories,
  tags,
  onSubmit,
  isSubmitting,
}: EventDialogProps) {
  const isEditing = !!event;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    venue: '',
    organizer: '',
    registration_link: '',
    priority: 'medium',
    category_id: '',
    notes: '',
    stages: [{ name: '', deadline_start: null, deadline_end: null }],
    tag_ids: [],
    attachments: [],
  });

  const [newLink, setNewLink] = useState({ name: '', url: '' });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        venue: event.venue || '',
        organizer: event.organizer || '',
        registration_link: event.registration_link || '',
        priority: event.priority,
        category_id: event.category_id || '',
        notes: event.notes || '',
        event_date: event.event_date ? new Date(event.event_date) : undefined,
        stages: event.stages?.map(s => ({
          id: s.id,
          name: s.name,
          deadline_start: s.deadline_start ? new Date(s.deadline_start) : null,
          deadline_end: new Date(s.deadline_end),
          is_completed: s.is_completed,
        })) || [{ name: '', deadline_start: null, deadline_end: null }],
        tag_ids: event.tags?.map(t => t.id) || [],
        attachments: event.attachments?.map(a => ({
          name: a.name,
          type: a.type,
          url: a.url,
        })) || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        venue: '',
        organizer: '',
        registration_link: '',
        priority: 'medium',
        category_id: '',
        notes: '',
        stages: [{ name: '', deadline_start: null, deadline_end: null }],
        tag_ids: [],
        attachments: [],
      });
    }
  }, [event, open]);

  const handleSubmit = async () => {
    if (!formData.title) return;
    await onSubmit(formData);
    onOpenChange(false);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [...formData.stages, { name: '', deadline_start: null, deadline_end: null }],
    });
  };

  const removeStage = (index: number) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index),
    });
  };

  const updateStage = (index: number, field: 'name' | 'deadline_start' | 'deadline_end', value: string | Date | null) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  const toggleTag = (tagId: string) => {
    setFormData({
      ...formData,
      tag_ids: formData.tag_ids.includes(tagId)
        ? formData.tag_ids.filter(id => id !== tagId)
        : [...formData.tag_ids, tagId],
    });
  };

  const addLink = () => {
    if (!newLink.name || !newLink.url) return;
    setFormData({
      ...formData,
      attachments: [...(formData.attachments || []), { ...newLink, type: 'link' }],
    });
    setNewLink({ name: '', url: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map(file => ({
      name: file.name,
      type: 'file' as const,
      url: URL.createObjectURL(file),
      file,
    }));

    setFormData({
      ...formData,
      attachments: [...(formData.attachments || []), ...newAttachments],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
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
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
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
                <Select 
                  value={formData.priority} 
                  onValueChange={(v: Priority) => setFormData({ ...formData, priority: v })}
                >
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
              
              <div className="col-span-2">
                <Label>Registration Link</Label>
                <Input
                  value={formData.registration_link}
                  onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Personal notes..."
                  rows={2}
                />
              </div>
              
              {/* Tags */}
              <div className="col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={formData.tag_ids.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: formData.tag_ids.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: formData.tag_ids.includes(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags created yet</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stages" className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label>Stages / Deadlines</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  From date is optional. Only add it if the stage has a start date.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addStage}>
                <Plus className="h-3 w-3 mr-1" /> Add Stage
              </Button>
            </div>
            <div className="space-y-3">
              {formData.stages.map((stage, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Stage name (e.g., Registration)"
                      value={stage.name}
                      onChange={(e) => updateStage(idx, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {formData.stages.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStage(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">From (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={stage.deadline_start instanceof Date 
                          ? format(stage.deadline_start, "yyyy-MM-dd'T'HH:mm") 
                          : stage.deadline_start 
                            ? format(new Date(stage.deadline_start), "yyyy-MM-dd'T'HH:mm")
                            : ''}
                        onChange={(e) => updateStage(idx, 'deadline_start', e.target.value ? new Date(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">To / Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={stage.deadline_end instanceof Date 
                          ? format(stage.deadline_end, "yyyy-MM-dd'T'HH:mm") 
                          : stage.deadline_end 
                            ? format(new Date(stage.deadline_end), "yyyy-MM-dd'T'HH:mm")
                            : ''}
                        onChange={(e) => updateStage(idx, 'deadline_end', e.target.value ? new Date(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="attachments" className="space-y-4 py-4">
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Files
                </Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, Word, Excel, PowerPoint, and images
                  </p>
                </div>
              </div>

              {/* Link Input */}
              <div>
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Add Link
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Link name"
                    value={newLink.name}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addLink}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Attachment list */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Attachments ({formData.attachments.length})</Label>
                  {formData.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {att.type === 'file' ? (
                          <FileText className="h-4 w-4 text-primary" />
                        ) : (
                          <LinkIcon className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium">{att.name}</span>
                        {att.type === 'link' && (
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate max-w-[200px]"
                          >
                            {att.url}
                          </a>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAttachment(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1 gradient-primary" 
            disabled={isSubmitting || !formData.title}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
