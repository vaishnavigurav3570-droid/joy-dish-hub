import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import UserSection from '@/components/UserSection';
import WorkerSection from '@/components/WorkerSection';
import OwnerSection from '@/components/OwnerSection';
import Auth from '@/pages/Auth';
import { User, ChefHat, Crown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TABS = [
  { id: 'user' as const, label: 'Customer', icon: User, roles: ['user', 'worker', 'owner'] },
  { id: 'worker' as const, label: 'Kitchen', icon: ChefHat, roles: ['worker', 'owner'] },
  { id: 'owner' as const, label: 'Owner', icon: Crown, roles: ['owner'] },
];

type TabId = typeof TABS[number]['id'];

const Index = () => {
  const { user, role, isGuest, loading, setGuestMode, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('user');

  // Guest users only see Customer tab
  const visibleTabs = isGuest
    ? TABS.filter(t => t.id === 'user')
    : TABS.filter(t => t.roles.includes(role));

  // Reset tab if not visible
  useEffect(() => {
    if (!visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'user');
    }
  }, [role, isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading OrderFlow...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Auth onGuestAccess={() => setGuestMode(true)} />;
  }

  return (
    <OrderProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--text-display)' }}>
                <span className="gradient-warm bg-clip-text text-transparent">Order</span>
                <span className="text-foreground">Flow</span>
              </h1>
              {!isGuest && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-primary/30 text-primary font-semibold capitalize">
                  {role}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary/80 rounded-2xl p-1 gap-0.5">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (isGuest) setGuestMode(false);
                  else signOut();
                }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto p-4 pb-8">
          {activeTab === 'user' && <UserSection />}
          {activeTab === 'worker' && <WorkerSection />}
          {activeTab === 'owner' && <OwnerSection />}
        </main>
      </div>
    </OrderProvider>
  );
};

export default Index;
