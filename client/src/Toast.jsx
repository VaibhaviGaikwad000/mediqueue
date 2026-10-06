import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, kind = 'success') => {
    const id = Date.now() + Math.random();
    setItems(current => [...current, { id, message, kind }]);
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 3600);
  }, []);
  return <ToastContext.Provider value={toast}>
    {children}
    <div className="toast-stack" aria-live="polite">{items.map(item =>
      <div className={`toast toast-${item.kind}`} key={item.id}>{item.message}</div>
    )}</div>
  </ToastContext.Provider>;
}
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used within ToastProvider');
  return toast;
}
