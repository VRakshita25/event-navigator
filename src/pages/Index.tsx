import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Sparkles, 
  Zap, 
  Bell, 
  Target, 
  BarChart3, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: Target,
      title: 'Multi-Stage Tracking',
      description: 'Track every round and deadline separately - from registration to finals.',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get reminded 7 days, 1 day, and on the day of your deadlines.',
      color: 'bg-warning/10 text-warning',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Visualize your progress with insightful charts and statistics.',
      color: 'bg-info/10 text-info',
    },
    {
      icon: Sparkles,
      title: 'Color-Coded Categories',
      description: 'Organize events by type with beautiful color-coded categories.',
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-heading font-bold">EventFlow</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary hover:opacity-90">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
            Never Miss a{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Deadline
            </span>{' '}
            Again
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Track hackathons, symposiums, workshops, and competitions with multi-stage deadlines. 
            Get smart reminders and stay ahead of your engineering journey.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary hover:opacity-90 gap-2 text-lg px-8 py-6">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
            <div>
              <p className="text-3xl font-heading font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">Free to Use</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-primary">∞</p>
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Reminders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Everything You Need to Stay Organized
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Designed specifically for engineering students juggling multiple events and deadlines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="glass hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className={`p-3 rounded-xl w-fit ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get started in minutes and never miss another event deadline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Create an Account', desc: 'Sign up with your email in seconds.' },
              { step: '2', title: 'Add Your Events', desc: 'Enter hackathons, workshops, and their stages.' },
              { step: '3', title: 'Stay on Track', desc: 'Get timely reminders and never miss a deadline.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full gradient-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-hero">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Ready to Get Organized?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join students who are staying on top of their event deadlines.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary hover:opacity-90 gap-2 text-lg px-8 py-6">
                Start Now — It's Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="font-heading font-semibold">EventFlow</span>
          </div>
          <p>© {new Date().getFullYear()} EventFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
