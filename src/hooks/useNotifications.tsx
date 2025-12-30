import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Event, NotificationPreferences } from '@/types';
import { isToday, isTomorrow, addDays, isWithinInterval, startOfDay, endOfDay, addHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';

// Notification sound - base64 encoded short beep
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQATU6zq5sJGABBPt/ry5l8ACU66/////wAKTrv/////AA5Otf////8AD1C0/////wAQUbH/////AA5Rsf////8AEVK4/////wAPUrr/////AA9VwP////8ADVbC/////wANWMb/////AAxYxv////8ADFDC/////wAMTr7/////AAwKR7j/////AA1Gtf////8ADUV1/////wANRHT/////AA1CdP////8ADVF0/////wANXnP/////AAxnc/////8ADG10/////wALcXX/////AAxxdv////8ADG92/////wAMbnb/////AAxudv////8ADG12/////wAMbHb/////AAw=';

export function useNotifications(events: Event[]) {
  const { user } = useAuth();
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasShownInitialNotifications, setHasShownInitialNotifications] = useState(false);

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

  // Fetch dismissed notifications
  const { data: dismissedNotifications } = useQuery({
    queryKey: ['dismissed-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('dismissed_notifications')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Dismiss notification mutation
  const dismissNotificationMutation = useMutation({
    mutationFn: async ({ notificationKey, dismissUntil }: { notificationKey: string; dismissUntil?: Date }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('dismissed_notifications')
        .upsert({
          user_id: user.id,
          notification_key: notificationKey,
          dismissed_until: dismissUntil?.toISOString() || null,
        }, {
          onConflict: 'user_id,notification_key',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dismissed-notifications'] });
    },
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

  const isNotificationDismissed = useCallback((notificationKey: string) => {
    if (!dismissedNotifications) return false;
    const dismissed = dismissedNotifications.find(d => d.notification_key === notificationKey);
    if (!dismissed) return false;
    
    // If dismissed_until is null, it's permanently dismissed
    if (!dismissed.dismissed_until) return true;
    
    // Check if snooze has expired
    return new Date(dismissed.dismissed_until) > new Date();
  }, [dismissedNotifications]);

  const handleDismiss = useCallback((notificationKey: string, toastId?: string) => {
    dismissNotificationMutation.mutate({ notificationKey });
    if (toastId) {
      dismiss(toastId);
    }
  }, [dismissNotificationMutation, dismiss]);

  const handleSnooze = useCallback((notificationKey: string, hours: number, toastId?: string) => {
    const dismissUntil = addHours(new Date(), hours);
    dismissNotificationMutation.mutate({ notificationKey, dismissUntil });
    if (toastId) {
      dismiss(toastId);
    }
  }, [dismissNotificationMutation, dismiss]);

  const showNotification = useCallback((
    title: string, 
    message: string, 
    notificationKey: string,
    type: 'upcoming' | 'missed' = 'upcoming'
  ) => {
    // Check if already dismissed
    if (isNotificationDismissed(notificationKey)) return;

    playSound();
    
    const toastResult = toast({
      title,
      description: (
        <div className="space-y-2">
          <p>{message}</p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSnooze(notificationKey, 1, toastResult.id)}
              className="h-7 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              1h
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSnooze(notificationKey, 24, toastResult.id)}
              className="h-7 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              24h
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(notificationKey, toastResult.id)}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      ),
      variant: type === 'missed' ? 'destructive' : 'default',
      duration: 30000, // 30 seconds to give time for user action
    });

    // Also try browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }, [toast, playSound, isNotificationDismissed, handleDismiss, handleSnooze]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check deadlines - only once on initial load
  useEffect(() => {
    if (!preferences || !events.length || hasShownInitialNotifications) return;

    const checkDeadlines = () => {
      const now = new Date();
      const today = startOfDay(now);

      events.forEach(event => {
        event.stages?.forEach(stage => {
          if (stage.is_completed) return;

          const deadlineEnd = new Date(stage.deadline_end);
          const deadlineStart = stage.deadline_start ? new Date(stage.deadline_start) : null;

          // Check end deadline (to date)
          const endKey = `end-${stage.id}-${deadlineEnd.toDateString()}`;
          
          // Check if deadline end is today
          if (preferences.notify_on_day && isToday(deadlineEnd)) {
            showNotification(
              `⏰ Deadline Today: ${stage.name}`,
              `${event.title} - "${stage.name}" ends today!`,
              endKey,
              'upcoming'
            );
          }

          // Check if deadline end is tomorrow
          if (preferences.notify_1_day_before && isTomorrow(deadlineEnd)) {
            showNotification(
              `📅 Deadline Tomorrow: ${stage.name}`,
              `${event.title} - "${stage.name}" ends tomorrow!`,
              `tomorrow-${stage.id}`,
              'upcoming'
            );
          }

          // Check if deadline end is in 7 days
          if (preferences.notify_7_days_before) {
            const sevenDaysFromNow = addDays(today, 7);
            if (isWithinInterval(deadlineEnd, { start: sevenDaysFromNow, end: endOfDay(sevenDaysFromNow) })) {
              showNotification(
                `🗓️ Upcoming: ${stage.name}`,
                `${event.title} - "${stage.name}" ends in 7 days!`,
                `7days-${stage.id}`,
                'upcoming'
              );
            }
          }

          // Check for missed end deadlines
          if (deadlineEnd < now) {
            showNotification(
              `❌ Missed Deadline: ${stage.name}`,
              `${event.title} - "${stage.name}" deadline has passed!`,
              `missed-end-${stage.id}`,
              'missed'
            );
          }

          // Check start deadline (from date) reminders
          if (deadlineStart) {
            const startKey = `start-${stage.id}-${deadlineStart.toDateString()}`;
            
            if (preferences.notify_on_day && isToday(deadlineStart)) {
              showNotification(
                `🚀 Starting Today: ${stage.name}`,
                `${event.title} - "${stage.name}" starts today!`,
                startKey,
                'upcoming'
              );
            }

            if (preferences.notify_1_day_before && isTomorrow(deadlineStart)) {
              showNotification(
                `📅 Starting Tomorrow: ${stage.name}`,
                `${event.title} - "${stage.name}" starts tomorrow!`,
                `tomorrow-start-${stage.id}`,
                'upcoming'
              );
            }

            if (preferences.notify_7_days_before) {
              const sevenDaysFromNow = addDays(today, 7);
              if (isWithinInterval(deadlineStart, { start: sevenDaysFromNow, end: endOfDay(sevenDaysFromNow) })) {
                showNotification(
                  `🗓️ Upcoming Start: ${stage.name}`,
                  `${event.title} - "${stage.name}" starts in 7 days!`,
                  `7days-start-${stage.id}`,
                  'upcoming'
                );
              }
            }
          }
        });
      });
    };

    // Only check once on initial load
    const timer = setTimeout(() => {
      checkDeadlines();
      setHasShownInitialNotifications(true);
    }, 2000); // Small delay to let the page load

    return () => clearTimeout(timer);
  }, [events, preferences, showNotification, hasShownInitialNotifications]);

  return {
    preferences,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
    dismissNotification: handleDismiss,
    snoozeNotification: handleSnooze,
  };
}
