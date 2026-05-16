import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';

const WorkerSection = lazy(() => import('@/components/WorkerSection'));
const OwnerSection = lazy(() => import('@/components/OwnerSection'));
import { ChefHat, Crown, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const ADMIN_TABS = [
  { id: 'worker' as const, label: 'Kitchen', icon: ChefHat, roles: ['worker', 'owner'] },
  { id: 'owner' as const, label: 'Owner', icon: Crown, roles: ['owner'] },
];

type TabId = 'worker' | 'owner';

const AdminDashboard = () => {
  const { user, role, loading, roleLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users away
  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        navigate('/admin', { replace: true });
      } else if (role !== 'worker' && role !== 'owner') {
        navigate('/', { replace: true });
      }
    }
  }, [loading, roleLoading, user, role, navigate]);

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

  const isAdmin = user && (role === 'worker' || role === 'owner');
  if (!isAdmin) return null;

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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-primary/30 text-primary font-semibold capitalize">
                {role}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/')}
                title="Back to Menu"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={async () => { await signOut(); navigate('/'); }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto p-4 pb-8">
          <AdminView role={role} />
        </main>
      </div>
    </OrderProvider>
  );
};

const AdminView = ({ role }: { role: string }) => {
  const visibleTabs = ADMIN_TABS.filter(t => t.roles.includes(role));
  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id || 'worker');

  return (
    <div className="space-y-4">
      <div className="flex bg-secondary/80 rounded-2xl p-1 gap-0.5">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <Suspense fallback={<div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        {activeTab === 'worker' && <WorkerSection />}
        {activeTab === 'owner' && <OwnerSection />}
      </Suspense>
    </div>
  );
};

export default AdminDashboard;
