import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChefHat, Crown, Eye, EyeOff } from 'lucide-react';

type RoleTab = 'worker' | 'owner';

const Auth = ({ onGuestAccess }: { onGuestAccess: () => void }) => {
  const [roleTab, setRoleTab] = useState<RoleTab>('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: email.split('@')[0], role: roleTab } },
        });
        if (error) throw error;
        // Assign role after signup - use the user from signUp response
        const newUser = signUpData?.user;
        if (newUser) {
          // Small delay to ensure session is established
          await new Promise(r => setTimeout(r, 500));
          const { error: roleError } = await (supabase as any).from('user_roles').insert({ user_id: newUser.id, role: roleTab });
          if (roleError) console.error('Role assignment error:', roleError);
        }
        toast.success('Account created! You are now logged in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'worker' as RoleTab, label: 'Kitchen Staff', icon: ChefHat, desc: 'Manage & prepare orders' },
    { id: 'owner' as RoleTab, label: 'Owner / Admin', icon: Crown, desc: 'Full restaurant control' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
            <span className="gradient-warm bg-clip-text text-transparent">Order</span>
            <span className="text-foreground">Flow</span>
          </h1>
          <p className="text-muted-foreground text-sm">Restaurant Management System</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">
          {roles.map(role => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setRoleTab(role.id)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                  roleTab === role.id
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border hover:border-primary/30 bg-card'
                }`}
              >
                <Icon className={`h-6 w-6 mb-2 ${roleTab === role.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-bold text-foreground text-sm">{role.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{role.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Login Form */}
        <Card className="p-6 rounded-2xl space-y-4">
          <h2 className="font-bold text-foreground text-lg">
            {isSignup ? 'Create Account' : 'Sign In'} as {roleTab === 'worker' ? 'Kitchen Staff' : 'Owner'}
          </h2>

          <Input
            className="rounded-xl h-12"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

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
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="text-primary font-semibold hover:underline" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <div className="text-center text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3">
            <p className="font-semibold">Default credentials:</p>
            <p>Kitchen: <span className="text-foreground">vedant@kitchen.com</span> / <span className="text-foreground">vedant</span></p>
            <p>Owner: <span className="text-foreground">vedant@owner.com</span> / <span className="text-foreground">vedant</span></p>
          </div>
        </Card>

        {/* Guest Access */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Are you a customer?</p>
          <Button
            variant="outline"
            className="rounded-xl px-8 h-11 font-semibold border-2 hover:bg-primary/5 hover:border-primary/30"
            onClick={onGuestAccess}
          >
            🍽️ Browse Menu & Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
