import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      authSchema.parse(loginForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as 'email' | 'password'] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Email or password is incorrect. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      authSchema.parse(signupForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as 'email' | 'password'] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.displayName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account exists',
          description: 'This email is already registered. Please login instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Check your email!',
        description: 'We sent you a verification link. Please verify your email to login.',
      });
      setSignupForm({ email: '', password: '', displayName: '' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      emailSchema.parse({ email: resetEmail });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0]?.message });
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link. Please check your inbox.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex gradient-hero">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-heading font-bold">EventFlow</h1>
          </div>
          
          <h2 className="text-4xl font-heading font-bold mb-6 leading-tight">
            Never Miss a Deadline Again
          </h2>
          
          <p className="text-lg text-white/80 mb-12 max-w-md">
            Track hackathons, workshops, and competitions with multi-stage deadlines. 
            Get smart reminders and stay ahead of your engineering journey.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Multi-Stage Tracking</h3>
                <p className="text-white/70 text-sm">Track every round and deadline separately</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Notifications</h3>
                <p className="text-white/70 text-sm">Get reminded 7 days, 1 day, and on the day</p>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-20 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md glass-strong shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="p-2 gradient-primary rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-heading font-bold">EventFlow</span>
            </div>
            
            {showForgotPassword ? (
              <>
                <CardTitle className="text-2xl font-heading">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email to receive a reset link
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-heading">Get Started</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-primary hover:opacity-90 transition-opacity"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setErrors({});
                  }}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setErrors({});
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name (optional)</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        value={signupForm.displayName}
                        onChange={(e) => setSignupForm({ ...signupForm, displayName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="mt-4 lg:hidden">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
