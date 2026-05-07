'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show the nav on the login page itself
  if (pathname === '/admin') return <>{children}</>;

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className="text-sm px-3 py-1.5 rounded-lg transition-colors"
      style={{
        color: pathname === href ? '#fff' : 'var(--muted)',
        background: pathname === href ? 'var(--accent)' : 'transparent',
      }}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin header */}
      <header
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-base" style={{ color: 'var(--accent)' }}>
              ⬡ PitHouse
            </Link>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--muted-bg)', color: 'var(--muted)' }}>
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navLink('/admin/upload', 'Upload')}
            {navLink('/admin/presets', 'Manage Presets')}
          </nav>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: 'var(--muted)',
              background: 'var(--muted-bg)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
