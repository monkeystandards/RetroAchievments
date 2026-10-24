import React, { useState } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  Trophy,
  Flame,
  Trash2,
  Edit3,
  ExternalLink,
  Share2,
  Sparkles,
  Plus,
  Tag,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WantedItem } from '../types/retro';
import { getBadgeUrl } from '../services/api';
import { sounds } from '../utils/audio';

interface WantedListViewProps {
  wantedList: WantedItem[];
  onToggleAchieved: (item: WantedItem) => void;
  onRemoveItem: (id: string) => void;
  onUpdateNotes: (id: string, notes: string, priority: WantedItem['priority']) => void;
  onNavigateToGame: (gameId: number) => void;
  onShareInChat: (item: WantedItem) => void;
  onBrowseGames: () => void;
}

export const WantedListView: React.FC<WantedListViewProps> = ({
  wantedList,
  onToggleAchieved,
  onRemoveItem,
  onUpdateNotes,
  onNavigateToGame,
  onShareInChat,
  onBrowseGames,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'conquered' | 'high'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPriority, setEditPriority] = useState<WantedItem['priority']>('normal');

  const totalPoints = wantedList.reduce((acc, item) => acc + item.points, 0);
  const conqueredCount = wantedList.filter((item) => item.achieved).length;
  const activeCount = wantedList.length - conqueredCount;
  const highPriorityCount = wantedList.filter((item) => item.priority === 'high' && !item.achieved).length;

  const handleConquer = (item: WantedItem) => {
    if (!item.achieved) {
      sounds.playAchievementUnlocked();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
      });
    } else {
      sounds.playTap();
    }
    onToggleAchieved(item);
  };

  const startEdit = (item: WantedItem) => {
    setEditingId(item.id);
    setEditNotes(item.notes || '');
    setEditPriority(item.priority || 'normal');
  };

  const saveEdit = (id: string) => {
    onUpdateNotes(id, editNotes, editPriority);
    setEditingId(null);
    sounds.playTap();
  };

  const filteredItems = wantedList.filter((item) => {
    if (filter === 'active') return !item.achieved;
    if (filter === 'conquered') return item.achieved;
    if (filter === 'high') return item.priority === 'high';
    return true;
  });

  return (
    <div className="p-4 space-y-4 pb-12">
      {/* Bounty KPI Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Target Achievement Bounties</h2>
              <p className="text-[11px] text-slate-400">Your personal RetroAchievements hunt list</p>
            </div>
          </div>

          <button
            onClick={onBrowseGames}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm shadow-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Targets</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/70 rounded-xl p-2 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium">Active Targets</div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{activeCount}</div>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium">Bounty Points</div>
            <div className="text-base font-bold text-indigo-300 font-mono mt-0.5">
              {totalPoints.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2 text-center border border-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium">Conquered</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{conqueredCount}</div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: `All (${wantedList.length})` },
          { id: 'active', label: `In Progress (${activeCount})` },
          { id: 'conquered', label: `Conquered (${conqueredCount})` },
          { id: 'high', label: `High Priority (${highPriorityCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playTap();
              setFilter(tab.id as any);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              filter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <BookmarkCheck className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-200">No achievements in this filter</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Browse any game in the Games tab and tap "+ Want" on any achievement to track it on your wanted list!
          </p>
          <button
            onClick={onBrowseGames}
            className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Browse Games & Achievement Sets</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-3.5 transition-all ${
                  item.achieved
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : item.priority === 'high'
                    ? 'bg-slate-900 border-rose-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={getBadgeUrl(item.badgeName, !item.achieved)}
                      alt={item.achievementTitle}
                      referrerPolicy="no-referrer"
                      className={`w-12 h-12 rounded-xl pixelated bg-slate-950 p-1 border ${
                        item.achieved ? 'border-emerald-400' : 'border-slate-800'
                      }`}
                    />
                    {item.achieved && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    {/* Game Link & Priority Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => onNavigateToGame(item.gameId)}
                        className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 truncate text-left"
                      >
                        <span className="truncate">{item.gameTitle}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            item.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs font-bold font-mono text-amber-400">
                          {item.points} pts
                        </span>
                      </div>
                    </div>

                    <h4
                      className={`text-xs font-bold mt-1 ${
                        item.achieved ? 'text-slate-400 line-through' : 'text-slate-100'
                      }`}
                    >
                      {item.achievementTitle}
                    </h4>

                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Custom Hunting Note or Editing Mode */}
                    {isEditing ? (
                      <div className="mt-2.5 p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Strategy notes (e.g. use Blue Falcon)..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Priority:</span>
                            {(['normal', 'medium', 'high'] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => setEditPriority(p)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                                  editPriority === p
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => saveEdit(item.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1 rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      item.notes && (
                        <div className="mt-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800/60 text-[11px] text-amber-200/90 flex items-start gap-1.5">
                          <Tag className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span className="italic flex-1">{item.notes}</span>
                        </div>
                      )
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                      {/* Left: Notes & Share */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          title="Edit strategy notes & priority"
                          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            sounds.playTap();
                            onShareInChat(item);
                          }}
                          title="Share with a friend in Messages"
                          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            sounds.playTap();
                            onRemoveItem(item.id);
                          }}
                          title="Remove from wanted list"
                          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 flex items-center justify-center active:scale-95 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Right: Conquer / Mark Done Button */}
                      <button
                        onClick={() => handleConquer(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all ${
                          item.achieved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.achieved ? 'Conquered ✓' : 'Mark Achieved!'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
