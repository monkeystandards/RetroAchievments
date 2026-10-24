import React, { useState } from 'react';
import {
  X,
  User,
  Volume2,
  Sparkles,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Award,
} from 'lucide-react';
import {
  getActiveUsername,
  api,
  getUserAvatarUrl,
} from '../services/api';
import { UserProfile } from '../types/retro';
import { sounds } from '../utils/audio';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  profile: UserProfile | null;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  profile,
}) => {
  const currentUsername = getActiveUsername();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playAchievementUnlocked();
  };

  const handleSignOut = () => {
    sounds.playTap();
    api.logout();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm shadow-amber-500/30">
              RA
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">Account & Settings</h3>
              <p className="text-[10px] text-slate-400">Authenticated RetroAchievements session</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Authenticated User Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={getUserAvatarUrl(profile?.userPic, currentUsername)}
                alt={currentUsername}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://media.retroachievements.org/UserPic/Scott.png';
                }}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/50 bg-slate-800 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-white truncate">{currentUsername}</h4>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Logged In</span>
                  </span>
                </div>

                {profile?.motto && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">{profile.motto}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-semibold mt-1">
                  <span>{(profile?.totalPoints ?? 0).toLocaleString()} points</span>
                  {profile?.rank && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">Rank #{profile.rank.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Authentication Type</span>
              <span className="text-slate-200 font-medium">Username & Password</span>
            </div>
          </div>

          {/* Sound Synthesizer Setting */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Retro Synthesizer Audio</div>
                <div className="text-[10px] text-slate-400">Chimes for achievements and messages</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 shadow-md transform transition-transform absolute top-1 ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {soundEnabled && (
            <button
              type="button"
              onClick={() => sounds.playAchievementUnlocked()}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Retro Trophy Fanfare</span>
            </button>
          )}

          {/* External Profile Link */}
          <a
            href={`https://retroachievements.org/user/${currentUsername}`}
            target="_blank"
            rel="noreferrer"
            className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>View Profile on RetroAchievements.org</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {/* Log Out Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of RetroAchievements</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
