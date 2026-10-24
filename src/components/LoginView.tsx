import React, { useState } from 'react';
import {
  Trophy,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audio';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your RetroAchievements username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.loginWithCredentials(username.trim(), password);
      sounds.playAchievementUnlocked();
      onLoginSuccess(res.user);
    } catch (err: any) {
      sounds.playTap();
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center p-6 space-y-6">
      {/* Brand Emblem */}
      <div className="text-center space-y-2">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 ring-4 ring-slate-800">
            <Trophy className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-400 text-amber-400 flex items-center justify-center text-xs font-black shadow">
            ★
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-display">RetroTrack</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Android companion app for RetroAchievements. Log in with your official account to get started.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span className="text-xs font-bold text-slate-200">Account Sign In</span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Vault</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Username</span>
              </span>
              <span className="text-[10px] text-slate-500">Case-sensitive</span>
            </label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your RetroAchievements username"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </span>
              <a
                href="https://retroachievements.org/resetPassword.php"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <span>Forgot password?</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your account password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/80 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/25 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating with RetroAchievements...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to RetroAchievements</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          <span>Don't have an account yet? </span>
          <a
            href="https://retroachievements.org/createaccount.php"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <span>Register on RA</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Security Info Footer */}
      <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Direct Authentication:</strong> Log in using your official credentials from retroachievements.org. The Web API key is encrypted on the server vault using AES-256-GCM.
        </p>
      </div>
    </div>
  );
};
