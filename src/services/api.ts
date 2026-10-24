import {
  UserProfile,
  UserSummaryData,
  FollowedUser,
  ConsoleItem,
  GameListItem,
  GameDetailData,
  TopUser,
  WantedItem,
  ChatMessage,
  ConversationSummary,
} from '../types/retro';

// Storage keys
const STORAGE_USER_KEY = 'retro_active_username';
const STORAGE_API_KEY = 'retro_api_key';

export function getActiveUsername(): string {
  return localStorage.getItem(STORAGE_USER_KEY) || 'Scott';
}

export function setActiveUsername(username: string): void {
  localStorage.setItem(STORAGE_USER_KEY, username.trim());
}

export function getCustomApiKey(): string {
  return localStorage.getItem(STORAGE_API_KEY) || 'eAQ12mv8MaVNfF4qjCm8fcaigOIYoNXd';
}

export function setCustomApiKey(key: string): void {
  localStorage.setItem(STORAGE_API_KEY, key.trim());
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-ra-user': getActiveUsername(),
    'x-ra-key': getCustomApiKey(),
  };
}

export const api = {
  // Config
  async getConfig() {
    const res = await fetch('/api/ra/config');
    return res.json();
  },

  // User Profile and Summary
  async getProfile(username?: string): Promise<{ profile: UserProfile; summary: UserSummaryData | null }> {
    const target = username || getActiveUsername();
    const res = await fetch(`/api/ra/profile/${encodeURIComponent(target)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch profile for ${target}`);
    }
    return res.json();
  },

  // People followed by active user
  async getFollowing(): Promise<FollowedUser[]> {
    const res = await fetch('/api/ra/following', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch followed users');
    }
    const data = await res.json();
    return data.results || [];
  },

  // People following active user
  async getFollowers(): Promise<FollowedUser[]> {
    const res = await fetch('/api/ra/followers', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch followers');
    }
    const data = await res.json();
    return data.results || [];
  },

  // Consoles
  async getConsoles(): Promise<ConsoleItem[]> {
    const res = await fetch('/api/ra/consoles', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch consoles');
    return res.json();
  },

  // Games for a console
  async getGames(consoleId: number): Promise<GameListItem[]> {
    const res = await fetch(`/api/ra/games?consoleId=${consoleId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch games for console #${consoleId}`);
    return res.json();
  },

  // Game details + full achievement set + user progress
  async getGameDetails(gameId: number, username?: string): Promise<{ game: GameDetailData; progress: any }> {
    const user = username || getActiveUsername();
    const res = await fetch(`/api/ra/game/${gameId}?user=${encodeURIComponent(user)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch game #${gameId}`);
    }
    return res.json();
  },

  // Leaderboard
  async getTopUsers(): Promise<TopUser[]> {
    const res = await fetch('/api/ra/top-users', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch top users');
    return res.json();
  },

  // Messages API
  async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch(`/api/messages`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async getThread(withUser: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/messages?withUser=${encodeURIComponent(withUser)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load thread with ${withUser}`);
    return res.json();
  },

  async sendMessage(params: {
    recipient: string;
    text: string;
    attachment?: ChatMessage['attachment'];
  }): Promise<ChatMessage> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sender: getActiveUsername(),
        ...params,
      }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async markThreadRead(withUser: string): Promise<void> {
    await fetch('/api/messages/read', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username: getActiveUsername(),
        withUser,
      }),
    });
  },

  // Wanted List API
  async getWantedList(): Promise<WantedItem[]> {
    const res = await fetch('/api/wanted-list');
    if (!res.ok) throw new Error('Failed to fetch wanted list');
    return res.json();
  },

  async addToWantedList(item: Partial<WantedItem>): Promise<WantedItem> {
    const res = await fetch('/api/wanted-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add to wanted list');
    return res.json();
  },

  async updateWantedItem(id: string, updates: Partial<WantedItem>): Promise<WantedItem> {
    const res = await fetch(`/api/wanted-list/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update wanted item');
    return res.json();
  },

  async removeFromWantedList(id: string): Promise<void> {
    const res = await fetch(`/api/wanted-list/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete wanted item');
  },
};

// CDN Media URL Builders
export function getBadgeUrl(badgeName: string, locked: boolean = false): string {
  if (!badgeName) return '';
  const suffix = locked ? '_lock.png' : '.png';
  return `https://media.retroachievements.org/Badge/${badgeName}${suffix}`;
}

export function getUserAvatarUrl(userPic: string | undefined, username: string): string {
  if (userPic && userPic.startsWith('http')) return userPic;
  if (userPic) {
    const clean = userPic.startsWith('/') ? userPic : `/${userPic}`;
    return `https://media.retroachievements.org${clean}`;
  }
  return `https://media.retroachievements.org/UserPic/${username}.png`;
}

export function getGameImageUrl(imagePath?: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `https://media.retroachievements.org${clean}`;
}
