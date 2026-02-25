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
        <header className="sticky top-0 z-50 glass border-b px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--text-display)' }}>
              <span className="gradient-warm bg-clip-text text-transparent">Order</span>
              <span className="text-foreground">Flow</span>
            </h1>
            <div className="flex bg-secondary/80 rounded-2xl p-1 gap-0.5">
              {TABS.map(tab => {
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
