import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { getUserAvatarUrl } from '../services/api';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  headerTitle: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenSettings: () => void;
  username: string;
  userPic?: string;
  badgeNotificationCount?: number;
  isAuthenticated?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  headerTitle,
  showBack = false,
  onBack,
  onOpenSettings,
  username,
  userPic,
  badgeNotificationCount = 0,
  isAuthenticated = true,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playTap();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col transition-colors selection:bg-amber-500/30 selection:text-amber-200 antialiased">
      {/* Native App Top Header */}
      <header className="sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto h-14 px-4 flex items-center justify-between">
          {/* Left: Navigation / App Title */}
          <div className="flex items-center gap-2 min-w-0">
            {showBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all -ml-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5 truncate">
              {!showBack && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 shrink-0">
                  RA
                </div>
              )}
              <h1 className="text-base font-extrabold text-slate-100 truncate tracking-tight font-display">
                {headerTitle}
              </h1>
            </div>
          </div>

          {/* Right: Sound Toggle & User Profile Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 active:scale-95 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Profile / Account Settings */}
            {isAuthenticated && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-amber-500/50 active:scale-95 transition-all focus-visible:outline-amber-500"
                title="Account Settings & Profile"
              >
                <img
                  src={getUserAvatarUrl(userPic, username)}
                  alt={username}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/UserPic/Scott.png';
                  }}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500/40 bg-slate-800"
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Native Bottom Navigation Bar */}
      {isAuthenticated && (
        <nav
          aria-label="Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-2xl shadow-black/80"
        >
          <div className="max-w-4xl mx-auto h-16 px-2 grid grid-cols-5 items-center">
            {[
              { id: 'dashboard', label: 'Home' },
              { id: 'games', label: 'Games' },
              { id: 'wanted', label: 'Wanted' },
              { id: 'community', label: 'Social' },
              { id: 'messages', label: 'Messages' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playTap();
                    onTabChange(item.id);
                  }}
                  className="flex flex-col items-center justify-center py-1 rounded-xl transition-all relative group"
                >
                  {/* Active Indicator Background Pill */}
                  <div
                    className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <NavIcon id={item.id} isActive={isActive} />
                    {item.id === 'messages' && badgeNotificationCount > 0 && (
                      <span className="absolute top-1 right-3 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                        {badgeNotificationCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap transition-colors ${
                      isActive ? 'text-amber-400 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

// Icons for bottom navigation
const NavIcon: React.FC<{ id: string; isActive: boolean }> = ({ id, isActive }) => {
  const stroke = isActive ? 2.3 : 1.8;
  switch (id) {
    case 'dashboard':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'games':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="6" y1="12" x2="10" y2="12" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <line x1="15" y1="13" x2="15.01" y2="13" />
          <line x1="18" y1="11" x2="18.01" y2="11" />
          <rect x="2" y="6" width="20" height="12" rx="2" />
        </svg>
      );
    case 'wanted':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
        </svg>
      );
    case 'community':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'messages':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      );
    default:
      return <Trophy className="w-5 h-5" />;
  }
};
