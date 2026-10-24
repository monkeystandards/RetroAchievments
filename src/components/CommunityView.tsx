import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  MessageSquare,
  Search,
  UserCheck,
  UserPlus,
  Crown,
  ChevronRight,
  Flame,
  Gamepad2,
} from 'lucide-react';
import { FollowedUser, TopUser } from '../types/retro';
import { api, getUserAvatarUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface CommunityViewProps {
  following: FollowedUser[];
  followers: FollowedUser[];
  onOpenMessageWithUser: (username: string) => void;
  onOpenUserProfile: (username: string) => void;
  onRefreshFollows: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  following,
  followers,
  onOpenMessageWithUser,
  onOpenUserProfile,
  onRefreshFollows,
}) => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'top'>('following');
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loadingTop, setLoadingTop] = useState<boolean>(false);
  const [searchUser, setSearchUser] = useState<string>('');
  const [searchedProfile, setSearchedProfile] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'top' && topUsers.length === 0) {
      setLoadingTop(true);
      api
        .getTopUsers()
        .then((data) => {
          setTopUsers(data);
          setLoadingTop(false);
        })
        .catch((err) => {
          console.error('Error fetching top users:', err);
          setLoadingTop(false);
        });
    }
  }, [activeTab]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUser.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchedProfile(null);

    try {
      const res = await api.getProfile(searchUser.trim());
      setSearchedProfile(res.profile);
    } catch (err: any) {
      setSearchError(err.message || 'User not found on RetroAchievements');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Retro Community & Following</h2>
            <p className="text-[11px] text-slate-400">Keep up with fellow achievement hunters</p>
          </div>
        </div>

        {/* Quick Search for Any RA Player */}
        <form onSubmit={handleSearchSubmit} className="mt-3.5 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search any RetroAchievements player..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-16 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {isSearching ? '...' : 'Find'}
          </button>
        </form>

        {/* Search Results Preview */}
        {searchedProfile && (
          <div className="mt-3 p-3 bg-slate-950/90 rounded-2xl border border-indigo-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={getUserAvatarUrl(searchedProfile.userPic, searchedProfile.user)}
                alt={searchedProfile.user}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://media.retroachievements.org/UserPic/Scott.png';
                }}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-indigo-500"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{searchedProfile.user}</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {searchedProfile.totalPoints?.toLocaleString()} pts
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenUserProfile(searchedProfile.user);
                }}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  onOpenMessageWithUser(searchedProfile.user);
                }}
                className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
              >
                Chat
              </button>
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl p-2 text-center">
            {searchError}
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        {[
          { id: 'following', label: `Following (${following.length})` },
          { id: 'followers', label: `Followers (${followers.length})` },
          { id: 'top', label: 'Top 10 Masters' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playTap();
              setActiveTab(tab.id as any);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="space-y-2.5">
          {following.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">You are not following anyone yet.</p>
              <p className="text-[11px] text-slate-500">
                Use the search box above to find players and view their profiles!
              </p>
            </div>
          ) : (
            following.map((user) => (
              <div
                key={user.user}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all"
              >
                <div
                  onClick={() => {
                    sounds.playTap();
                    onOpenUserProfile(user.user);
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <img
                    src={getUserAvatarUrl(user.userPic, user.user)}
                    alt={user.user}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://media.retroachievements.org/UserPic/Scott.png';
                    }}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white hover:text-amber-300 transition-colors truncate">
                        {user.user}
                      </h4>
                      {user.isFollowingMe && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                          Follows you
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-400 font-mono font-medium mt-0.5">
                      {user.points.toLocaleString()} pts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onOpenMessageWithUser(user.user);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm shadow-indigo-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Followers Tab */}
      {activeTab === 'followers' && (
        <div className="space-y-2.5">
          {followers.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No followers yet.</p>
            </div>
          ) : (
            followers.map((user) => (
              <div
                key={user.user}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all"
              >
                <div
                  onClick={() => {
                    sounds.playTap();
                    onOpenUserProfile(user.user);
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <img
                    src={getUserAvatarUrl(user.userPic, user.user)}
                    alt={user.user}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://media.retroachievements.org/UserPic/Scott.png';
                    }}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800 shrink-0"
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white hover:text-amber-300 transition-colors truncate">
                      {user.user}
                    </h4>
                    <div className="text-[11px] text-amber-400 font-mono font-medium mt-0.5">
                      {user.points.toLocaleString()} pts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onOpenMessageWithUser(user.user);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Top 10 Hall of Fame Leaderboard */}
      {activeTab === 'top' && (
        <div className="space-y-2.5">
          {loadingTop ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-800/40 rounded-2xl" />
              ))}
            </div>
          ) : (
            topUsers.map((top, idx) => (
              <div
                key={top.username}
                onClick={() => {
                  sounds.playTap();
                  onOpenUserProfile(top.username);
                }}
                className={`rounded-2xl p-3 flex items-center justify-between gap-3 border transition-all cursor-pointer group active:scale-[0.99] ${
                  idx === 0
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : idx === 1
                    ? 'bg-slate-900 border-slate-700'
                    : idx === 2
                    ? 'bg-amber-950/10 border-amber-800/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <img
                    src={getUserAvatarUrl(undefined, top.username)}
                    alt={top.username}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://media.retroachievements.org/UserPic/Scott.png';
                    }}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800 shrink-0"
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {top.username}
                    </h4>
                    <div className="text-[11px] text-amber-400 font-mono font-medium mt-0.5">
                      {top.totalPoints.toLocaleString()} pts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {top.totalRatioPoints.toLocaleString()} TR
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTap();
                      onOpenMessageWithUser(top.username);
                    }}
                    title="Send message"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 flex items-center justify-center transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
