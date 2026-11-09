import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const percorso = vi.hoisted(() => ({ attuale: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => percorso.attuale }));

import { BarraInBasso, voceAttiva } from './barra-in-basso';

afterEach(cleanup);

describe('voceAttiva', () => {
  it('la Home è attiva solo sulla Home', () => {
    expect(voceAttiva('/', '/')).toBe(true);
    expect(voceAttiva('/spese', '/')).toBe(false);
  });

  it('le altre voci restano attive nelle pagine interne', () => {
    expect(voceAttiva('/spese', '/spese')).toBe(true);
    expect(voceAttiva('/spese/nuova', '/spese')).toBe(true);
    expect(voceAttiva('/altro/cestino', '/altro')).toBe(true);
    expect(voceAttiva('/speseextra', '/spese')).toBe(false);
  });
});

describe('BarraInBasso', () => {
  it('ha le 4 voci nell’ordine dei wireframe e il ＋ con un’etichetta', () => {
    render(<BarraInBasso />);
    const nav = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const voci = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(voci).toEqual(['Home', 'Spese', 'Saldo', 'Altro']);
    expect(screen.getByRole('link', { name: 'Nuova spesa' }).getAttribute('href')).toBe('/spese/nuova');
  });

  it('segna la voce attiva con aria-current e la pillola opaca', () => {
    percorso.attuale = '/saldo';
    render(<BarraInBasso />);
    const saldo = screen.getByRole('link', { name: 'Saldo' });
    expect(saldo.getAttribute('aria-current')).toBe('page');
    expect(saldo.className).toContain('bg-accento-tenue');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });
});
