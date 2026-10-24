import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Paperclip,
  Trophy,
  X,
  ExternalLink,
  Plus,
  CheckCheck,
  Globe,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, ConversationSummary, WantedItem } from '../types/retro';
import { api, getUserAvatarUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface MessagesViewProps {
  activeRecipient: string | null;
  onSelectRecipient: (username: string | null) => void;
  onOpenUserProfile: (username: string) => void;
  onNavigateToGame: (gameId: number) => void;
  wantedList: WantedItem[];
  currentUser: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  activeRecipient,
  onSelectRecipient,
  onOpenUserProfile,
  onNavigateToGame,
  wantedList,
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
  
  // Toggle between in-app direct chat and RetroAchievements site wall comments
  const [threadTab, setThreadTab] = useState<'chat' | 'wall'>('chat');
  const [wallComments, setWallComments] = useState<any[]>([]);
  const [loadingWall, setLoadingWall] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Load conversations list
  const loadConversations = useCallback(() => {
    api
      .getConversations()
      .then((data) => setConversations(data))
      .catch((err) => console.error('Failed to load conversations:', err));
  }, []);

  useEffect(() => {
    loadConversations();
    // Refresh conversations list periodically
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load and poll live thread messages
  useEffect(() => {
    if (!activeRecipient) {
      loadConversations();
      return;
    }

    let isSubscribed = true;
    setLoadingThread(true);

    const fetchThread = () => {
      api
        .getThread(activeRecipient)
        .then((msgs) => {
          if (!isSubscribed) return;

          // If a new message arrived from the other person, play sound
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

    // Poll live messages every 2.5 seconds for real-time delivery
    const pollInterval = setInterval(fetchThread, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [activeRecipient, currentUser, loadConversations]);

  // Fetch wall comments when switching to wall tab
  useEffect(() => {
    if (activeRecipient && threadTab === 'wall') {
      setLoadingWall(true);
      api
        .getWallComments(activeRecipient)
        .then((data) => {
          setWallComments(data || []);
          setLoadingWall(false);
        })
        .catch((err) => {
          console.error('Failed to load wall comments:', err);
          setLoadingWall(false);
        });
    }
  }, [activeRecipient, threadTab]);

  // Scroll to bottom when thread updates
  useEffect(() => {
    if (activeRecipient && threadTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, activeRecipient, threadTab]);

  // Send real direct message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRecipient || (!inputText.trim() && !selectedAttachment)) return;

    const textToSend = inputText.trim() || (selectedAttachment ? `Check out this achievement: ${selectedAttachment.title}!` : '');
    const attachmentToSend = selectedAttachment || undefined;

    // Optimistic message update
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

      // Update message with server ID
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

  // Build official RetroAchievements URL to dispatch official site PM
  const getOfficialRAPMUrl = () => {
    if (!activeRecipient) return '#';
    const subject = `Message from ${currentUser} via RetroTrack`;
    const body = inputText.trim() || `Hi ${activeRecipient}, messaging you from RetroTrack!`;
    return `https://retroachievements.org/createmessage.php?t=${encodeURIComponent(
      activeRecipient
    )}&s=${encodeURIComponent(subject)}&b=${encodeURIComponent(body)}`;
  };

  // If a conversation is active, render the Chat Thread View
  if (activeRecipient) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        {/* Thread Header */}
        <div className="h-14 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => {
                sounds.playTap();
                onSelectRecipient(null);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

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
              <h3 className="text-xs font-bold text-white truncate">{activeRecipient}</h3>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>RetroAchievements Member</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Link to dispatch official website PM on retroachievements.org */}
            <a
              href={getOfficialRAPMUrl()}
              target="_blank"
              rel="noreferrer"
              title="Send an official Private Message to their inbox on RetroAchievements.org"
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2 py-1 rounded-lg transition-colors"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Official PM</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            <button
              onClick={() => {
                sounds.playTap();
                onOpenUserProfile(activeRecipient);
              }}
              className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Tab Selector: In-App Direct Messages vs Real RA Wall Messages */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 shrink-0">
          <button
            onClick={() => {
              sounds.playTap();
              setThreadTab('chat');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              threadTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Direct Chat ({threadMessages.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setThreadTab('wall');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              threadTab === 'wall'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>RA Public Wall</span>
          </button>
        </div>

        {/* TAB 1: Real In-App Direct Messages */}
        {threadTab === 'chat' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center py-1">
              <span className="text-[10px] text-slate-500 bg-slate-900/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
                Real messages deliver directly between authenticated RA accounts
              </span>
            </div>

            {loadingThread ? (
              <div className="space-y-3 animate-pulse p-4">
                <div className="h-12 w-3/4 bg-slate-800/40 rounded-2xl ml-auto" />
                <div className="h-16 w-3/4 bg-slate-800/40 rounded-2xl" />
                <div className="h-12 w-1/2 bg-slate-800/40 rounded-2xl ml-auto" />
              </div>
            ) : threadMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No direct messages yet with {activeRecipient}.</p>
                <p className="text-[11px] text-slate-600">
                  Send a message below or click "Official PM" to message their retroachievements.org inbox!
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isMe = msg.sender.toLowerCase() === currentUser.toLowerCase();

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                      isMe ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`rounded-2xl p-3 shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-medium'
                          : 'bg-slate-900 border border-slate-800 text-slate-100'
                      }`}
                    >
                      {/* Attached Achievement Card */}
                      {msg.attachment && (
                        <div
                          onClick={() => {
                            if (msg.attachment?.type === 'achievement' && msg.attachment.id) {
                              // If id available, can open
                            }
                          }}
                          className={`mb-2 p-2 rounded-xl border flex items-center gap-2.5 ${
                            isMe ? 'bg-amber-950/20 border-amber-900/40' : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          {msg.attachment.badgeUrl && (
                            <img
                              src={msg.attachment.badgeUrl}
                              alt={msg.attachment.title}
                              className="w-10 h-10 rounded-lg pixelated bg-slate-950 p-0.5 border border-amber-500/50 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] uppercase font-bold text-amber-300">
                              Achievement Shared
                            </div>
                            <div className="text-xs font-bold truncate text-white">
                              {msg.attachment.title}
                            </div>
                            {msg.attachment.subtitle && (
                              <div className="text-[10px] text-slate-300 truncate">
                                {msg.attachment.subtitle}
                              </div>
                            )}
                            {msg.attachment.points !== undefined && (
                              <div className="text-[10px] font-mono font-bold text-amber-300 mt-0.5">
                                +{msg.attachment.points} pts
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-500 font-mono">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-400" />}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* TAB 2: Real RetroAchievements User Wall Comments */}
        {threadTab === 'wall' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-center py-1">
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                Live comments from {activeRecipient}'s RetroAchievements.org wall
              </span>
            </div>

            {loadingWall ? (
              <div className="space-y-3 animate-pulse p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-900/60 rounded-2xl" />
                ))}
              </div>
            ) : wallComments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Globe className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No public wall comments found for {activeRecipient}.</p>
              </div>
            ) : (
              wallComments.map((c: any, idx: number) => (
                <div
                  key={c.id || idx}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getUserAvatarUrl(undefined, c.user)}
                        alt={c.user}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-700 bg-slate-800 shrink-0"
                      />
                      <span className="text-xs font-bold text-amber-300 truncate">{c.user}</span>
                    </div>
                    {c.submitted && (
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(c.submitted).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {c.commentText}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Attachment Preview Box */}
        {selectedAttachment && (
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {selectedAttachment.badgeUrl && (
                <img
                  src={selectedAttachment.badgeUrl}
                  alt={selectedAttachment.title}
                  className="w-7 h-7 rounded-md pixelated bg-slate-950 p-0.5 border border-amber-400"
                />
              )}
              <div className="text-xs text-slate-200 truncate">
                <span className="text-amber-400 font-semibold mr-1">Attachment:</span>
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
              <button onClick={() => setShowAttachmentPicker(false)} className="text-slate-500 hover:text-white">
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

        {/* Message Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
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
            placeholder={`Message ${activeRecipient}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !selectedAttachment}
            className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Conversation List Screen
  return (
    <div className="p-4 space-y-4 pb-12">
      {/* Messages Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white">Direct Messages</h2>
          <p className="text-[11px] text-slate-400">Persistent chat between RetroAchievements users</p>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            setShowNewChatModal(true);
          }}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* New Chat Modal Popover */}
      {showNewChatModal && (
        <div className="p-3 bg-slate-900 border border-indigo-500/50 rounded-2xl space-y-2.5 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Start Chat with Any RetroAchievements Member</span>
            <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleStartNewChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter exact username (e.g. Sarconius, Scott)..."
              value={newChatUser}
              onChange={(e) => setNewChatUser(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
            >
              Start
            </button>
          </form>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No active chats yet.</p>
            <p className="text-[11px] text-slate-500">
              Tap "New Chat" or click "Chat" on any follower or leaderboard player to start messaging!
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.user}
              onClick={() => {
                sounds.playTap();
                onSelectRecipient(conv.user);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 p-3 rounded-2xl flex items-center gap-3 transition-all text-left active:scale-[0.99] group"
            >
              <div className="relative shrink-0">
                <img
                  src={getUserAvatarUrl(conv.userPic, conv.user)}
                  alt={conv.user}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://media.retroachievements.org/UserPic/Scott.png';
                  }}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800"
                />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-slate-900">
                    {conv.unreadCount}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {conv.user}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(conv.lastMessage.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {conv.lastMessage.attachment && (
                    <span className="text-amber-400 font-semibold mr-1">[Trophy]</span>
                  )}
                  {conv.lastMessage.text}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
