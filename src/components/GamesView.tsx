import React, { useState, useEffect } from 'react';
import {
  Search,
  Gamepad2,
  Trophy,
  Star,
  CheckCircle2,
  Clock,
  Filter,
  ArrowLeft,
  Share2,
  Plus,
  BookmarkCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ConsoleItem, GameListItem, GameDetailData, GameAchievement, WantedItem } from '../types/retro';
import { api, getGameImageUrl, getBadgeUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface GamesViewProps {
  consoles: ConsoleItem[];
  selectedConsoleId: number;
  onSelectConsole: (id: number) => void;
  selectedGameId: number | null;
  onSelectGame: (gameId: number | null) => void;
  wantedList: WantedItem[];
  onToggleWanted: (achievement: GameAchievement, game: GameDetailData) => void;
  onShareInChat: (achievement: GameAchievement, game: GameDetailData) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  consoles,
  selectedConsoleId,
  onSelectConsole,
  selectedGameId,
  onSelectGame,
  wantedList,
  onToggleWanted,
  onShareInChat,
}) => {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [loadingGames, setLoadingGames] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Game detail state
  const [gameDetail, setGameDetail] = useState<GameDetailData | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'locked' | 'unlocked' | 'progression' | 'missable'>('all');
  const [achievementSearch, setAchievementSearch] = useState<string>('');

  // Fetch games when console changes
  useEffect(() => {
    if (!selectedConsoleId) return;
    let isCurrent = true;
    setLoadingGames(true);
    api
      .getGames(selectedConsoleId)
      .then((data) => {
        if (isCurrent) {
          setGames(data);
          setLoadingGames(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching games:', err);
        if (isCurrent) setLoadingGames(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedConsoleId]);

  // Fetch game detail when selectedGameId changes
  useEffect(() => {
    if (!selectedGameId) {
      setGameDetail(null);
      setUserProgress(null);
      return;
    }
    let isCurrent = true;
    setLoadingDetail(true);
    api
      .getGameDetails(selectedGameId)
      .then((res) => {
        if (isCurrent) {
          setGameDetail(res.game);
          setUserProgress(res.progress);
          setLoadingDetail(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching game details:', err);
        if (isCurrent) setLoadingDetail(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedGameId]);

  // Filtered games
  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // If a game is selected, show the Game Detail & Achievement Set screen
  if (selectedGameId && (gameDetail || loadingDetail)) {
    return (
      <div className="p-4 space-y-4 pb-12">
        {/* Back navigation button */}
        <button
          onClick={() => {
            sounds.playTap();
            onSelectGame(null);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl active:scale-95 transition-all w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Games</span>
        </button>

        {loadingDetail || !gameDetail ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-44 bg-slate-800/60 rounded-3xl" />
            <div className="h-10 bg-slate-800/40 rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-800/30 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Game Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-xl">
              <div className="flex gap-4 items-start">
                <img
                  src={getGameImageUrl(gameDetail.imageBoxArt || gameDetail.imageIcon)}
                  alt={gameDetail.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/Images/046476.png';
                  }}
                  className="w-20 h-28 object-cover rounded-xl bg-slate-950 border border-slate-700 shadow-md shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {gameDetail.consoleName}
                  </span>
                  <h2 className="text-base font-extrabold text-white mt-1 leading-snug line-clamp-2">
                    {gameDetail.title}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                    {gameDetail.developer && <span>Dev: {gameDetail.developer}</span>}
                    {gameDetail.released && <span>· {gameDetail.released}</span>}
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center gap-1 text-amber-300 font-bold">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{gameDetail.numAchievements} Achievements</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Progress Bar in this Game */}
              {userProgress && (
                <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Your Progress</span>
                    <span className="text-amber-400 font-bold">
                      {userProgress.numAchieved || 0} / {gameDetail.numAchievements} (
                      {Math.round(((userProgress.numAchieved || 0) / (gameDetail.numAchievements || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((userProgress.numAchieved || 0) / (gameDetail.numAchievements || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Achievement Set Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200">
                  Achievement Set ({gameDetail.numAchievements})
                </h3>
              </div>

              {/* Search within game achievements */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter achievements..."
                  value={achievementSearch}
                  onChange={(e) => setAchievementSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['all', 'locked', 'unlocked', 'progression', 'missable'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      sounds.playTap();
                      setAchievementFilter(mode);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize shrink-0 transition-all ${
                      achievementFilter === mode
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-2.5">
              {Object.values(gameDetail.achievements || {})
                .filter((ach: GameAchievement) => {
                  const unlocked = Boolean(ach.dateEarned || ach.isAwarded);
                  if (achievementFilter === 'locked' && unlocked) return false;
                  if (achievementFilter === 'unlocked' && !unlocked) return false;
                  if (achievementFilter === 'progression' && ach.type !== 'progression') return false;
                  if (achievementFilter === 'missable' && ach.type !== 'missable') return false;
                  if (
                    achievementSearch &&
                    !ach.title.toLowerCase().includes(achievementSearch.toLowerCase()) &&
                    !ach.description.toLowerCase().includes(achievementSearch.toLowerCase())
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((ach: GameAchievement) => {
                  const isUnlocked = Boolean(ach.dateEarned || ach.isAwarded);
                  const isWanted = wantedList.some((w) => w.achievementId === ach.id);

                  return (
                    <div
                      key={ach.id}
                      className={`rounded-2xl p-3 border transition-all ${
                        isUnlocked
                          ? 'bg-slate-900/90 border-amber-500/30'
                          : isWanted
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Badge Icon */}
                        <div className="relative shrink-0">
                          <img
                            src={getBadgeUrl(ach.badgeName, !isUnlocked)}
                            alt={ach.title}
                            referrerPolicy="no-referrer"
                            className={`w-12 h-12 rounded-xl pixelated bg-slate-950 p-1 border ${
                              isUnlocked
                                ? 'border-amber-400 ring-2 ring-amber-500/20'
                                : 'border-slate-800 opacity-75'
                            }`}
                          />
                          {isUnlocked && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Title, description, points */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4
                                className={`text-xs font-bold ${
                                  isUnlocked ? 'text-amber-300' : 'text-slate-100'
                                }`}
                              >
                                {ach.title}
                              </h4>
                              {ach.type && (
                                <span className="inline-block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                  {ach.type.replace('_', ' ')}
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                              {ach.points} pts
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {ach.description}
                          </p>

                          {/* Action Strip: Add to Wanted List, Share */}
                          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/60">
                            <div className="text-[10px] text-slate-500 font-mono">
                              {ach.numAwarded.toLocaleString()} players ({ach.trueRatio} TR)
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Share in Chat */}
                              <button
                                onClick={() => {
                                  sounds.playTap();
                                  onShareInChat(ach, gameDetail);
                                }}
                                title="Share in chat with friends"
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Wanted List Button */}
                              <button
                                onClick={() => {
                                  onToggleWanted(ach, gameDetail);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold active:scale-95 transition-all ${
                                  isWanted
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span>{isWanted ? 'Wanted' : '+ Want'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Browser Mode: Console Selector + Games Grid
  return (
    <div className="p-4 space-y-4 pb-12">
      {/* Console Selector Horizontal Scroll */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">Select Console</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {consoles.map((c) => {
            const isSelected = c.id === selectedConsoleId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectConsole(c.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {c.iconUrl ? (
                  <img
                    src={c.iconUrl}
                    alt={c.name}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Gamepad2 className="w-3.5 h-3.5" />
                )}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search games in this console..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
        />
      </div>

      {/* Games List / Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {loadingGames ? 'Loading games...' : `${filteredGames.length} Games with Achievement Sets`}
          </span>
        </div>

        {loadingGames ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-2xl" />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
            <Gamepad2 className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-xs">No games found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGames.slice(0, 50).map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectGame(game.id);
                }}
                className="w-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left active:scale-[0.99] group"
              >
                <img
                  src={getGameImageUrl(game.imageIcon)}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/Images/046476.png';
                  }}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0 group-hover:border-amber-500/50"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                    {game.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Trophy className="w-3 h-3" />
                      {game.numAchievements} trophies
                    </span>
                    <span>·</span>
                    <span>{game.points} pts</span>
                  </div>
                </div>

                <div className="text-slate-500 group-hover:text-amber-400 transition-colors text-xs font-semibold px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
                  View Set
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
