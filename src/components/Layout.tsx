import React from 'react';
import Header from './Header';
import Footer from './Footer';
import CookieConsentBanner from './CookieConsentBanner';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}

export default Layout;