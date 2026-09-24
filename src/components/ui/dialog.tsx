import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Icon } from '../Icon';
// Native modal dialog provides focus trapping, Escape and background inertness without JS polyfills.
export function Dialog({ open, onClose, title, description, children, className = '', sheet = false }: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    sheet?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => { const el = ref.current; if (!el)
        return; if (open && !el.open) {
        el.showModal();
    }
    else if (!open && el.open)
        el.close(); }, [open]);
    useEffect(() => { if (!open)
        return; const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, [open]);
    return <dialog ref={ref} className={cn('dialog', sheet && 'dialog-sheet', className)} aria-label={title} onCancel={event => { event.preventDefault(); closeRef.current(); }} onClick={e => { if (e.target === e.currentTarget) {
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
            onClose();
    } }}>
  {open && <><div className="dialog-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><Button size="icon" variant="ghost" aria-label="关闭" onClick={onClose}><Icon name="close"/></Button></div><div className="dialog-body">{children}</div></>}
 </dialog>;
}
