'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase-browser';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`ログイン失敗: ${error.message}`);
        return;
      }
      setMessage('ログイン成功');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setMessage(`ログアウト失敗: ${error.message}`);
        return;
      }
      setMessage('ログアウト成功');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2>ログイン</h2>
      <p className="description">
        RPC スモークテストはログイン済みユーザー前提です。Playwright でもこの画面を使ってサインインできます。
      </p>

      <form onSubmit={handleLogin} className="formStack">
        <label className="field">
          <span>Email</span>
          <input
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
          />
        </label>

        <div className="actions">
          <button data-testid="login-submit" type="submit" disabled={loading}>
            ログイン
          </button>
          <button data-testid="logout-submit" type="button" disabled={loading} onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </form>

      {message ? (
        <p data-testid="login-message" className="description">
          {message}
        </p>
      ) : null}
    </div>
  );
}
