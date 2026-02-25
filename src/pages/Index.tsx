import { useState } from 'react';
import { OrderProvider } from '@/context/OrderContext';
import UserSection from '@/components/UserSection';
import WorkerSection from '@/components/WorkerSection';
import OwnerSection from '@/components/OwnerSection';
import { User, ChefHat, Crown } from 'lucide-react';

const TABS = [
  { id: 'user', label: 'Customer', icon: User },
  { id: 'worker', label: 'Kitchen', icon: ChefHat },
  { id: 'owner', label: 'Owner', icon: Crown },
] as const;

type TabId = typeof TABS[number]['id'];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('user');

  return (
    <OrderProvider>
      <div className="min-h-screen bg-background">
        {/* Top Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--text-display)' }}>
              🍽️ OrderFlow
            </h1>
            <div className="flex bg-secondary rounded-lg p-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-lg mx-auto p-4 pb-8">
          {activeTab === 'user' && <UserSection />}
          {activeTab === 'worker' && <WorkerSection />}
          {activeTab === 'owner' && <OwnerSection />}
        </main>
      </div>
    </OrderProvider>
  );
};

export default Index;
