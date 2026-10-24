import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Paperclip,
  Trophy,
  X,
  Plus,
  CheckCheck,
  Search,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  ChatMessage,
  ConversationSummary,
  WantedItem,
} from '../types/retro';
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
  onNavigateToGame,
  wantedList = [],
  currentUser,
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedAttachment, setSelectedAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState<boolean>(false);
  const [loadingThread, setLoadingThread] = useState<boolean>(false);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatUser, setNewChatUser] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFollowed, setQuickFollowed] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Load followed users for quick selection
  useEffect(() => {
    api
      .getFollowing()
      .then((users) => {
        if (users && users.length > 0) {
          setQuickFollowed(users.map((u) => u.user).slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  // Load conversation list
  const loadConversations = useCallback(() => {
    api
      .getConversations()
      .then((data) => setConversations(data))
      .catch((err) => console.error('Failed to load conversations:', err));
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 4000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load active conversation thread
  useEffect(() => {
    if (!activeRecipient) return;

    let isSubscribed = true;
    setLoadingThread(true);

    const fetchThread = () => {
      api
        .getThread(activeRecipient)
        .then((msgs) => {
          if (!isSubscribed) return;

          if (
            lastMessageCountRef.current > 0 &&
            msgs.length > lastMessageCountRef.current &&
            msgs[msgs.length - 1].sender.toLowerCase() !== currentUser.toLowerCase()
          ) {
            sounds.playMessageReceived();
          }

          lastMessageCountRef.current = msgs.length;
          setThreadMessages(msgs);
          setLoadingThread(false);
          api.markThreadRead(activeRecipient);
        })
        .catch((err) => {
          console.error('Failed to load thread:', err);
          if (isSubscribed) setLoadingThread(false);
        });
    };

    fetchThread();
    const pollInterval = setInterval(fetchThread, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [activeRecipient, currentUser]);

  // Scroll to bottom when thread updates
  useEffect(() => {
    if (activeRecipient) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, activeRecipient]);

  // Send message between RetroAchievements users
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRecipient || (!inputText.trim() && !selectedAttachment)) return;

    const textToSend =
      inputText.trim() ||
      (selectedAttachment ? `Check out this achievement: ${selectedAttachment.title}!` : '');
    const attachmentToSend = selectedAttachment || undefined;

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: currentUser,
      recipient: activeRecipient,
      text: textToSend,
      timestamp: new Date().toISOString(),
      read: false,
      attachment: attachmentToSend,
    };

    setThreadMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setSelectedAttachment(null);
    setShowAttachmentPicker(false);
    sounds.playMessageSent();

    try {
      const saved = await api.sendMessage({
        recipient: activeRecipient,
        text: textToSend,
        attachment: attachmentToSend,
      });

      setThreadMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? saved : m)));
      lastMessageCountRef.current = threadMessages.length + 1;
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUser.trim()) return;
    const target = newChatUser.trim();
    setNewChatUser('');
    setShowNewChatModal(false);
    onSelectRecipient(target);
  };

  const formatTime = (dateStr: string): { relative: string; formatted: string } => {
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
        hour: '2-digit',
        minute: '2-digit',
      });

      return { relative, formatted };
    } catch {
      return { relative: dateStr, formatted: dateStr };
    }
  };

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.user.toLowerCase().includes(q) || c.lastMessage.text.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // =========================================================================
  // VIEW 1: ACTIVE CONVERSATION THREAD
  // =========================================================================
  if (activeRecipient) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        {/* Thread Header */}
        <div className="h-14 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                sounds.playTap();
                onSelectRecipient(null);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenUserProfile(activeRecipient)}
              className="flex items-center gap-2 min-w-0 text-left group"
            >
              <img
                src={getUserAvatarUrl(undefined, activeRecipient)}
                alt={activeRecipient}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://media.retroachievements.org/UserPic/Scott.png';
                }}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/50 bg-slate-800 shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {activeRecipient}
                  </h3>
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>RetroAchievements User</span>
                </span>
              </div>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onOpenUserProfile(activeRecipient);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold transition-colors"
          >
            View Profile
          </button>
        </div>

        {/* Message Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingThread ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            </div>
          ) : threadMessages.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white">Start the Conversation</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Send a message to @{activeRecipient}. Attach trophies from your Wanted List to discuss bounty hunts!
              </p>
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isMine = msg.sender.toLowerCase() === currentUser.toLowerCase();
              const time = formatTime(msg.timestamp);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                      isMine
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm'
                        : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {/* Trophy Attachment */}
                    {msg.attachment && (
                      <div
                        onClick={() => {
                          if (onNavigateToGame && typeof msg.attachment?.id === 'number') {
                            onNavigateToGame(msg.attachment.id);
                          }
                        }}
                        className={`mb-2 p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                          isMine
                            ? 'bg-amber-600/30 border-amber-600/50 hover:bg-amber-600/40 text-slate-950'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-950 text-slate-200'
                        }`}
                      >
                        {msg.attachment.badgeUrl ? (
                          <img
                            src={msg.attachment.badgeUrl}
                            alt={msg.attachment.title}
                            className="w-8 h-8 rounded-lg object-contain bg-slate-950/40 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold truncate">{msg.attachment.title}</p>
                          {msg.attachment.subtitle && (
                            <p className="text-[10px] opacity-80 truncate">{msg.attachment.subtitle}</p>
                          )}
                        </div>
                        {msg.attachment.points !== undefined && (
                          <span className="text-[10px] font-mono font-bold ml-auto shrink-0 px-1.5 py-0.5 rounded bg-black/20">
                            +{msg.attachment.points}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-slate-500 px-1">
                    <span>{time.relative}</span>
                    {isMine && <CheckCheck className="w-3 h-3 text-amber-400" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Attachment Bar */}
        {selectedAttachment && (
          <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs text-slate-200 truncate">
                <span className="text-amber-400 font-semibold mr-1">Trophy:</span>
                {selectedAttachment.title}
              </div>
            </div>
            <button
              onClick={() => setSelectedAttachment(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attachment Picker Drawer */}
        {showAttachmentPicker && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-48 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Attach Trophy from Wanted List</span>
              <button
                onClick={() => setShowAttachmentPicker(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {wantedList.length === 0 ? (
              <p className="text-[11px] text-slate-500">No achievements in your wanted list yet.</p>
            ) : (
              <div className="space-y-1.5">
                {wantedList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedAttachment({
                        type: 'achievement',
                        id: item.achievementId,
                        title: item.achievementTitle,
                        subtitle: item.gameTitle,
                        badgeUrl: `https://media.retroachievements.org/Badge/${item.badgeName}.png`,
                        points: item.points,
                      });
                      setShowAttachmentPicker(false);
                      sounds.playTap();
                    }}
                    className="w-full text-left p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center gap-2 text-xs"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate text-slate-200">{item.achievementTitle}</span>
                    <span className="text-[10px] text-amber-400 font-mono ml-auto">
                      +{item.points} pts
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setShowAttachmentPicker(!showAttachmentPicker);
              }}
              title="Attach trophy to message"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center shrink-0 active:scale-95 transition-all"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Message @${activeRecipient}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !selectedAttachment}
              title="Send Message"
              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CONVERSATION LIST (APP-TO-APP MESSAGING HUB)
  // =========================================================================
  return (
    <div className="p-4 space-y-4 pb-16">
      {/* Top Messenger Card */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-white">RetroAchievements Chat</h2>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Messaging as <span className="text-amber-400 font-bold">@{currentUser}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              setShowNewChatModal(true);
            }}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Quick Followed Users Scroll */}
        {quickFollowed.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-400 mb-1.5 font-medium">Followed Players:</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickFollowed.map((followedUser) => (
                <button
                  key={followedUser}
                  onClick={() => {
                    sounds.playTap();
                    onSelectRecipient(followedUser);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-amber-400 shrink-0 transition-colors"
                >
                  <img
                    src={getUserAvatarUrl(undefined, followedUser)}
                    alt={followedUser}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://media.retroachievements.org/UserPic/Scott.png';
                    }}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{followedUser}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* New Chat Modal Popover */}
      {showNewChatModal && (
        <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-2xl space-y-2.5 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Message Any RetroAchievements User</span>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleStartNewChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter RetroAchievements username..."
              value={newChatUser}
              onChange={(e) => setNewChatUser(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!newChatUser.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs"
            >
              Chat
            </button>
          </form>

          {quickFollowed.length > 0 && (
            <div className="pt-1 border-t border-slate-800/80">
              <p className="text-[10px] text-slate-400 mb-1.5 font-medium">Quick Pick Followed:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickFollowed.map((user) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setShowNewChatModal(false);
                      onSelectRecipient(user);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <User className="w-2.5 h-2.5" />
                    <span>{user}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Filter for Existing Conversations */}
      {conversations.length > 1 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Conversations ({conversations.length})
          </h3>
          <span className="text-[10px] text-slate-500">RetroAchievements Network</span>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center mx-auto text-amber-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">No Conversations Yet</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Connect with any RetroAchievements user by entering their username or picking someone you follow.
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playTap();
                setShowNewChatModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const time = formatTime(conv.lastMessage.timestamp);
            const hasUnread = conv.unreadCount > 0;

            return (
              <button
                key={conv.user}
                onClick={() => {
                  sounds.playTap();
                  onSelectRecipient(conv.user);
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                  hasUnread
                    ? 'bg-amber-950/20 border-amber-500/50 hover:bg-amber-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={getUserAvatarUrl(undefined, conv.user)}
                    alt={conv.user}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://media.retroachievements.org/UserPic/Scott.png';
                    }}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-amber-500/40 bg-slate-800"
                  />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{conv.user}</span>
                    <span className="text-[10px] text-slate-500">{time.relative}</span>
                  </div>
                  <p
                    className={`text-xs truncate ${
                      hasUnread ? 'text-amber-300 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {conv.lastMessage.sender.toLowerCase() === currentUser.toLowerCase() && (
                      <span className="text-slate-500 mr-1">You:</span>
                    )}
                    {conv.lastMessage.attachment
                      ? `🏆 [Trophy] ${conv.lastMessage.attachment.title}`
                      : conv.lastMessage.text}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
