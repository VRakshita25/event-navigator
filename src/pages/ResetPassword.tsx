import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle the hash fragment from Supabase auth redirect
    // Supabase sends tokens in the URL hash for password recovery
    const handleAuthRedirect = async () => {
      // First, check if we have hash params (from email link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        // Set the session using the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (!error) {
          setIsValidSession(true);
        }
        setIsLoading(false);
        return;
      }

      // Fallback: check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsLoading(false);
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    handleAuthRedirect();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      passwordSchema.parse({ password, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { password?: string; confirmPassword?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as 'password' | 'confirmPassword'] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated',
        description: 'Your password has been reset successfully. You can now login.',
      });
      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate('/auth');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero p-8">
        <Card className="w-full max-w-md glass-strong shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 gradient-primary rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-heading font-bold">EventFlow</span>
            </div>
            <CardTitle className="text-2xl font-heading">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full gradient-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-8">
      <Card className="w-full max-w-md glass-strong shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 gradient-primary rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold">EventFlow</span>
          </div>
          <CardTitle className="text-2xl font-heading">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full gradient-primary hover:opacity-90 transition-opacity"
              disabled={isSubmitting}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
