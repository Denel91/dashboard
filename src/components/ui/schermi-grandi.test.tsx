import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const percorso = vi.hoisted(() => ({ attuale: '/' }));
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  usePathname: () => percorso.attuale,
  useRouter: () => ({ push, prefetch: vi.fn() }),
}));

import { BarraLaterale } from './barra-laterale';
import { Foglio } from './foglio';
import { ScorciatoiaNuovaSpesa, deveAprireNuovaSpesa } from './scorciatoia-nuova-spesa';

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe('BarraLaterale', () => {
  beforeEach(() => {
    percorso.attuale = '/';
  });

  it('ha Nuova spesa, le voci principali, Altro (md) e le pagine di Altro (lg)', () => {
    render(<BarraLaterale contatori={{ '/altro/cestino': '1' }} />);
    const nav = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(nav).getByRole('link', { name: /Nuova spesa/ }).getAttribute('href')).toBe('/spese/nuova');
    for (const voce of ['Home', 'Spese', 'Saldo', 'Altro', 'Cronologia', 'Da riavere', 'Categorie e budget']) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${voce}`) })).toBeTruthy();
    }
    const altro = within(nav).getByRole('list', { name: 'ALTRO' });
    expect(within(altro).getByRole('link', { name: /Cestino/ }).textContent).toContain('1');
  });

  it('segna la voce attiva anche nelle pagine interne', () => {
    percorso.attuale = '/altro/cestino';
    render(<BarraLaterale />);
    expect(screen.getByRole('link', { name: /^Cestino/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /^Altro/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /^Home/ }).getAttribute('aria-current')).toBeNull();
  });
});

describe('Scorciatoia N', () => {
  function tasto(opzioni: KeyboardEventInit, bersaglio: EventTarget = document.body) {
    const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...opzioni });
    bersaglio.dispatchEvent(e);
    return e;
  }

  it('N apre Nuova spesa, e dopo si torna alla pagina di partenza', () => {
    percorso.attuale = '/';
    const { unmount } = render(<ScorciatoiaNuovaSpesa />);
    tasto({ key: 'n' });
    expect(push).toHaveBeenLastCalledWith('/spese/nuova');
    unmount();
    percorso.attuale = '/spese';
    render(<ScorciatoiaNuovaSpesa />);
    tasto({ key: 'n' });
    expect(push).toHaveBeenLastCalledWith('/spese/nuova?da=%2Fspese');
  });

  it('non scatta in un campo di testo, con Cmd o Ctrl, né con una finestra aperta', () => {
    render(
      <>
        <ScorciatoiaNuovaSpesa />
        <input aria-label="Descrizione" />
      </>,
    );
    tasto({ key: 'n' }, screen.getByRole('textbox', { name: 'Descrizione' }));
    tasto({ key: 'n', metaKey: true });
    tasto({ key: 'n', ctrlKey: true });
    expect(push).not.toHaveBeenCalled();

    const finestra = document.createElement('div');
    finestra.setAttribute('role', 'dialog');
    document.body.append(finestra);
    expect(deveAprireNuovaSpesa(new KeyboardEvent('keydown', { key: 'n' }))).toBe(false);
    finestra.remove();
  });
});

describe('Foglio da 768 px', () => {
  it('usa la larghezza della finestra al centro: 480 px per i fogli, 560 px per i moduli', async () => {
    const { rerender } = render(
      <Foglio titolo="Segna come saldato" isOpen onOpenChange={() => {}}>
        <p>contenuto</p>
      </Foglio>,
    );
    const finestra = await screen.findByRole('dialog', { name: 'Segna come saldato' });
    expect(finestra.closest('.md\\:w-\\[480px\\]')).toBeTruthy();
    rerender(
      <Foglio titolo="Nuova spesa" isOpen onOpenChange={() => {}} larghezza="modulo">
        <p>contenuto</p>
      </Foglio>,
    );
    const modulo = await screen.findByRole('dialog', { name: 'Nuova spesa' });
    expect(modulo.closest('.md\\:w-\\[560px\\]')).toBeTruthy();
  });
});
