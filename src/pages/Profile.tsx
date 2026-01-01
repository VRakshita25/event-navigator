import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  ArrowLeft, 
  Camera, 
  Save,
  User,
  Mail,
  MapPin,
  Globe,
  Phone,
  Cake,
  Settings
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    avatar_url: null,
    bio: '',
    date_of_birth: '',
    phone: '',
    location: '',
    website: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setProfile({
          display_name: data.display_name || '',
          avatar_url: data.avatar_url,
          bio: data.bio || '',
          date_of_birth: data.date_of_birth || '',
          phone: data.phone || '',
          location: data.location || '',
          website: data.website || '',
        });
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name || null,
        bio: profile.bio || null,
        date_of_birth: profile.date_of_birth || null,
        phone: profile.phone || null,
        location: profile.location || null,
        website: profile.website || null,
      })
      .eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    }
  };

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
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
              <span className="font-heading font-bold text-lg">Profile</span>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Avatar Section */}
          <Card className="glass-strong">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={profile.avatar_url || undefined} alt="Profile" />
                    <AvatarFallback className="text-3xl gradient-primary text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isUploading ? 'Uploading...' : 'Click to change your photo'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card className="glass-strong">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      value={profile.display_name || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Cake className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profile.location || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yoursite.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account created</p>
                  <p className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last sign in</p>
                  <p className="font-medium">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}