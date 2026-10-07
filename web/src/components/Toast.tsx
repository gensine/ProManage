import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isError = type === 'error';

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: isError ? 'rgba(244, 63, 94, 0.95)' : 'rgba(16, 185, 129, 0.95)',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
        fontWeight: 600,
        fontSize: '0.9rem',
        backdropFilter: 'blur(10px)'
      }}
    >
      {isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: 0,
          marginLeft: '0.5rem',
          opacity: 0.8
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
