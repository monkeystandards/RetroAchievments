export interface UserProfile {
  user: string;
  ulid?: string;
  userPic: string;
  memberSince?: string;
  richPresenceMsg?: string;
  lastGameId?: number;
  contribCount?: number;
  contribYield?: number;
  totalPoints: number;
  totalSoftcorePoints?: number;
  totalTruePoints?: number;
  permissions?: number;
  untracked?: boolean;
  id?: number;
  userWallActive?: boolean;
  motto?: string;
  rank?: number;
}

export interface RecentlyPlayedGame {
  gameId: number;
  consoleId: number;
  consoleName: string;
  title: string;
  imageIcon: string;
  imageTitle?: string;
  imageIngame?: string;
  imageBoxArt?: string;
  lastPlayed: string;
  achievementsTotal: number;
  numPossibleAchievements?: number;
  possibleScore?: number;
  numAchieved?: number;
  scoreAchieved?: number;
  numAchievedHardcore?: number;
  scoreAchievedHardcore?: number;
}

export interface RecentAchievement {
  id: number;
  gameId: number;
  gameTitle: string;
  title: string;
  description: string;
  points: number;
  type?: string;
  badgeName: string;
  isAwarded?: boolean;
  dateAwarded?: string;
  hardcoreAchieved?: boolean;
}

export interface UserSummaryData {
  user: string;
  memberSince?: string;
  lastActivity?: string;
  richPresenceMsg?: string;
  totalPoints: number;
  totalSoftcorePoints?: number;
  totalTruePoints?: number;
  rank?: number;
  totalRanked?: number;
  recentlyPlayed?: RecentlyPlayedGame[];
  recentAchievements?: Record<string, Record<string, RecentAchievement>>;
  awarded?: Record<string, any>;
  userPic?: string;
  motto?: string;
  status?: string;
}

export interface FollowedUser {
  user: string;
  ulid?: string;
  points: number;
  pointsSoftcore: number;
  isFollowingMe?: boolean;
  amIFollowing?: boolean;
  userPic?: string;
  richPresence?: string;
}

export interface ConsoleItem {
  id: number;
  name: string;
  iconUrl?: string;
  active: boolean;
  isGameSystem: boolean;
}

export interface GameListItem {
  id: number;
  title: string;
  consoleId: number;
  consoleName: string;
  imageIcon: string;
  numAchievements: number;
  numLeaderboards?: number;
  points: number;
  dateModified?: string;
  forumTopicId?: number;
}

export interface GameAchievement {
  id: number;
  numAwarded: number;
  numAwardedHardcore: number;
  title: string;
  description: string;
  points: number;
  trueRatio: number;
  author: string;
  dateModified: string;
  dateCreated: string;
  badgeName: string;
  displayOrder: number;
  memAddr: string;
  type: 'progression' | 'win_condition' | 'missable' | null;
  // Progress when fetched with user
  dateEarned?: string;
  dateEarnedHardcore?: string;
  isAwarded?: boolean;
}

export interface GameDetailData {
  id: number;
  title: string;
  consoleId: number;
  forumTopicId?: number;
  flags?: number;
  imageIcon: string;
  imageTitle: string;
  imageIngame: string;
  imageBoxArt: string;
  publisher?: string;
  developer?: string;
  genre?: string;
  released?: string;
  isFinal?: boolean;
  consoleName: string;
  richPresencePatch?: string;
  numAchievements: number;
  numDistinctPlayers?: number;
  achievements?: Record<string, GameAchievement>;
}

export interface TopUser {
  username: string;
  totalPoints: number;
  totalRatioPoints: number;
}

export interface WantedItem {
  id: string;
  achievementId: number;
  gameId: number;
  gameTitle: string;
  achievementTitle: string;
  description: string;
  points: number;
  badgeName: string;
  type?: string | null;
  priority: 'high' | 'medium' | 'normal';
  notes?: string;
  targetDate?: string;
  achieved: boolean;
  dateAdded: string;
  dateAchieved?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  text: string;
  timestamp: string;
  read: boolean;
  attachment?: {
    type: 'achievement' | 'game';
    id: number | string;
    title: string;
    subtitle?: string;
    badgeUrl?: string;
    points?: number;
  };
}

export interface ConversationSummary {
  user: string;
  lastMessage: ChatMessage;
  unreadCount: number;
  userPic?: string;
}
