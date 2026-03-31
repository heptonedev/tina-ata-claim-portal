"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  open: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", open, onClose, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onClose();
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!visible) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-error" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-tertiary" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
      </svg>
    ),
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-primary/20",
    error: "border-error/20",
    info: "border-tertiary/20",
  };

  return (
    <div className="fixed top-24 right-6 z-[100]">
      <div
        className={`
          flex items-start gap-4 px-6 py-5 rounded-2xl
          bg-surface-container-high/95 backdrop-blur-xl
          border ${borderColors[type]}
          shadow-[0_8px_40px_rgba(0,0,0,0.4)]
          max-w-sm
          transition-all duration-300
          ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-[slideIn_0.3s_ease-out]"}
        `}
      >
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface leading-relaxed">{message}</p>
        </div>
        <button
          onClick={() => {
            setExiting(true);
            setTimeout(() => {
              setVisible(false);
              onClose();
            }, 300);
          }}
          className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
