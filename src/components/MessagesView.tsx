import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  ExternalLink,
  RefreshCw,
  Search,
  User,
  ShieldCheck,
  SendHorizontal,
  Inbox,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { RetroAchievementWallComment, WantedItem } from '../types/retro';
import { api, getUserAvatarUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface MessagesViewProps {
  activeRecipient: string | null;
  onSelectRecipient: (username: string | null) => void;
  onOpenUserProfile: (username: string) => void;
  onNavigateToGame?: (gameId: number) => void;
  wantedList?: WantedItem[];
  currentUser: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  activeRecipient,
  onSelectRecipient,
  onOpenUserProfile,
  currentUser,
}) => {
  // Target user whose website messages we are displaying (defaults to current user or active recipient)
  const [selectedUser, setSelectedUser] = useState<string>(activeRecipient || currentUser || 'Scott');
  const [wallComments, setWallComments] = useState<RetroAchievementWallComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFollowed, setQuickFollowed] = useState<string[]>([]);

  // Keep selectedUser in sync when activeRecipient prop changes from outside (e.g. profile or community)
  useEffect(() => {
    if (activeRecipient) {
      setSelectedUser(activeRecipient);
    }
  }, [activeRecipient]);

  // Load followed users for quick filter pills
  useEffect(() => {
    api
      .getFollowing()
      .then((users) => {
        if (users && users.length > 0) {
          setQuickFollowed(users.map((u) => u.user).slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real messages sent via the RetroAchievements website for the selected user
  const loadWebsiteMessages = useCallback(async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const comments = await api.getWallComments(target.trim());
      // Sort newest first
      const sorted = [...comments].sort((a, b) => {
        const timeA = new Date(a.submitted).getTime();
        const timeB = new Date(b.submitted).getTime();
        return timeB - timeA;
      });
      setWallComments(sorted);
    } catch (err: any) {
      console.error('Failed to load RetroAchievements website messages:', err);
      setError(err.message || 'Failed to fetch messages from RetroAchievements.org');
      setWallComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWebsiteMessages(selectedUser);
  }, [selectedUser, loadWebsiteMessages]);

  const handleManualRefresh = () => {
    sounds.playTap();
    loadWebsiteMessages(selectedUser);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sounds.playTap();
    const query = searchQuery.trim();
    setSelectedUser(query);
    onSelectRecipient(query.toLowerCase() === currentUser.toLowerCase() ? null : query);
  };

  const formatTimestamp = (dateStr: string): { relative: string; formatted: string } => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { relative: dateStr, formatted: dateStr };

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = '';
      if (diffDays > 30) {
        relative = date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      } else if (diffDays > 0) {
        relative = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relative = `${diffHours}h ago`;
      } else if (diffMins > 0) {
        relative = `${diffMins}m ago`;
      } else {
        relative = 'Just now';
      }

      const formatted = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return { relative, formatted };
    } catch {
      return { relative: dateStr, formatted: dateStr };
    }
  };

  const isViewingSelf = selectedUser.toLowerCase() === currentUser.toLowerCase();

  return (
    <div className="p-4 space-y-4 pb-16">
      {/* Official RetroAchievements Website Messaging Hub Card */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-white">RetroAchievements Messages</h2>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">Authentic messages from RetroAchievements.org</p>
            </div>
          </div>

          <a
            href="https://retroachievements.org/messages.php"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Site Inbox</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Website Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 relative z-10">
          <a
            href="https://retroachievements.org/messages.php"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs transition-colors"
          >
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Inbox</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href={
              isViewingSelf
                ? 'https://retroachievements.org/createmessage.php'
                : `https://retroachievements.org/createmessage.php?t=${encodeURIComponent(selectedUser)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs transition-colors"
          >
            <span className="text-slate-300 font-semibold flex items-center gap-1.5 truncate">
              <SendHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{isViewingSelf ? 'Compose Site PM' : `PM ${selectedUser}`}</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
          </a>
        </div>

        {/* Verification banner: Zero automated responses guarantee */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[10px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Only authentic messages sent via RetroAchievements.org • No automated responses</span>
        </div>
      </section>

      {/* Recipient / Player Selection Controls */}
      <section className="space-y-2">
        {/* Search bar to view any player's website messages */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any player's RA message wall (e.g. Scott)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-20 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl text-[11px] font-bold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => {
              sounds.playTap();
              setSelectedUser(currentUser);
              onSelectRecipient(null);
              setSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all ${
              isViewingSelf
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <User className="w-3 h-3" />
            <span>My Messages ({currentUser})</span>
          </button>

          {quickFollowed.map((followedName) => {
            const isSelected = selectedUser.toLowerCase() === followedName.toLowerCase();
            return (
              <button
                key={followedName}
                onClick={() => {
                  sounds.playTap();
                  setSelectedUser(followedName);
                  onSelectRecipient(followedName);
                  setSearchQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <img
                  src={getUserAvatarUrl(undefined, followedName)}
                  alt={followedName}
                  referrerPolicy="no-referrer"
                  className="w-3.5 h-3.5 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/UserPic/Scott.png';
                  }}
                />
                <span>{followedName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Current Active Wall Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 min-w-0">
          {!isViewingSelf && (
            <button
              onClick={() => {
                sounds.playTap();
                setSelectedUser(currentUser);
                onSelectRecipient(null);
              }}
              title="Return to My Messages"
              className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <img
            src={getUserAvatarUrl(undefined, selectedUser)}
            alt={selectedUser}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://media.retroachievements.org/UserPic/Scott.png';
            }}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-500/40 bg-slate-800 shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white truncate">
                {isViewingSelf ? 'My Message Wall' : `${selectedUser}'s Message Wall`}
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">
                ({wallComments.length} {wallComments.length === 1 ? 'message' : 'messages'})
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Messages received on RetroAchievements.org
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            title="Refresh messages from RetroAchievements.org"
            className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-400 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <a
            href={`https://retroachievements.org/user/${encodeURIComponent(selectedUser)}#user-wall`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open message wall on RetroAchievements.org"
            className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Open Wall</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Messages Feed */}
      {loading ? (
        <div className="p-8 text-center space-y-3 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            Fetching messages from RetroAchievements.org...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-3 bg-rose-950/20 border border-rose-900/50 rounded-3xl">
          <p className="text-xs text-rose-300 font-semibold">{error}</p>
          <button
            onClick={() => loadWebsiteMessages(selectedUser)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : wallComments.length === 0 ? (
        <div className="p-8 text-center space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">No Website Messages Yet</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {isViewingSelf
                ? 'No one has left a message on your RetroAchievements profile wall yet.'
                : `No public messages have been left on ${selectedUser}'s RetroAchievements wall yet.`}
            </p>
          </div>
          <div className="pt-2">
            <a
              href={`https://retroachievements.org/user/${encodeURIComponent(selectedUser)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Leave Message on Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {wallComments.map((comment) => {
            const timeInfo = formatTimestamp(comment.submitted);
            const isFromCurrentUser =
              comment.user.toLowerCase() === currentUser.toLowerCase();

            return (
              <div
                key={comment.ulid || `${comment.user}-${comment.submitted}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 shadow-md transition-all space-y-2.5"
              >
                {/* Message Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onOpenUserProfile(comment.user);
                      }}
                      className="relative group shrink-0"
                      title={`View ${comment.user}'s Profile`}
                    >
                      <img
                        src={getUserAvatarUrl(undefined, comment.user)}
                        alt={comment.user}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://media.retroachievements.org/UserPic/Scott.png';
                        }}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/40 bg-slate-800"
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playTap();
                            onOpenUserProfile(comment.user);
                          }}
                          className="text-xs font-bold text-white hover:text-amber-400 transition-colors truncate"
                        >
                          {comment.user}
                        </button>
                        {isFromCurrentUser && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        <span title={timeInfo.formatted}>{timeInfo.relative}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 font-medium">via RetroAchievements.org</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this sender */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://retroachievements.org/createmessage.php?t=${encodeURIComponent(comment.user)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Send Official PM to ${comment.user} on RetroAchievements.org`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        onOpenUserProfile(comment.user);
                      }}
                      title="Inspect Profile"
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      Profile
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words font-normal">
                  {comment.commentText}
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="font-mono text-[9px] text-slate-600 truncate max-w-[150px]">
                    ID: {comment.ulid || 'Verified'}
                  </span>

                  <a
                    href={`https://retroachievements.org/user/${encodeURIComponent(comment.user)}#user-wall`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Reply on {comment.user}&apos;s Wall</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
