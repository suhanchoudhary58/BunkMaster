import React from 'react';
import { Home, Calendar, BookOpen, BarChart3, User } from 'lucide-react';

export type ActiveTab = 'home' | 'schedule' | 'subjects' | 'analytics' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <nav id="bunkmaster-bottom-navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-bunk-border-light dark:border-zinc-800/80 py-3 pb-safe-bottom">
      <div className="max-w-md mx-auto px-6 flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className="flex flex-col items-center justify-center gap-1.5 py-1 min-w-[48px] focus:outline-none transition-transform active:scale-95 group"
              style={{ height: '44px' }}
              aria-label={item.label}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-300 ${
                  isActive
                    ? 'text-bunk-accent dark:text-bunk-accent-dark'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`}
              />
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                  isActive
                    ? 'text-bunk-accent dark:text-bunk-accent-dark font-semibold'
                    : 'text-zinc-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
