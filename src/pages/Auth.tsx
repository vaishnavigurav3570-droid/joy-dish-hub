import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const { user, role, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Redirect to admin dashboard when logged in as admin
  // Sign out non-admin users so they can enter admin credentials
  useEffect(() => {
    if (loading || roleLoading || signingOut) return;

    if (user) {
      if (role === 'worker' || role === 'owner') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Customer (Google user) trying to access admin — sign them out first
        setSigningOut(true);
        supabase.auth.signOut().then(() => {
          toast.info('Please sign in with admin credentials');
        });
      }
    } else {
      // User is null — if we were signing out, we're done now
      if (signingOut) setSigningOut(false);
    }
  }, [user, role, loading, roleLoading, navigate, signingOut]);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // While loading auth state or signing out a Google user, show spinner
  if (loading || roleLoading || signingOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            {signingOut ? 'Preparing admin login...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to menu */}
        <Button variant="ghost" className="text-muted-foreground gap-1.5" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </Button>

        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
            <span className="text-gradient-warm">The Curry</span>
            <span className="text-foreground"> Corner</span>
          </h1>
          <p className="text-muted-foreground text-sm">Admin Login</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 rounded-2xl space-y-4">
          <h2 className="font-bold text-foreground text-lg">
            Staff Sign In
          </h2>

          <Input className="rounded-xl h-12" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />

          <div className="relative">
            <Input
              className="rounded-xl h-12 pr-12"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button
            className="w-full gradient-warm text-primary-foreground rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20"
            onClick={handleAuth}
            disabled={authLoading}
          >
            {authLoading ? 'Please wait...' : 'Sign In'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
