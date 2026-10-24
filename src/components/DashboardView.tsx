import React from 'react';
import {
  Trophy,
  Flame,
  Gamepad2,
  BookmarkCheck,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { UserProfile, UserSummaryData, FollowedUser, RecentlyPlayedGame } from '../types/retro';
import { getUserAvatarUrl, getGameImageUrl, getBadgeUrl } from '../services/api';

interface DashboardViewProps {
  profile: UserProfile | null;
  summary: UserSummaryData | null;
  following: FollowedUser[];
  wantedCount: number;
  onNavigateToGames: (consoleId?: number) => void;
  onNavigateToGameDetails: (gameId: number) => void;
  onNavigateToWanted: () => void;
  onNavigateToCommunity: () => void;
  onSelectUser: (username: string) => void;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  summary,
  following,
  wantedCount,
  onNavigateToGames,
  onNavigateToGameDetails,
  onNavigateToWanted,
  onNavigateToCommunity,
  onSelectUser,
  loading,
}) => {
  if (loading && !profile) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-44 bg-slate-800/60 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-slate-800/40 rounded-2xl" />
          <div className="h-20 bg-slate-800/40 rounded-2xl" />
        </div>
        <div className="h-32 bg-slate-800/30 rounded-2xl" />
        <div className="h-48 bg-slate-800/30 rounded-2xl" />
      </div>
    );
  }

  const username = profile?.user || 'RetroGamer';
  const totalPoints = profile?.totalPoints ?? 0;
  const truePoints = profile?.totalTruePoints ?? totalPoints;
  const rank = profile?.rank || summary?.rank || 1;
  const motto = profile?.motto || 'Leveling up one retro achievement at a time';
  const richPresence = profile?.richPresenceMsg || summary?.richPresenceMsg || 'Ready to play retro games';
  const recentlyPlayed = summary?.recentlyPlayed || [];

  // Extract recent achievements
  const recentAchievementsList: Array<{
    id: number;
    gameTitle: string;
    title: string;
    description: string;
    points: number;
    badgeName: string;
    dateAwarded?: string;
  }> = [];

  if (summary?.recentAchievements) {
    Object.values(summary.recentAchievements).forEach((gameAchMap) => {
      Object.values(gameAchMap).forEach((ach) => {
        recentAchievementsList.push(ach);
      });
    });
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Player Header Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800/80 p-5 shadow-lg">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={getUserAvatarUrl(profile?.userPic, username)}
                alt={username}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://media.retroachievements.org/UserPic/Scott.png';
                }}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/50 bg-slate-800 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                ★
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{username}</h2>
                <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                  Rank #{rank.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">{motto}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Member since {profile?.memberSince ? new Date(profile.memberSince).getFullYear() : '2016'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/60">
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Hardcore</span>
            </div>
            <div className="text-base font-bold text-amber-300 font-mono tabular-nums mt-0.5">
              {totalPoints.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>True Ratio</span>
            </div>
            <div className="text-base font-bold text-rose-300 font-mono tabular-nums mt-0.5">
              {truePoints.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <BookmarkCheck className="w-3 h-3 text-cyan-400" />
              <span>Targets</span>
            </div>
            <div className="text-base font-bold text-cyan-300 font-mono tabular-nums mt-0.5">
              {wantedCount} Wanted
            </div>
          </div>
        </div>

        {/* Rich Presence Banner */}
        <div className="mt-3.5 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/60 flex items-center gap-2.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="truncate">
            <span className="text-slate-400 font-medium mr-1.5">Current Activity:</span>
            <span className="text-slate-200 font-medium">{richPresence}</span>
          </div>
        </div>
      </section>

      {/* Quick Action Hub */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateToWanted}
          className="bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.98] border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500/20">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
              <span>Wanted List</span>
              <span className="text-[10px] text-amber-400 font-mono">({wantedCount})</span>
            </div>
            <div className="text-[11px] text-slate-400">Target achievements</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateToGames()}
          className="bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.98] border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Browse Sets</div>
            <div className="text-[11px] text-slate-400">80+ Retro Consoles</div>
          </div>
        </button>
      </section>

      {/* People You Follow - Horizontal Strip */}
      {following.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>People You Follow ({following.length})</span>
            </div>
            <button
              onClick={onNavigateToCommunity}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {following.map((u) => (
              <button
                key={u.user}
                onClick={() => onSelectUser(u.user)}
                className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-2xl active:scale-95 transition-all text-left"
              >
                <img
                  src={getUserAvatarUrl(u.userPic, u.user)}
                  alt={u.user}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/UserPic/Scott.png';
                  }}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 bg-slate-800"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">{u.user}</div>
                  <div className="text-[10px] text-amber-400 font-mono font-medium">
                    {u.points.toLocaleString()} pts
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recently Unlocked Achievements */}
      {recentAchievementsList.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Unlocks</span>
            </div>
            <span className="text-[11px] text-slate-500">Latest trophies</span>
          </div>

          <div className="space-y-2">
            {recentAchievementsList.slice(0, 4).map((ach) => (
              <div
                key={ach.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3"
              >
                <img
                  src={getBadgeUrl(ach.badgeName)}
                  alt={ach.title}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg pixelated bg-slate-950 p-0.5 border border-amber-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{ach.title}</h4>
                    <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                      +{ach.points} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ach.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                    <span className="truncate text-slate-400">{ach.gameTitle}</span>
                    {ach.dateAwarded && (
                      <>
                        <span>·</span>
                        <span>{new Date(ach.dateAwarded).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played Games */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recently Played</span>
          </div>
          <button
            onClick={() => onNavigateToGames()}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
          >
            <span>All Games</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentlyPlayed.slice(0, 5).map((game: RecentlyPlayedGame) => {
            const earned = game.numAchieved || 0;
            const total = game.achievementsTotal || game.numPossibleAchievements || 1;
            const pct = Math.min(100, Math.round((earned / total) * 100));

            return (
              <div
                key={game.gameId}
                onClick={() => onNavigateToGameDetails(game.gameId)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <img
                  src={getGameImageUrl(game.imageIcon || game.imageBoxArt)}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/Images/046476.png';
                  }}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-700/60 shrink-0 group-hover:border-amber-500/50 transition-colors"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
                      {game.consoleName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>
                      {earned} / {total} unlocked
                    </span>
                    <span className="text-amber-400 font-semibold">{pct}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct === 100
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
