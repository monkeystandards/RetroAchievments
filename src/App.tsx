import React, { useState, useEffect, useCallback } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { DashboardView } from './components/DashboardView';
import { GamesView } from './components/GamesView';
import { WantedListView } from './components/WantedListView';
import { CommunityView } from './components/CommunityView';
import { MessagesView } from './components/MessagesView';
import { UserProfileModal } from './components/UserProfileModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { LoginView } from './components/LoginView';
import {
  UserProfile,
  UserSummaryData,
  FollowedUser,
  ConsoleItem,
  WantedItem,
  GameAchievement,
  GameDetailData,
} from './types/retro';
import { api, getActiveUsername, isAuthenticated } from './services/api';
import { sounds } from './utils/audio';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUsername, setCurrentUsername] = useState<string>(getActiveUsername());

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<UserSummaryData | null>(null);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [followers, setFollowers] = useState<FollowedUser[]>([]);
  const [consoles, setConsoles] = useState<ConsoleItem[]>([]);
  const [wantedList, setWantedList] = useState<WantedItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(false);

  // Navigation contexts
  const [selectedConsoleId, setSelectedConsoleId] = useState<number>(3); // Default SNES
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [chatRecipient, setChatRecipient] = useState<string | null>(null);
  const [inspectedUsername, setInspectedUsername] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Fetch initial profile & data when logged in
  const loadUserData = useCallback(async () => {
    const username = getActiveUsername();
    if (!username) return;

    setLoadingInitial(true);
    try {
      setCurrentUsername(username);

      const [profileRes, followingRes, followersRes, consolesRes, wantedRes] = await Promise.allSettled([
        api.getProfile(username),
        api.getFollowing(),
        api.getFollowers(),
        api.getConsoles(),
        api.getWantedList(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.profile);
        setSummary(profileRes.value.summary);
      }
      if (followingRes.status === 'fulfilled') {
        setFollowing(followingRes.value);
      }
      if (followersRes.status === 'fulfilled') {
        setFollowers(followersRes.value);
      }
      if (consolesRes.status === 'fulfilled') {
        setConsoles(consolesRes.value);
        if (consolesRes.value.length > 0 && !selectedConsoleId) {
          setSelectedConsoleId(consolesRes.value[0].id);
        }
      }
      if (wantedRes.status === 'fulfilled') {
        setWantedList(wantedRes.value);
      }
    } catch (err) {
      console.error('Initial load error:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, [selectedConsoleId]);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn, loadUserData]);

  // Handle Wanted List toggling
  const handleToggleWanted = async (achievement: GameAchievement, game: GameDetailData) => {
    const existing = wantedList.find((w) => w.achievementId === achievement.id);

    if (existing) {
      try {
        await api.removeFromWantedList(existing.id);
        setWantedList((prev) => prev.filter((w) => w.id !== existing.id));
        showToast(`Removed "${achievement.title}" from Wanted List`, 'info');
        sounds.playTap();
      } catch (err) {
        console.error('Failed to remove wanted item:', err);
      }
    } else {
      try {
        const newItem = await api.addToWantedList({
          achievementId: achievement.id,
          gameId: game.id,
          gameTitle: game.title,
          achievementTitle: achievement.title,
          description: achievement.description,
          points: achievement.points,
          badgeName: achievement.badgeName,
          type: achievement.type,
          priority: 'normal',
          achieved: Boolean(achievement.dateEarned || achievement.isAwarded),
        });
        setWantedList((prev) => [newItem, ...prev]);
        showToast(`Added "${achievement.title}" to Wanted List!`, 'success');
        sounds.playTap();
      } catch (err) {
        console.error('Failed to add wanted item:', err);
      }
    }
  };

  const handleToggleAchievedInWanted = async (item: WantedItem) => {
    try {
      const nextState = !item.achieved;
      const updated = await api.updateWantedItem(item.id, { achieved: nextState });
      setWantedList((prev) => prev.map((w) => (w.id === item.id ? updated : w)));
      if (nextState) {
        showToast(`Trophy Conquered: "${item.achievementTitle}"!`, 'success');
      }
    } catch (err) {
      console.error('Failed to toggle achieved state:', err);
    }
  };

  const handleRemoveWantedItem = async (id: string) => {
    try {
      await api.removeFromWantedList(id);
      setWantedList((prev) => prev.filter((w) => w.id !== id));
      showToast('Target removed from Wanted List', 'info');
    } catch (err) {
      console.error('Failed to remove wanted item:', err);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string, priority: WantedItem['priority']) => {
    try {
      const updated = await api.updateWantedItem(id, { notes, priority });
      setWantedList((prev) => prev.map((w) => (w.id === id ? updated : w)));
      showToast('Hunting strategy saved', 'success');
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  // Cross-feature routing helpers
  const handleOpenChatWithUser = (user: string) => {
    setChatRecipient(user);
    setActiveTab('messages');
  };

  const handleShareAchievementInChat = (achievement: GameAchievement | WantedItem, game?: GameDetailData) => {
    const isWanted = 'achievementTitle' in achievement;
    const title = isWanted ? achievement.achievementTitle : achievement.title;
    const gameTitle = isWanted ? achievement.gameTitle : game?.title || 'Retro Game';
    const points = achievement.points;
    const achId = isWanted ? achievement.achievementId : achievement.id;

    const targetUser = following.length > 0 ? following[0].user : 'Scott';
    setChatRecipient(targetUser);
    setActiveTab('messages');
    showToast(`Sharing "${title}" with ${targetUser} via RetroAchievements`, 'info');

    // Open official RetroAchievements website message composer
    const composeUrl = `https://retroachievements.org/createmessage.php?t=${encodeURIComponent(
      targetUser
    )}&s=${encodeURIComponent(`Check out: ${title}`)}&b=${encodeURIComponent(
      `Hey ${targetUser}, check out this achievement from ${gameTitle}: "${title}" (${points} pts)! https://retroachievements.org/achievement/${achId}`
    )}`;
    window.open(composeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNavigateToGame = (gameId: number) => {
    setSelectedGameId(gameId);
    setActiveTab('games');
  };

  // Dynamic header title based on active view
  let headerTitle = 'RetroTrack';
  let showBack = false;
  let onBack: (() => void) | undefined = undefined;

  if (!isLoggedIn) {
    headerTitle = 'RetroAchievements Sign In';
  } else if (activeTab === 'dashboard') {
    headerTitle = 'RetroTrack Hub';
  } else if (activeTab === 'games') {
    if (selectedGameId) {
      headerTitle = 'Game Achievement Set';
      showBack = true;
      onBack = () => setSelectedGameId(null);
    } else {
      headerTitle = 'Retro Games Library';
    }
  } else if (activeTab === 'wanted') {
    headerTitle = 'Wanted Achievement List';
  } else if (activeTab === 'community') {
    headerTitle = 'Community & Following';
  } else if (activeTab === 'messages') {
    if (chatRecipient) {
      headerTitle = `${chatRecipient}'s Wall`;
      showBack = true;
      onBack = () => setChatRecipient(null);
    } else {
      headerTitle = 'RA Website Messages';
    }
  }

  return (
    <>
      <AndroidFrame
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'games' && selectedGameId) {
            // keep game selected
          }
        }}
        headerTitle={headerTitle}
        showBack={showBack}
        onBack={onBack}
        onOpenSettings={() => setIsSettingsOpen(true)}
        username={currentUsername}
        userPic={profile?.userPic}
        badgeNotificationCount={wantedList.filter((w) => !w.achieved).length}
        isAuthenticated={isLoggedIn}
      >
        {/* If user is not authenticated with username & password, show LoginView */}
        {!isLoggedIn ? (
          <LoginView
            onLoginSuccess={(user) => {
              setIsLoggedIn(true);
              setCurrentUsername(user);
              showToast(`Welcome to RetroTrack, ${user}!`, 'success');
            }}
          />
        ) : (
          <>
            {/* Tab 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <DashboardView
                profile={profile}
                summary={summary}
                following={following}
                wantedCount={wantedList.filter((w) => !w.achieved).length}
                onNavigateToGames={(cId) => {
                  if (cId) setSelectedConsoleId(cId);
                  setSelectedGameId(null);
                  setActiveTab('games');
                }}
                onNavigateToGameDetails={(gId) => {
                  setSelectedGameId(gId);
                  setActiveTab('games');
                }}
                onNavigateToWanted={() => setActiveTab('wanted')}
                onNavigateToCommunity={() => setActiveTab('community')}
                onSelectUser={(u) => setInspectedUsername(u)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                loading={loadingInitial}
              />
            )}

            {/* Tab 2: Games & Achievement Sets */}
            {activeTab === 'games' && (
              <GamesView
                consoles={consoles}
                selectedConsoleId={selectedConsoleId}
                onSelectConsole={(cId) => {
                  setSelectedConsoleId(cId);
                  setSelectedGameId(null);
                }}
                selectedGameId={selectedGameId}
                onSelectGame={(gId) => setSelectedGameId(gId)}
                wantedList={wantedList}
                onToggleWanted={handleToggleWanted}
                onShareInChat={(ach, game) => handleShareAchievementInChat(ach, game)}
              />
            )}

            {/* Tab 3: Wanted List Tracker */}
            {activeTab === 'wanted' && (
              <WantedListView
                wantedList={wantedList}
                onToggleAchieved={handleToggleAchievedInWanted}
                onRemoveItem={handleRemoveWantedItem}
                onUpdateNotes={handleUpdateNotes}
                onNavigateToGame={handleNavigateToGame}
                onShareInChat={(item) => handleShareAchievementInChat(item)}
                onBrowseGames={() => {
                  setSelectedGameId(null);
                  setActiveTab('games');
                }}
              />
            )}

            {/* Tab 4: Community & Following */}
            {activeTab === 'community' && (
              <CommunityView
                following={following}
                followers={followers}
                onOpenMessageWithUser={handleOpenChatWithUser}
                onOpenUserProfile={(u) => setInspectedUsername(u)}
                onRefreshFollows={loadUserData}
              />
            )}

            {/* Tab 5: Messages */}
            {activeTab === 'messages' && (
              <MessagesView
                activeRecipient={chatRecipient}
                onSelectRecipient={(u) => setChatRecipient(u)}
                onOpenUserProfile={(u) => setInspectedUsername(u)}
                onNavigateToGame={handleNavigateToGame}
                wantedList={wantedList}
                currentUser={currentUsername}
              />
            )}
          </>
        )}

        {/* In-App Toast Notification */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/50 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl shadow-amber-950/40 backdrop-blur-md flex items-center gap-2 max-w-[90%] text-center animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}
      </AndroidFrame>

      {/* User Profile Inspection Modal */}
      <UserProfileModal
        username={inspectedUsername}
        onClose={() => setInspectedUsername(null)}
        onOpenMessageWithUser={handleOpenChatWithUser}
        onNavigateToGame={handleNavigateToGame}
      />

      {/* Account & Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onLogout={() => {
          setIsLoggedIn(false);
          setProfile(null);
          setSummary(null);
          setFollowing([]);
          setFollowers([]);
          showToast('Signed out of RetroAchievements', 'info');
        }}
      />
    </>
  );
}
