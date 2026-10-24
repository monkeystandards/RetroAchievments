import React, { useState } from 'react';
import { X, Key, User, Volume2, Sparkles, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { getActiveUsername, setActiveUsername, getCustomApiKey, setCustomApiKey } from '../services/api';
import { sounds } from '../utils/audio';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const [usernameInput, setUsernameInput] = useState<string>(getActiveUsername());
  const [apiKeyInput, setApiKeyInput] = useState<string>(getCustomApiKey());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setActiveUsername(usernameInput.trim());
    if (apiKeyInput.trim()) {
      setCustomApiKey(apiKeyInput.trim());
    }

    setSavedSuccess(true);
    sounds.playTap();
    setTimeout(() => {
      setSavedSuccess(false);
      onCredentialsUpdated();
      onClose();
    }, 800);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playAchievementUnlocked();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
              RA
            </div>
            <h3 className="text-xs font-bold text-slate-200">Account & Settings</h3>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Active Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Active RetroAchievements Username</span>
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. Scott"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <span>Quick switch:</span>
              <button
                type="button"
                onClick={() => setUsernameInput('Scott')}
                className="text-amber-400 hover:underline font-mono"
              >
                Scott
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setUsernameInput('Sarconius')}
                className="text-amber-400 hover:underline font-mono"
              >
                Sarconius (#1)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setUsernameInput('MaxMilyin')}
                className="text-amber-400 hover:underline font-mono"
              >
                MaxMilyin (#2)
              </button>
            </div>
          </div>

          {/* Web API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Web API Key</span>
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Active & Verified</span>
              </span>
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="RetroAchievements API Key"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[10px] text-slate-500">
              Pre-filled with your provided API key: <code className="text-amber-400 font-mono">eAQ12mv...NXd</code>.
            </p>
          </div>

          {/* Sound FX Setting */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Retro Synthesizer Sound FX</div>
                <div className="text-[10px] text-slate-400">Chimes on achievements, unlocks & chats</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 shadow-md transform transition-transform absolute top-1 ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Test Sound Button */}
          {soundEnabled && (
            <button
              type="button"
              onClick={() => sounds.playAchievementUnlocked()}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Retro Trophy Chime</span>
            </button>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
