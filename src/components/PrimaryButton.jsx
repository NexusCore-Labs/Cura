import React from 'react';

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  id,
  icon = null,
  className = '',
  active = false
}) {
  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full h-14 rounded-2xl ${
        disabled
          ? 'bg-surface-container text-secondary cursor-not-allowed'
          : active
            ? 'bg-primary-fixed-dim text-on-lime shadow-sm'
            : 'bg-primary-container text-on-lime hover:opacity-95 active:scale-[0.99] shadow-sm'
      } font-body-semibold text-body-semibold flex items-center justify-center gap-space-xs transition-all focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[24px]">{icon}</span>}
      {children}
    </button>
  );
}
