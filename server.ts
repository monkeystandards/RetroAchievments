import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ra from '@retroachievements/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

import { getDecryptedApiKey } from './src/server/vault.ts';

const DEFAULT_USERNAME = 'Scott';

// Simple in-memory cache for fast responsive mobile loading
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlSeconds: number) {
  cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

function getAuth(req: express.Request) {
  const username = (req.headers['x-ra-user'] as string) || (req.query.ra_user as string) || 'Scott';
  const webApiKey = getDecryptedApiKey();

  if (!username) {
    throw new Error('RetroAchievements username is required.');
  }

  return {
    auth: ra.buildAuthorization({ username, webApiKey }),
    username,
    webApiKey,
  };
}

// In-memory data store for messages and wanted list
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

export interface WantedAchievement {
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

// Seed initial messages with a friend/follower so the messaging feature is active immediately
let messagesStore: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'colesie121',
    recipient: DEFAULT_USERNAME,
    text: 'Hey! Did you check out the new achievement set for F-Zero X on N64? The Staff Ghost times are insane!',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: true,
    attachment: {
      type: 'achievement',
      id: 53574,
      title: 'Classic Cruising',
      subtitle: 'F-Zero X (N64)',
      badgeUrl: 'https://media.retroachievements.org/Badge/55003.png',
      points: 50,
    },
  },
  {
    id: 'msg-2',
    sender: DEFAULT_USERNAME,
    recipient: 'colesie121',
    text: 'Just added that one to my Wanted List! Planning a weekend grind session for it.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: true,
  },
  {
    id: 'msg-3',
    sender: 'colesie121',
    recipient: DEFAULT_USERNAME,
    text: 'Nice! Hit me up when you attempt Mute City, I found a clean shortcut on the loop.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
  },
  {
    id: 'msg-4',
    sender: 'Sarconius',
    recipient: DEFAULT_USERNAME,
    text: 'Awesome progress on your Retro leaderboard rank recently! Keep pushing!',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: true,
  },
];

let wantedListStore: WantedAchievement[] = [
  {
    id: 'wanted-1',
    achievementId: 53574,
    gameId: 10133,
    gameTitle: 'F-Zero X',
    achievementTitle: 'Classic Cruising',
    description: `Beat the Staff Ghost time of 1'12"507 on Mute City`,
    points: 50,
    badgeName: '55003',
    type: 'progression',
    priority: 'high',
    notes: 'Use Blue Falcon and optimize boost pads on turn 3',
    achieved: false,
    dateAdded: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'wanted-2',
    achievementId: 128551,
    gameId: 12211,
    gameTitle: 'Teenage Mutant Ninja Turtles: Turtles in Time',
    achievementTitle: 'Big Apple, 3AM',
    description: 'Clear Stage 1 in any difficulty. (Factory Settings)',
    points: 5,
    badgeName: '141252',
    type: 'progression',
    priority: 'normal',
    notes: 'Fun warm-up run with Leonardo',
    achieved: true,
    dateAdded: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    dateAchieved: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
];

// Configuration status endpoint
app.get('/api/ra/config', (_req, res) => {
  res.json({
    authMethod: 'password_only',
    vaultEncrypted: true,
  });
});

// RetroAchievements Username & Password Login endpoint
app.post('/api/ra/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const cleanUser = username.trim();
    const loginUrl = `https://retroachievements.org/dorequest.php?r=login&u=${encodeURIComponent(cleanUser)}&p=${encodeURIComponent(password)}`;
    
    const raRes = await fetch(loginUrl, {
      headers: {
        'User-Agent': 'RetroTrack/1.0',
        Accept: 'application/json',
      },
    });

    const data: any = await raRes.json().catch(() => null);

    if (!data || !data.Success) {
      return res.status(401).json({
        success: false,
        error: data?.Error || 'Invalid username or password. Please check your RetroAchievements credentials.',
      });
    }

    const authenticatedUser = data.User || cleanUser;

    // Fetch full profile using decrypted app authorization
    let profileData: any = null;
    try {
      const auth = ra.buildAuthorization({ username: authenticatedUser, webApiKey: getDecryptedApiKey() });
      profileData = await ra.getUserProfile(auth, { username: authenticatedUser });
    } catch (e) {
      // Profile fetch can fallback gracefully
    }

    res.json({
      success: true,
      user: authenticatedUser,
      token: data.Token,
      score: data.Score,
      profile: profileData,
    });
  } catch (err: any) {
    console.error('RetroAchievements login error:', err);
    res.status(500).json({ error: err.message || 'Failed to authenticate with RetroAchievements' });
  }
});

// User Profile & Summary
app.get('/api/ra/profile/:username', async (req, res) => {
  try {
    const targetUsername = req.params.username;
    const { auth } = getAuth(req);
    const cacheKey = `profile_${targetUsername.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [profile, summary] = await Promise.allSettled([
      ra.getUserProfile(auth, { username: targetUsername }),
      ra.getUserSummary(auth, { username: targetUsername, recentGamesCount: 8, recentAchievementsCount: 8 }),
    ]);

    if (profile.status === 'rejected') {
      return res.status(404).json({ error: profile.reason?.message || 'User not found' });
    }

    const payload = {
      profile: profile.value,
      summary: summary.status === 'fulfilled' ? summary.value : null,
    };

    setCache(cacheKey, payload, 180); // cache 3 mins
    res.json(payload);
  } catch (err: any) {
    console.error('Error in /api/ra/profile:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

// People I Follow
app.get('/api/ra/following', async (req, res) => {
  try {
    const { auth, username } = getAuth(req);
    const cacheKey = `following_${username.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await ra.getUsersIFollow(auth);
    setCache(cacheKey, data, 120);
    res.json(data);
  } catch (err: any) {
    console.error('Error in /api/ra/following:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch followed users' });
  }
});

// People Following Me
app.get('/api/ra/followers', async (req, res) => {
  try {
    const { auth, username } = getAuth(req);
    const cacheKey = `followers_${username.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const data = await ra.getUsersFollowingMe(auth);
    setCache(cacheKey, data, 120);
    res.json(data);
  } catch (err: any) {
    console.error('Error in /api/ra/followers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch followers' });
  }
});

// Console list
app.get('/api/ra/consoles', async (req, res) => {
  try {
    const cacheKey = 'consoles_list';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { auth } = getAuth(req);
    const consoles = await ra.getConsoleIds(auth);
    // Sort popular systems to the front
    const priority = [
      'SNES/Super Famicom',
      'Genesis/Mega Drive',
      'Nintendo 64',
      'Game Boy Advance',
      'PlayStation',
      'NES/Famicom',
      'Game Boy',
      'Arcade',
      'PlayStation 2',
      'Nintendo DS',
    ];
    const sorted = [...consoles].sort((a, b) => {
      const idxA = priority.indexOf(a.name);
      const idxB = priority.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    setCache(cacheKey, sorted, 86400); // 24 hours
    res.json(sorted);
  } catch (err: any) {
    console.error('Error in /api/ra/consoles:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch consoles' });
  }
});

// Games for a console
app.get('/api/ra/games', async (req, res) => {
  try {
    const consoleId = parseInt(req.query.consoleId as string, 10);
    if (!consoleId) {
      return res.status(400).json({ error: 'consoleId is required' });
    }

    const cacheKey = `games_console_${consoleId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { auth } = getAuth(req);
    const games = await ra.getGameList(auth, { consoleId });
    // Filter to games with achievements or sort by points/achievements
    const validGames = games.filter((g) => g.numAchievements > 0);
    validGames.sort((a, b) => b.numAchievements - a.numAchievements);

    setCache(cacheKey, validGames, 3600); // 1 hour
    res.json(validGames);
  } catch (err: any) {
    console.error('Error in /api/ra/games:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch games' });
  }
});

// Extended Game details and achievement set
app.get('/api/ra/game/:gameId', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const targetUser = (req.query.user as string) || DEFAULT_USERNAME;
    const { auth } = getAuth(req);

    const cacheKey = `game_${gameId}_${targetUser.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Fetch game details and user progress if user provided
    const [gameExtended, userProgress] = await Promise.allSettled([
      ra.getGameExtended(auth, { gameId }),
      targetUser ? ra.getGameInfoAndUserProgress(auth, { username: targetUser, gameId }) : null,
    ]);

    if (gameExtended.status === 'rejected') {
      return res.status(404).json({ error: gameExtended.reason?.message || 'Game not found' });
    }

    const game = gameExtended.value;
    const progress = userProgress.status === 'fulfilled' ? userProgress.value : null;

    const payload = {
      game,
      progress,
    };

    setCache(cacheKey, payload, 300); // 5 mins
    res.json(payload);
  } catch (err: any) {
    console.error('Error in /api/ra/game/:id:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch game details' });
  }
});

// Top Users Leaderboard
app.get('/api/ra/top-users', async (req, res) => {
  try {
    const cacheKey = 'top_ten_users';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { auth } = getAuth(req);
    const topUsers = await ra.getTopTenUsers(auth);

    setCache(cacheKey, topUsers, 600); // 10 mins
    res.json(topUsers);
  } catch (err: any) {
    console.error('Error in /api/ra/top-users:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch top users' });
  }
});

// Messages API
app.get('/api/messages', (req, res) => {
  const currentUsername = (req.headers['x-ra-user'] as string) || (req.query.ra_user as string) || DEFAULT_USERNAME;
  const withUser = req.query.withUser as string;

  if (withUser) {
    const thread = messagesStore.filter(
      (m) =>
        (m.sender.toLowerCase() === currentUsername.toLowerCase() && m.recipient.toLowerCase() === withUser.toLowerCase()) ||
        (m.sender.toLowerCase() === withUser.toLowerCase() && m.recipient.toLowerCase() === currentUsername.toLowerCase())
    );
    thread.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return res.json(thread);
  }

  // Return list of conversations grouped by other participant
  const convMap = new Map<string, { user: string; lastMessage: ChatMessage; unreadCount: number }>();

  messagesStore.forEach((m) => {
    const isSender = m.sender.toLowerCase() === currentUsername.toLowerCase();
    const other = isSender ? m.recipient : m.sender;
    const existing = convMap.get(other.toLowerCase());

    const isUnread = !isSender && !m.read;

    if (!existing || new Date(m.timestamp).getTime() > new Date(existing.lastMessage.timestamp).getTime()) {
      convMap.set(other.toLowerCase(), {
        user: other,
        lastMessage: m,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
      });
    } else if (isUnread) {
      existing.unreadCount += 1;
    }
  });

  const list = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  );
  res.json(list);
});

app.post('/api/messages', (req, res) => {
  const currentUsername = (req.headers['x-ra-user'] as string) || req.body.sender || DEFAULT_USERNAME;
  const { recipient, text, attachment } = req.body;

  if (!recipient || !text?.trim()) {
    return res.status(400).json({ error: 'recipient and text are required' });
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender: currentUsername,
    recipient: recipient.trim(),
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    attachment: attachment || undefined,
  };

  messagesStore.push(newMessage);

  // If sending to one of our simulated community users, send a fun automatic gamer reply after a brief moment
  const simulatedUsers = ['colesie121', 'sarconius', 'maxmilyin', 'chronogear'];
  if (simulatedUsers.includes(recipient.toLowerCase())) {
    setTimeout(() => {
      const replies = [
        `Awesome catch! I remember grinding that retro achievement for hours. Good luck with the next set!`,
        `Nice message! Are you going for Hardcore mode or Softcore? The leaderboard competition is heating up!`,
        `Thanks for sharing! Retro gaming on these classic titles never gets old.`,
        `GG! Added that to my watchlist as well. Let's see who masters the set first!`,
      ];
      const autoReplyText = replies[Math.floor(Math.random() * replies.length)];
      messagesStore.push({
        id: `msg-reply-${Date.now()}`,
        sender: recipient,
        recipient: currentUsername,
        text: autoReplyText,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }, 2500);
  }

  res.status(201).json(newMessage);
});

// Mark thread as read
app.post('/api/messages/read', (req, res) => {
  const currentUsername = (req.headers['x-ra-user'] as string) || req.body.username || DEFAULT_USERNAME;
  const { withUser } = req.body;
  if (!withUser) return res.status(400).json({ error: 'withUser is required' });

  messagesStore.forEach((m) => {
    if (m.recipient.toLowerCase() === currentUsername.toLowerCase() && m.sender.toLowerCase() === withUser.toLowerCase()) {
      m.read = true;
    }
  });

  res.json({ success: true });
});

// Wanted List API
app.get('/api/wanted-list', (_req, res) => {
  res.json(wantedListStore);
});

app.post('/api/wanted-list', (req, res) => {
  const item = req.body as Partial<WantedAchievement>;
  if (!item.achievementId || !item.achievementTitle) {
    return res.status(400).json({ error: 'achievementId and achievementTitle are required' });
  }

  // Prevent duplicate achievements
  const existing = wantedListStore.find((w) => w.achievementId === item.achievementId);
  if (existing) {
    return res.json(existing);
  }

  const newItem: WantedAchievement = {
    id: `wanted-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    achievementId: item.achievementId,
    gameId: item.gameId || 0,
    gameTitle: item.gameTitle || 'Unknown Game',
    achievementTitle: item.achievementTitle,
    description: item.description || '',
    points: item.points || 0,
    badgeName: item.badgeName || '',
    type: item.type || null,
    priority: item.priority || 'normal',
    notes: item.notes || '',
    targetDate: item.targetDate,
    achieved: Boolean(item.achieved),
    dateAdded: new Date().toISOString(),
  };

  wantedListStore.unshift(newItem);
  res.status(201).json(newItem);
});

app.patch('/api/wanted-list/:id', (req, res) => {
  const { id } = req.params;
  const idx = wantedListStore.findIndex((w) => w.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  const existing = wantedListStore[idx];
  const updated: WantedAchievement = {
    ...existing,
    ...req.body,
    dateAchieved: req.body.achieved && !existing.achieved ? new Date().toISOString() : existing.dateAchieved,
  };

  wantedListStore[idx] = updated;
  res.json(updated);
});

app.delete('/api/wanted-list/:id', (req, res) => {
  const { id } = req.params;
  wantedListStore = wantedListStore.filter((w) => w.id !== id);
  res.json({ success: true, deletedId: id });
});

// Integrate with Vite middleware in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RetroTrack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
