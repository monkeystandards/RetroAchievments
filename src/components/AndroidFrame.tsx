import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Trophy,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  ChevronLeft,
  Settings,
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
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const isPm = hours >= 12;
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playTap();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 md:p-6 transition-colors selection:bg-amber-500/30 selection:text-amber-200">
      {/* Desktop view controller strip */}
      <div className="hidden md:flex items-center justify-between w-full max-w-5xl mb-4 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-slate-200">RetroTrack Android</span>
          <span>·</span>
          <span>RetroAchievements Mobile Companion</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setIsFrameMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isFrameMode ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel 8 Frame</span>
          </button>
          <button
            onClick={() => setIsFrameMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              !isFrameMode ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Responsive / Tablet</span>
          </button>
        </div>
      </div>

      {/* Main Container: Android Phone Frame OR Full Width Tablet */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col ${
          isFrameMode
            ? 'max-w-[430px] h-[920px] max-h-[96vh] rounded-[48px] border-[10px] border-slate-800/90 shadow-2xl shadow-amber-950/20 bg-slate-900 overflow-hidden ring-1 ring-slate-700/50'
            : 'max-w-5xl min-h-[880px] rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden'
        }`}
      >
        {/* Android Status Bar */}
        <div className="h-11 px-6 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-xs font-medium text-slate-300 select-none z-30 shrink-0 border-b border-slate-800/50">
          {/* Left: Clock & RA Trophy Icon */}
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{currentTime || '9:41'}</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              {badgeNotificationCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded-full font-mono">
                  {badgeNotificationCount}
                </span>
              )}
            </div>
          </div>

          {/* Center: Camera Notch (In Frame Mode) */}
          {isFrameMode && (
            <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-950/80" />
              </div>
            </div>
          )}

          {/* Right: Connectivity Icons */}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-300">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Top App Bar */}
        <header className="h-14 px-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-20 shrink-0">
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
            <div className="flex items-center gap-2 truncate">
              {!showBack && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/30 shrink-0">
                  RA
                </div>
              )}
              <h1 className="text-base font-bold text-slate-100 truncate tracking-tight">{headerTitle}</h1>
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Retro Sounds' : 'Enable Retro Sounds'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 active:scale-95 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Profile / Account Avatar */}
            {isAuthenticated && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-800 active:scale-95 transition-all focus-visible:outline-amber-500"
                title="Settings & Accounts"
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
        </header>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-950/40 scroll-smooth">
          {children}
        </main>

        {/* Android Bottom Navigation Bar */}
        {isAuthenticated && (
          <nav
            aria-label="Bottom Navigation"
            className="h-16 px-2 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 grid grid-cols-5 items-center z-20 shrink-0"
          >
          {[
            { id: 'dashboard', label: 'Home', icon: Trophy },
            { id: 'games', label: 'Games', icon: Sparkles },
            { id: 'wanted', label: 'Wanted', icon: Trophy, isTarget: true },
            { id: 'community', label: 'Social', icon: Trophy, isSocial: true },
            { id: 'messages', label: 'Messages', icon: Trophy, isChat: true },
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
                    isActive ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
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
        </nav>
        )}

        {/* Android Gesture Pill Indicator */}
        <div className="h-4 bg-slate-950 flex items-center justify-center z-20 shrink-0">
          <div className="w-32 h-1 bg-slate-600/70 rounded-full hover:bg-slate-400 transition-colors cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

// Distinctive Icons for bottom navigation
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
