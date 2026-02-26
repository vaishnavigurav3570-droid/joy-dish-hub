import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderProvider } from '@/context/OrderContext';
import UserSection from '@/components/UserSection';
import WorkerSection from '@/components/WorkerSection';
import OwnerSection from '@/components/OwnerSection';
import Auth from '@/pages/Auth';
import { User, ChefHat, Crown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'user' as const, label: 'Customer', icon: User, roles: ['user', 'owner'] },
  { id: 'worker' as const, label: 'Kitchen', icon: ChefHat, roles: ['worker', 'owner'] },
  { id: 'owner' as const, label: 'Owner', icon: Crown, roles: ['owner'] },
];

type TabId = typeof TABS[number]['id'];

const Index = () => {
  const { user, role, isGuest, loading, setGuestMode, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('user');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in and not guest
  if (!user && !isGuest) {
    return <Auth onGuestAccess={() => setGuestMode(true)} />;
  }

  // Guest users only see Customer tab
  const visibleTabs = isGuest
    ? TABS.filter(t => t.id === 'user')
    : TABS.filter(t => t.roles.includes(role));

  // If current tab is not visible, reset
  if (!visibleTabs.find(t => t.id === activeTab)) {
    const firstTab = visibleTabs[0]?.id || 'user';
    if (activeTab !== firstTab) setActiveTab(firstTab);
  }

  return (
    <OrderProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass border-b px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--text-display)' }}>
              <span className="gradient-warm bg-clip-text text-transparent">Order</span>
              <span className="text-foreground">Flow</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary/80 rounded-2xl p-1 gap-0.5">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
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
              {(user || isGuest) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (isGuest) setGuestMode(false);
                    else signOut();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

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
