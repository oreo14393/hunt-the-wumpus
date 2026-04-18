import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,4,1,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm mx-4 border border-cave-600/30 rounded-sm overflow-hidden"
        style={{ backgroundColor: '#0a0602', boxShadow: '0 0 60px rgba(180,100,30,0.1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-cave-800/50">
          <h2 className="font-gothic text-xl text-amber-600/80 text-center tracking-wider">
            {mode === 'login' ? 'Return to the Cave' : 'Descend for the First Time'}
          </h2>
          <p className="text-cave-600 text-xs font-mono text-center mt-1">
            {mode === 'login' ? 'Your records await.' : 'Your legend begins.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-cave-500 text-xs font-mono">EXPLORER NAME</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-cave-900/60 border border-cave-700/40 rounded px-3 py-2 text-sm font-mono text-cave-100 focus:outline-none focus:border-amber-700/60"
                placeholder="your_handle"
                required
                minLength={3}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-cave-500 text-xs font-mono">EMAIL</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-cave-900/60 border border-cave-700/40 rounded px-3 py-2 text-sm font-mono text-cave-100 focus:outline-none focus:border-amber-700/60"
              placeholder="explorer@cave.dark"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-cave-500 text-xs font-mono">PASSWORD</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-cave-900/60 border border-cave-700/40 rounded px-3 py-2 text-sm font-mono text-cave-100 focus:outline-none focus:border-amber-700/60"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-mono">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 border border-amber-700/50 text-amber-500 text-sm font-mono rounded hover:bg-amber-950/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Entering…' : mode === 'login' ? 'Enter the Cave' : 'Begin Descent'}
          </motion.button>

          <div className="flex items-center gap-3 text-xs font-mono text-cave-600">
            <div className="flex-1 h-px bg-cave-800/50" />
            <span>or</span>
            <div className="flex-1 h-px bg-cave-800/50" />
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-cave-500 text-xs font-mono hover:text-cave-300 transition-colors"
            >
              {mode === 'login' ? "First time? Create account →" : "Already have account? Sign in →"}
            </button>
            <br />
            <button
              type="button"
              onClick={onClose}
              className="text-cave-700 text-xs font-mono hover:text-cave-500 transition-colors"
            >
              Play as ghost (no records)
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
