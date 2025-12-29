export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'missed';

export interface EventAttachment {
  id: string;
  event_id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  venue: string | null;
  organizer: string | null;
  registration_link: string | null;
  priority: Priority;
  status: EventStatus;
  notes: string | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  stages?: EventStage[];
  tags?: Tag[];
  attachments?: EventAttachment[];
}

export interface EventStage {
  id: string;
  event_id: string;
  name: string;
  deadline_start: string | null;
  deadline_end: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface EventTag {
  id: string;
  event_id: string;
  tag_id: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notify_on_day: boolean;
  notify_1_day_before: boolean;
  notify_7_days_before: boolean;
  sound_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DismissedNotification {
  id: string;
  user_id: string;
  notification_key: string;
  dismissed_until: string | null;
  created_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  venue?: string;
  organizer?: string;
  registration_link?: string;
  priority: Priority;
  category_id?: string;
  notes?: string;
  event_date?: Date;
  stages: {
    id?: string;
    name: string;
    deadline_start?: Date | null;
    deadline_end?: Date | null;
    is_completed?: boolean;
  }[];
  tag_ids: string[];
  attachments?: {
    name: string;
    type: 'file' | 'link';
    url: string;
    file?: File;
  }[];
}

export interface AnalyticsData {
  totalEvents: number;
  completedEvents: number;
  upcomingDeadlines: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  completedStages: number;
  missedStages: number;
  categoryDistribution: { name: string; count: number; color: string }[];
}
