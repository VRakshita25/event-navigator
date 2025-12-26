import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Event, EventStage, EventFormData, Priority, EventStatus } from '@/types';
import { useToast } from './use-toast';

export function useEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const eventsQuery = useQuery({
    queryKey: ['events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          category:categories(*),
          stages:event_stages(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch tags for each event
      const eventIds = events?.map(e => e.id) || [];
      const { data: eventTags } = await supabase
        .from('event_tags')
        .select('event_id, tag_id, tags(*)')
        .in('event_id', eventIds);

      const { data: allTags } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id);

      // Map tags to events
      return (events || []).map(event => ({
        ...event,
        priority: event.priority as Priority,
        status: event.status as EventStatus,
        stages: (event.stages || []).sort((a: EventStage, b: EventStage) => a.sort_order - b.sort_order),
        tags: eventTags
          ?.filter(et => et.event_id === event.id)
          .map(et => allTags?.find(t => t.id === et.tag_id))
          .filter(Boolean) || [],
      })) as Event[];
    },
    enabled: !!user,
  });

  const createEventMutation = useMutation({
    mutationFn: async (formData: EventFormData) => {
      if (!user) throw new Error('Not authenticated');

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          venue: formData.venue || null,
          organizer: formData.organizer || null,
          registration_link: formData.registration_link || null,
          priority: formData.priority,
          category_id: formData.category_id || null,
          notes: formData.notes || null,
          event_date: formData.event_date?.toISOString() || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create stages
      if (formData.stages.length > 0) {
        const { error: stagesError } = await supabase
          .from('event_stages')
          .insert(
            formData.stages.map((stage, index) => ({
              event_id: event.id,
              name: stage.name,
              deadline: stage.deadline.toISOString(),
              sort_order: index,
            }))
          );

        if (stagesError) throw stagesError;
      }

      // Create event tags
      if (formData.tag_ids.length > 0) {
        const { error: tagsError } = await supabase
          .from('event_tags')
          .insert(
            formData.tag_ids.map(tagId => ({
              event_id: event.id,
              tag_id: tagId,
            }))
          );

        if (tagsError) throw tagsError;
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event created',
        description: 'Your event has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: EventFormData }) => {
      if (!user) throw new Error('Not authenticated');

      // Update event
      const { error: eventError } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description || null,
          venue: formData.venue || null,
          organizer: formData.organizer || null,
          registration_link: formData.registration_link || null,
          priority: formData.priority,
          category_id: formData.category_id || null,
          notes: formData.notes || null,
          event_date: formData.event_date?.toISOString() || null,
        })
        .eq('id', id);

      if (eventError) throw eventError;

      // Delete existing stages and recreate
      await supabase.from('event_stages').delete().eq('event_id', id);
      
      if (formData.stages.length > 0) {
        const { error: stagesError } = await supabase
          .from('event_stages')
          .insert(
            formData.stages.map((stage, index) => ({
              event_id: id,
              name: stage.name,
              deadline: stage.deadline.toISOString(),
              sort_order: index,
            }))
          );

        if (stagesError) throw stagesError;
      }

      // Delete existing tags and recreate
      await supabase.from('event_tags').delete().eq('event_id', id);
      
      if (formData.tag_ids.length > 0) {
        const { error: tagsError } = await supabase
          .from('event_tags')
          .insert(
            formData.tag_ids.map(tagId => ({
              event_id: id,
              tag_id: tagId,
            }))
          );

        if (tagsError) throw tagsError;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event deleted',
        description: 'The event has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleStageMutation = useMutation({
    mutationFn: async ({ stageId, isCompleted }: { stageId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('event_stages')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', stageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EventStatus }) => {
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    toggleStage: toggleStageMutation.mutate,
    updateEventStatus: updateEventStatusMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
  };
}