import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Flame,
  MessageSquare,
  Award,
  Gamepad2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, UserSummaryData } from '../types/retro';
import { api, getUserAvatarUrl, getGameImageUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface UserProfileModalProps {
  username: string | null;
  onClose: () => void;
  onOpenMessageWithUser: (username: string) => void;
  onNavigateToGame: (gameId: number) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  username,
  onClose,
  onOpenMessageWithUser,
  onNavigateToGame,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<UserSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setProfile(null);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    api
      .getProfile(username)
      .then((data) => {
        setProfile(data.profile);
        setSummary(data.summary);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      });
  }, [username]);

  if (!username) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Player Profile</span>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-slate-800/40 rounded-xl" />
                <div className="h-16 bg-slate-800/40 rounded-xl" />
              </div>
            </div>
          ) : error || !profile ? (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <p className="text-xs text-rose-400">{error || 'Could not find player data.'}</p>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="flex items-center gap-4">
                <img
                  src={getUserAvatarUrl(profile.userPic, profile.user)}
                  alt={profile.user}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/UserPic/Scott.png';
                  }}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/50 bg-slate-950 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white truncate">{profile.user}</h3>
                    {profile.rank && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                        #{profile.rank.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {profile.motto && (
                    <p className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">{profile.motto}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Member since {profile.memberSince ? new Date(profile.memberSince).getFullYear() : '2016'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                  <div className="text-[10px] text-slate-400">Hardcore</div>
                  <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
                    {profile.totalPoints.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                  <div className="text-[10px] text-slate-400">True Points</div>
                  <div className="text-xs font-bold text-rose-300 font-mono mt-0.5">
                    {(profile.totalTruePoints || profile.totalPoints).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                  <div className="text-[10px] text-slate-400">Softcore</div>
                  <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                    {(profile.totalSoftcorePoints || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Current Activity */}
              {profile.richPresenceMsg && (
                <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span className="text-slate-300 line-clamp-1">{profile.richPresenceMsg}</span>
                </div>
              )}

              {/* Recently Played */}
              {summary?.recentlyPlayed && summary.recentlyPlayed.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-200">Recently Played Games</div>
                  <div className="space-y-2">
                    {summary.recentlyPlayed.slice(0, 3).map((game) => (
                      <div
                        key={game.gameId}
                        onClick={() => {
                          onClose();
                          onNavigateToGame(game.gameId);
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <img
                          src={getGameImageUrl(game.imageIcon)}
                          alt={game.title}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{game.title}</div>
                          <div className="text-[10px] text-slate-400">{game.consoleName}</div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {profile && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
                onOpenMessageWithUser(profile.user);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
