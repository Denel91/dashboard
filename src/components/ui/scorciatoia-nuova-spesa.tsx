'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hrefNuovaSpesa } from './pulsante-nuova-spesa';

// Scorciatoia da tastiera (D21, linee guida sezione 9.5): N apre Nuova spesa.
// Non scatta mentre si scrive in un campo, con Cmd/Ctrl/Alt premuti, né se è
// già aperta una finestra (lì N è una lettera qualsiasi).

export function deveAprireNuovaSpesa(e: KeyboardEvent) {
  if (e.defaultPrevented || e.repeat) return false;
  if (e.key !== 'n' && e.key !== 'N') return false;
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  const bersaglio = e.target as HTMLElement | null;
  if (bersaglio?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return false;
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return false;
  return true;
}

export function ScorciatoiaNuovaSpesa() {
  const router = useRouter();
  const destinazione = hrefNuovaSpesa(usePathname());

  useEffect(() => {
    router.prefetch(destinazione);
    function premi(e: KeyboardEvent) {
      if (!deveAprireNuovaSpesa(e)) return;
      e.preventDefault();
      router.push(destinazione);
    }
    window.addEventListener('keydown', premi);
    return () => window.removeEventListener('keydown', premi);
  }, [router, destinazione]);

  return null;
}
