import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MMO RPC Smoke Test',
  description: 'Supabase MMO RPC smoke test pages',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <header className="siteHeader">
          <nav className="navBar">
            <Link href="/">index</Link>
            <Link href="/admin">admin</Link>
            <Link href="/login">login</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
