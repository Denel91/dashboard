import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Activity } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModuloSpesa } from './modulo-spesa';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn(), prefetch: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(cleanup);

const IO = { id: '11111111-1111-4111-8111-111111111111', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: '22222222-2222-4222-8222-222222222222', nome: 'Simona', persona: 'b' as const, sonoIo: false };
const CATEGORIE = [{ id: 'c1', nome: 'Spesa', icona: 'shopping-cart' }];

function monta(membri = [IO, SIMONA]) {
  const azione = vi.fn(async () => ({}));
  render(
    <ModuloSpesa aspetto="finestra" azione={azione} titolo="Nuova spesa" membri={membri} io={IO} categorie={CATEGORIE} oggi="2026-11-10" dopo="/" />,
  );
  return azione;
}

describe('ModuloSpesa (tavola 06)', () => {
  it('la data accanto ad "Altro" (telefono) e quella accanto a Chi ha pagato (C3) restano uguali', () => {
    monta();
    const [computer, telefono] = screen.getAllByLabelText(/^Data/) as HTMLInputElement[];
    fireEvent.change(computer, { target: { value: '2026-11-08' } });
    expect(telefono.value).toBe('2026-11-08');
    fireEvent.change(telefono, { target: { value: '2026-11-07' } });
    expect(computer.value).toBe('2026-11-07');
  });

  it('parte da oggi, pagata da me, a metà, con il titolo al centro e ✕', () => {
    monta();
    expect(screen.getByRole('heading', { name: 'Nuova spesa' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Chiudi' }).getAttribute('href')).toBe('/');
    expect((screen.getAllByLabelText(/^Data/)[0] as HTMLInputElement).value).toBe('2026-11-10');
    expect(screen.getByRole('radio', { name: /Tu ·\s*Simona/ })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Io/ })).toHaveProperty('checked', true);
    expect(screen.getByRole('switch', { name: /Per l’altra persona/ })).toHaveProperty('checked', false);
  });

  it('l’anteprima segue importo, chi ha pagato e "per l’altra persona"', () => {
    monta();
    const importo = screen.getByRole('textbox', { name: 'Importo' });
    fireEvent.change(importo, { target: { value: '47,30' } });
    const testo = () => document.body.textContent?.replace(/\u00a0/g, ' ');
    expect(testo()).toContain('Simona ti dovrà 23,65 €');
    expect(testo()).toContain('Tutto l’importo è a carico di Simona');
    fireEvent.click(screen.getByRole('radio', { name: /Simona/ }));
    expect(testo()).toContain('Dovrai a Simona 23,65 €');
    fireEvent.click(screen.getByRole('switch', { name: /Per l’altra persona/ }));
    expect(testo()).toContain('Dovrai a Simona 47,30 €');
    expect(testo()).toContain('Tutto l’importo è a carico di Daniele');
  });

  it('da soli nel nucleo: niente "Chi ha pagato", interruttore e anteprima', () => {
    monta([IO]);
    expect(screen.queryByRole('radiogroup', { name: 'Chi ha pagato' })).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Importo' }), { target: { value: '10' } });
    expect(screen.queryByText(/dovrà/)).toBeNull();
  });
});

describe('ModuloSpesa, invio', () => {
  it('manda i campi alla Server Action e non svuota il modulo', async () => {
    const azione = monta();
    fireEvent.change(screen.getByRole('textbox', { name: 'Importo' }), { target: { value: '47,30' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Spesa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    await vi.waitFor(() => expect(azione).toHaveBeenCalledTimes(1));
    const dati = Object.fromEntries((azione.mock.calls[0] as unknown as [unknown, FormData])[1]);
    expect(dati).toMatchObject({
      importo: '47,30',
      pagata_da: IO.id,
      categoria_id: 'c1',
      data_spesa: '2026-11-10',
      metodo_pagamento: 'carta',
    });
    expect(dati.per_altra_persona).toBeUndefined();
    expect((screen.getByRole('textbox', { name: 'Importo' }) as HTMLInputElement).value).toBe('47,30');
  });
});

describe('ModuloSpesa in Modifica spesa (tavola 07)', () => {
  const INIZIALE = {
    importoCentesimi: 3800,
    pagataDa: SIMONA.id,
    perAltraPersona: true,
    categoriaId: 'c1',
    dataSpesa: '2026-11-09',
    descrizione: 'Pizzeria',
    metodoPagamento: 'contanti' as const,
    note: null,
  };

  it('riparte dai valori salvati, con "Altro" aperto se è compilato', () => {
    render(
      <ModuloSpesa
        aspetto="finestra"
        azione={vi.fn(async () => ({}))}
        titolo="Modifica spesa"
        membri={[IO, SIMONA]}
        io={IO}
        categorie={CATEGORIE}
        oggi="2026-11-10"
        dopo="/spese"
        iniziale={INIZIALE}
        nascosti={{ id: 'abc', data_modifica: '2026-11-09T10:00:00+00:00' }}
        dettagli="Creata da Simona il 09/11/2026"
      />,
    );
    expect((screen.getByRole('textbox', { name: 'Importo' }) as HTMLInputElement).value).toBe('38,00');
    expect(screen.getByRole('radio', { name: /Simona/ })).toHaveProperty('checked', true);
    expect(screen.getByRole('switch', { name: /Per l’altra persona/ })).toHaveProperty('checked', true);
    expect((screen.getAllByLabelText(/^Data/)[0] as HTMLInputElement).value).toBe('2026-11-09');
    expect(screen.getByText('Ieri · 09/11/2026')).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Spesa' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('button', { name: /Altro/ }).getAttribute('aria-expanded')).toBe('true');
    expect((screen.getByRole('textbox', { name: 'Descrizione' }) as HTMLInputElement).value).toBe('Pizzeria');
    expect(screen.getByRole('radio', { name: 'Contanti' })).toHaveProperty('checked', true);
    expect(screen.getByText('Creata da Simona il 09/11/2026')).toBeDefined();
    expect(document.body.textContent?.replace(/\u00a0/g, ' ')).toContain('Dovrai a Simona 38,00 €');
    expect((document.querySelector('input[name=data_modifica]') as HTMLInputElement).value).toBe('2026-11-09T10:00:00+00:00');
  });

  it('F3: se Simona ha cambiato la spesa nel frattempo, un foglio chiede di ricaricare (tavola 17)', async () => {
    render(
      <ModuloSpesa
        aspetto="finestra"
        azione={vi.fn(async () => ({ conflitto: { autore: SIMONA.id, importoCentesimi: 4100, eliminata: false } }))}
        titolo="Modifica spesa"
        membri={[IO, SIMONA]}
        io={IO}
        categorie={CATEGORIE}
        oggi="2026-11-10"
        dopo="/spese"
        iniziale={INIZIALE}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    const foglio = await screen.findByRole('dialog', { name: 'La spesa è stata modificata, ricarica' });
    expect(foglio.textContent?.replace(/\u00a0/g, ' ')).toContain(
      'Simona ha cambiato questa spesa mentre la stavi modificando (importo 38,00 € → 41,00 €). Ricarica per vedere la versione aggiornata',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ricarica' }));
    await vi.waitFor(() => expect(router.refresh).toHaveBeenCalled());
  });

  it('F3: Annulla chiude il foglio e lascia le modifiche', async () => {
    render(
      <ModuloSpesa
        aspetto="finestra"
        azione={vi.fn(async () => ({ conflitto: { autore: null, importoCentesimi: null, eliminata: true } }))}
        titolo="Modifica spesa"
        membri={[IO, SIMONA]}
        io={IO}
        categorie={CATEGORIE}
        oggi="2026-11-10"
        dopo="/spese"
        iniziale={INIZIALE}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    await screen.findByRole('dialog', { name: 'La spesa è nel Cestino' });
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((screen.getByRole('textbox', { name: 'Importo' }) as HTMLInputElement).value).toBe('38,00');
  });
});

describe('ModuloSpesa, pagina tenuta da Next.js con Activity (cacheComponents)', () => {
  const salvata = { salvata: { avviso: { testo: 'Spesa salvata' } } };
  const props = { aspetto: 'finestra' as const, titolo: 'Nuova spesa', membri: [IO, SIMONA], io: IO, categorie: CATEGORIE, oggi: '2026-11-10', dopo: '/' };

  it('dopo un salvataggio, tornando su Nuova spesa il modulo è vuoto e non rifà avviso e ritorno', async () => {
    router.replace.mockClear();
    const azione = vi.fn(async () => salvata as never);
    const { rerender } = render(
      <Activity mode="visible">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Importo' }), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));

    // Next.js nasconde la pagina, poi la rimostra alla visita dopo
    rerender(
      <Activity mode="hidden">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    await act(async () => {});
    rerender(
      <Activity mode="visible">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    await act(async () => {});

    expect((screen.getByRole('textbox', { name: 'Importo' }) as HTMLInputElement).value).toBe('');
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('anche una bozza lasciata con Annulla o ✕ riparte vuota', async () => {
    const azione = vi.fn(async () => ({}));
    const { rerender } = render(
      <Activity mode="visible">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Importo' }), { target: { value: '12,50' } });
    rerender(
      <Activity mode="hidden">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    await act(async () => {});
    rerender(
      <Activity mode="visible">
        <ModuloSpesa {...props} azione={azione} />
      </Activity>,
    );
    await act(async () => {});
    expect((screen.getByRole('textbox', { name: 'Importo' }) as HTMLInputElement).value).toBe('');
  });
});
