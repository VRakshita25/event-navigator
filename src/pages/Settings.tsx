import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Bell, 
  Volume2, 
  Palette, 
  Shield, 
  LogOut,
  ArrowLeft,
  User,
  Trash2,
  Download,
  Moon,
  Sun
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NotificationPreferences {
  notify_on_day: boolean;
  notify_1_day_before: boolean;
  notify_7_days_before: boolean;
  sound_enabled: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_on_day: true,
    notify_1_day_before: true,
    notify_7_days_before: true,
    sound_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const fetchPreferences = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setPreferences({
          notify_on_day: data.notify_on_day ?? true,
          notify_1_day_before: data.notify_1_day_before ?? true,
          notify_7_days_before: data.notify_7_days_before ?? true,
          sound_enabled: data.sound_enabled ?? true,
        });
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    
    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsSaving(true);

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive',
      });
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    toast({
      title: 'Exporting data...',
      description: 'Please wait while we prepare your data.',
    });

    try {
      const { data: events } = await supabase
        .from('events')
        .select('*, event_stages(*), event_tags(*)')
        .eq('user_id', user.id);

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        exportedAt: new Date().toISOString(),
        events,
        categories,
        tags,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eventflow-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Your data has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your data.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: 'Account deletion',
      description: 'Please contact support to delete your account.',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 gradient-primary rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg">Settings</span>
            </div>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure when you want to receive deadline reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify on deadline day</Label>
                  <p className="text-sm text-muted-foreground">Get reminded on the day of the deadline</p>
                </div>
                <Switch
                  checked={preferences.notify_on_day}
                  onCheckedChange={(checked) => updatePreference('notify_on_day', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify 1 day before</Label>
                  <p className="text-sm text-muted-foreground">Get reminded 24 hours before</p>
                </div>
                <Switch
                  checked={preferences.notify_1_day_before}
                  onCheckedChange={(checked) => updatePreference('notify_1_day_before', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify 7 days before</Label>
                  <p className="text-sm text-muted-foreground">Get reminded a week ahead</p>
                </div>
                <Switch
                  checked={preferences.notify_7_days_before}
                  onCheckedChange={(checked) => updatePreference('notify_7_days_before', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sound */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <CardTitle>Sound</CardTitle>
              </div>
              <CardDescription>
                Control notification sounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notification sound</Label>
                  <p className="text-sm text-muted-foreground">Play a sound when notifications appear</p>
                </div>
                <Switch
                  checked={preferences.sound_enabled}
                  onCheckedChange={(checked) => updatePreference('sound_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize how EventFlow looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-3">
                  {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <div>
                    <Label>Dark mode</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Data & Privacy</CardTitle>
              </div>
              <CardDescription>
                Manage your data and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export your data</Label>
                  <p className="text-sm text-muted-foreground">Download all your events and settings</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Delete account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="glass-strong border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sign out</Label>
                  <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}