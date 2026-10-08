import { Children, cloneElement, isValidElement, useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Plus, X } from 'lucide-react';
import { labels } from '../types';
import { errorMessage } from '../lib/api';
export function Geometry({ className = '' }: { className?: string }) {
  return <div className={'geometry ' + className} aria-hidden="true"><i /><i /><i /></div>;
}
export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">Your workspace</span><h1>{title}<span className="heading-slash" aria-hidden="true"> /</span></h1><p>{description}</p></div><div className="heading-actions"><Geometry />{children}</div></div>;
}
export function CreateButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button className="button primary" onClick={onClick} disabled={disabled}><Plus size={18} />{children}</button>;
}
export function Badge({ value }: { value: keyof typeof labels }) {
  return <span className={'badge badge-' + value.toLowerCase()}><i aria-hidden="true" />{labels[value]}</span>;
}
export function Loading({ label = 'Loading…', cards = 4 }: { label?: string; cards?: number }) {
  return <div role="status" aria-label={label} className="loading"><span className="sr-only">{label}</span><div className="skeleton-grid">{Array.from({ length: cards }, (_, i) => <div className="skeleton-card" key={i}><div /><div /><div /></div>)}</div></div>;
}
export function InlineError({ error }: { error: unknown }) {
  return <div className="inline-error" role="alert"><AlertCircle size={18} /><span>{errorMessage(error)}</span></div>;
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state-card" role="alert"><AlertCircle size={36} /><h2>Something went wrong</h2><p>{message}</p>{retry && <button className="button" onClick={retry}>Try again</button>}</div>;
}
export function EmptyState({ title, description, action, actionLabel }: { title: string; description: string; action?: () => void; actionLabel?: string }) {
  return <div className="state-card empty"><Geometry /><h2>{title}</h2><p>{description}</p>{action && <button className="button primary" onClick={action}>{actionLabel}<ArrowRight size={16} /></button>}</div>;
}
export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select')?.focus();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={event => {
    event.preventDefault(); if (!busy) closeRef.current();
  }}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={20} /></button></div>{children}</dialog>;
}
function labelControl(children: ReactNode, id: string, hintId?: string): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<{ id?: string; children?: ReactNode; 'aria-describedby'?: string }>(child)) return child;
    if (typeof child.type === 'string' && ['input', 'textarea', 'select'].includes(child.type)) {
      return cloneElement(child, { id, 'aria-describedby': hintId });
    }
    return child.props.children ? cloneElement(child, { children: labelControl(child.props.children, id, hintId) }) : child;
  });
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{labelControl(children, id, hint ? id + '-hint' : undefined)}{hint && <small id={id + '-hint'}>{hint}</small>}</div>;
}
export function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const percent = total ? Math.round(completed / total * 100) : 0;
  return <div className="progress-ring" aria-label={completed + ' of ' + total + ' tasks completed'}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="40" /><circle className="ring-fill" cx="50" cy="50" r="40" strokeDasharray="251.33" strokeDashoffset={251.33 * (1 - percent / 100)} /></svg>
    <div><strong>{percent}%</strong><small>Tasks complete</small></div>
  </div>;
}
