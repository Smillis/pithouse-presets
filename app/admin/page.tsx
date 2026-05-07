'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin/upload');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
      >
        <div className="mb-6">
          <div className="font-bold text-xl mb-1" style={{ color: 'var(--accent)' }}>
            ⬡ PitHouse
          </div>
          <h1 className="text-lg font-semibold">Admin Access</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Enter your admin password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            style={{
              background: 'var(--muted-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--foreground)',
              borderRadius: '0.5rem',
              padding: '0.625rem 0.75rem',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          {error && (
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
            style={{
              background: loading ? 'var(--muted-bg)' : 'var(--accent)',
              color: loading ? 'var(--muted)' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
