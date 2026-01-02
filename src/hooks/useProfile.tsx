import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setProfile({
          display_name: data.display_name || null,
          avatar_url: data.avatar_url || null,
          bio: data.bio || null,
          date_of_birth: data.date_of_birth || null,
          phone: data.phone || null,
          location: data.location || null,
          website: data.website || null,
        });
      }
      setIsLoading(false);
    };

    fetchProfile();

    // Subscribe to profile changes
    if (user) {
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              const newData = payload.new as any;
              setProfile({
                display_name: newData.display_name || null,
                avatar_url: newData.avatar_url || null,
                bio: newData.bio || null,
                date_of_birth: newData.date_of_birth || null,
                phone: newData.phone || null,
                location: newData.location || null,
                website: newData.website || null,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return { profile, isLoading, getInitials };
}
