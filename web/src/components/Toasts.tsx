import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, X } from './icons';
const ToastContext = createContext<(message: string) => void>(() => undefined);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 5000); return () => clearTimeout(timer); }, [message]);
  return <ToastContext.Provider value={setMessage}>{children}<div className="toast-region" role="status" aria-live="polite">{message && <div className="toast"><CheckCircle2 size={19} /><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={16} /></button></div>}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
