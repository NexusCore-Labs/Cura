import React from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { route: 'today', to: '/app', label: 'Today', icon: 'calendar_today' },
  { route: 'scan', to: '/scan', label: 'Scan', icon: 'document_scanner' },
  { route: 'history', to: '/history', label: 'History', icon: 'history' },
  { route: 'settings', to: '/settings', label: 'Settings', icon: 'settings' }
];

export default function BottomNav({ activeRoute = 'today' }) {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-card-border shadow-[0_-1px_12px_rgba(23,29,24,0.04)]"
    >
      <div className="flex justify-around items-center h-20 px-space-xs max-w-[390px] mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <Link
              key={item.route}
              to={item.to}
              aria-current={isActive ? 'page' : 'false'}
              className={`flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] px-3 py-1.5 transition-colors relative ${
                isActive
                  ? 'text-on-surface font-caption-bold'
                  : 'text-muted-text hover:text-on-surface font-caption'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="text-caption leading-none">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container absolute bottom-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
