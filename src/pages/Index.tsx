import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';

const UserSection = lazy(() => import('@/components/UserSection'));
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, isGuest, loading, roleLoading, setGuestMode } = useAuth();
  const navigate = useNavigate();

  // If not logged in and not guest, auto-set guest mode (customer-first)
  useEffect(() => {
    if (!loading && !roleLoading && !user && !isGuest) {
      setGuestMode(true);
    }
  }, [loading, roleLoading, user, isGuest, setGuestMode]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <OrderProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--text-display)' }}>
              <span className="text-gradient-warm">The Curry</span>
              <span className="text-foreground"> Corner</span>
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto p-4 pb-8">
          <Suspense fallback={<div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <UserSection />
          </Suspense>
          {/* Admin Login Link at bottom */}
          <div className="mt-12 text-center border-t border-border/50 pt-6">
            <Button
              variant="ghost"
              className="text-muted-foreground text-xs hover:text-foreground gap-1.5"
              onClick={() => navigate('/admin')}
            >
              <Lock className="h-3 w-3" /> Admin Login
            </Button>
          </div>
        </main>
      </div>
    </OrderProvider>
  );
};

export default Index;

