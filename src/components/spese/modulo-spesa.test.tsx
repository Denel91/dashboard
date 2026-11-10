import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModuloSpesa } from './modulo-spesa';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn(), prefetch: vi.fn() }) }));

afterEach(cleanup);

const IO = { id: '11111111-1111-4111-8111-111111111111', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: '22222222-2222-4222-8222-222222222222', nome: 'Simona', persona: 'b' as const, sonoIo: false };
const CATEGORIE = [{ id: 'c1', nome: 'Spesa', icona: 'shopping-cart' }];

function monta(membri = [IO, SIMONA]) {
  const azione = vi.fn(async () => ({}));
  render(
    <ModuloSpesa azione={azione} titolo="Nuova spesa" membri={membri} io={IO} categorie={CATEGORIE} oggi="2026-11-10" dopo="/" />,
  );
  return azione;
}

describe('ModuloSpesa (tavola 06)', () => {
  it('parte da oggi, pagata da me, a metà, con il titolo al centro e ✕', () => {
    monta();
    expect(screen.getByRole('heading', { name: 'Nuova spesa' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Chiudi' }).getAttribute('href')).toBe('/');
    expect((screen.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-11-10');
    expect(screen.getByRole('radio', { name: /Io/ })).toHaveProperty('checked', true);
    expect(screen.getByRole('switch', { name: /Per l’altra persona/ })).toHaveProperty('checked', false);
  });

  it('l’anteprima segue importo, chi ha pagato e "per l’altra persona"', () => {
    monta();
    const importo = screen.getByRole('textbox', { name: 'Importo' });
    fireEvent.change(importo, { target: { value: '47,30' } });
    expect(screen.getByText(/Simona ti dovrà 23,65/)).toBeDefined();
    fireEvent.click(screen.getByRole('radio', { name: /Simona/ }));
    expect(screen.getByText(/Dovrai a Simona 23,65/)).toBeDefined();
    fireEvent.click(screen.getByRole('switch', { name: /Per l’altra persona/ }));
    expect(screen.getByText(/Dovrai a Simona 47,30/)).toBeDefined();
    expect(screen.getByText('Tutto a carico tuo')).toBeDefined();
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
    expect((screen.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-11-09');
    expect(screen.getByRole('radio', { name: 'Spesa' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('button', { name: /Altro/ }).getAttribute('aria-expanded')).toBe('true');
    expect((screen.getByRole('textbox', { name: 'Descrizione' }) as HTMLInputElement).value).toBe('Pizzeria');
    expect(screen.getByRole('radio', { name: 'Contanti' })).toHaveProperty('checked', true);
    expect(screen.getByText('Creata da Simona il 09/11/2026')).toBeDefined();
    expect(screen.getByText(/Dovrai a Simona 38,00/)).toBeDefined();
    expect((document.querySelector('input[name=data_modifica]') as HTMLInputElement).value).toBe('2026-11-09T10:00:00+00:00');
  });

  it('F3: se la spesa è cambiata nel frattempo, chiede di ricaricare', async () => {
    render(
      <ModuloSpesa
        azione={vi.fn(async () => ({ conflitto: true }))}
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
    expect(await screen.findByText('La spesa è stata modificata, ricarica.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ricarica' })).toBeDefined();
  });
});
