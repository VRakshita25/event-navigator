import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Event, EventStage, NotificationPreferences } from '@/types';
import { isToday, isTomorrow, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Notification sound - base64 encoded short beep
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQATU6zq5sJGABBPt/ry5l8ACU66/////wAKTrv/////AA5Otf////8AD1C0/////wAQUbH/////AA5Rsf////8AEVK4/////wAPUrr/////AA9VwP////8ADVbC/////wANWMb/////AAxYxv////8ADFDC/////wAMTr7/////AAwKR7j/////AA1Gtf////8ADUV1/////wANRHT/////AA1CdP////8ADVF0/////wANXnP/////AAxnc/////8ADG10/////wALcXX/////AAxxdv////8ADG92/////wAMbnb/////AAxudv////8ADG12/////wAMbHb/////AAw=';

export function useNotifications(events: Event[]) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Fetch notification preferences
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (preferences?.sound_enabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [preferences?.sound_enabled]);

  const showNotification = useCallback((title: string, message: string, type: 'upcoming' | 'missed' = 'upcoming') => {
    playSound();
    toast({
      title,
      description: message,
      variant: type === 'missed' ? 'destructive' : 'default',
      duration: 10000,
    });

    // Also try browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }, [toast, playSound]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check deadlines periodically
  useEffect(() => {
    if (!preferences || !events.length) return;

    const checkDeadlines = () => {
      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);
      const in7Days = addDays(today, 7);

      events.forEach(event => {
        event.stages?.forEach(stage => {
          if (stage.is_completed) return;

          const deadline = new Date(stage.deadline);
          const notificationKey = `${stage.id}-${deadline.toDateString()}`;

          if (notifiedRef.current.has(notificationKey)) return;

          // Check if deadline is today
          if (preferences.notify_on_day && isToday(deadline)) {
            showNotification(
              `⏰ Deadline Today: ${stage.name}`,
              `${event.title} - Stage "${stage.name}" is due today!`,
              'upcoming'
            );
            notifiedRef.current.add(notificationKey);
          }

          // Check if deadline is tomorrow
          if (preferences.notify_1_day_before && isTomorrow(deadline)) {
            showNotification(
              `📅 Deadline Tomorrow: ${stage.name}`,
              `${event.title} - Stage "${stage.name}" is due tomorrow!`,
              'upcoming'
            );
            notifiedRef.current.add(notificationKey);
          }

          // Check if deadline is in 7 days
          if (preferences.notify_7_days_before) {
            const sevenDaysFromNow = addDays(today, 7);
            if (isWithinInterval(deadline, { start: sevenDaysFromNow, end: endOfDay(sevenDaysFromNow) })) {
              showNotification(
                `🗓️ Upcoming: ${stage.name}`,
                `${event.title} - Stage "${stage.name}" is due in 7 days!`,
                'upcoming'
              );
              notifiedRef.current.add(notificationKey);
            }
          }

          // Check for missed deadlines
          if (deadline < now) {
            const missedKey = `missed-${stage.id}`;
            if (!notifiedRef.current.has(missedKey)) {
              showNotification(
                `❌ Missed Deadline: ${stage.name}`,
                `${event.title} - Stage "${stage.name}" deadline has passed!`,
                'missed'
              );
              notifiedRef.current.add(missedKey);
            }
          }
        });
      });
    };

    // Check immediately and then every minute
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);

    return () => clearInterval(interval);
  }, [events, preferences, showNotification]);

  return {
    preferences,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
