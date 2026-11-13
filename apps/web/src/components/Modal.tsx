import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Copy, KeyRound, X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing via Esc/backdrop (e.g. while saving). */
  busy?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, onClose, children, footer, size = 'md', busy = false }: ModalProps) {
  const isSuper = typeof document !== 'undefined' && document.querySelector('.app--super') !== null;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const [present, setPresent] = useState(open);
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    if (!isSuper || prefersReducedMotion) {
      setPresent(false);
      return;
    }
    if (!present) return;
    const timeout = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timeout);
  }, [open, isSuper, prefersReducedMotion, present]);

  const rendered = open || (isSuper && !prefersReducedMotion && present);
  const closing = isSuper && !prefersReducedMotion && !open && present;

  useEffect(() => {
    if (!rendered) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>('.modal__body ' + FOCUSABLE.split(', ').join(', .modal__body '));
    (first ?? node?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openRef.current && !busyRef.current) {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && node) {
        const els = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!els.length) return;
        const firstEl = els[0];
        const lastEl = els[els.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [rendered]);

  if (!rendered) return null;
  return createPortal(
    <div className={`modal-backdrop${isSuper ? ' modal-backdrop--super' : ''}${closing ? ' is-closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && open && !busy && onClose()}>
      <div ref={ref} className={`modal modal--${size}${isSuper ? ' modal--super' : ''}${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose} disabled={busy}>
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} disabled={busy} data-autofocus>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-msg">{message}</div>
    </Modal>
  );
}

/** Shows a one-time secret (temporary password / PIN) returned by the API. */
export function SecretDialog({ secret, label, subject, onClose }: { secret: string | null | undefined; label: string; subject?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [secret]);
  // keep acronyms such as "PIN" upper-case
  const noun = label === label.toUpperCase() ? label : label.toLowerCase();
  return (
    <Modal
      open={Boolean(secret)}
      title={`One-time ${noun}`}
      onClose={onClose}
      size="sm"
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          I have recorded it
        </button>
      }
    >
      <p>
        Share this {noun} securely{subject ? <> with <strong>{subject}</strong></> : null}. It is shown <strong>only once</strong> and cannot be
        retrieved later.
      </p>
      <div className="secret">
        <KeyRound size={18} aria-hidden />
        <code aria-label={label} data-testid="one-time-secret">
          {secret}
        </code>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => {
            void navigator.clipboard?.writeText(secret ?? '').then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          <Copy size={14} aria-hidden /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </Modal>
  );
}
