import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StatoRimborso } from '@/app/actions/rimborsi';
import { SegnaComeSaldato } from './segna-come-saldato';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));
afterEach(cleanup);

const DANIELE = { id: 'm1', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: 'm2', nome: 'Simona', persona: 'b' as const, sonoIo: false };

async function apri(azione: (p: StatoRimborso, d: FormData) => Promise<StatoRimborso>, saldo = 2340) {
  render(<SegnaComeSaldato azione={azione} saldoCentesimi={saldo} io={DANIELE} altra={SIMONA} />);
  fireEvent.click(screen.getByRole('button', { name: 'Segna come saldato' }));
  return screen.findByRole('dialog');
}

describe('SegnaComeSaldato (tavola 08b, US-31, US-32)', () => {
  it('parte con tutto il saldo e manda il saldo visto, per il controllo del database', async () => {
    const azione = vi.fn(async (_p: StatoRimborso, d: FormData) => {
      expect(d.get('importo')).toBe('23,40');
      expect(d.get('saldo_atteso')).toBe('2340');
      return {};
    });
    await apri(azione);
    expect(screen.getByText('Il saldo tornerà a zero: siete in pari.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Conferma' }));
    await waitFor(() => expect(azione).toHaveBeenCalledOnce());
  });

  it('oltre il saldo Conferma non si può toccare', async () => {
    await apri(vi.fn(async () => ({})));
    fireEvent.change(screen.getByLabelText('Importo'), { target: { value: '30' } });
    expect(screen.getByText(/Al massimo 23,40.€, il saldo attuale/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Conferma' }).hasAttribute('disabled')).toBe(true);
  });

  it('la ✕ svuota l’importo per scriverne uno nuovo (rimborso parziale)', async () => {
    await apri(vi.fn(async () => ({})));
    fireEvent.click(screen.getByRole('button', { name: 'Svuota importo' }));
    expect((screen.getByLabelText('Importo') as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('button', { name: 'Svuota importo' })).toBeNull();
  });

  it('se nel frattempo il saldo è cambiato, mostra quello nuovo e lo rimette nel campo', async () => {
    await apri(vi.fn(async () => ({ saldoCambiato: 1340 })));
    fireEvent.click(screen.getByRole('button', { name: 'Conferma' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('ora è 13,40'));
    expect((screen.getByLabelText('Importo') as HTMLInputElement).value).toBe('13,40');
  });

  it('se l’altra persona ha già pareggiato, lo dice', async () => {
    await apri(vi.fn(async () => ({ saldoCambiato: 0 })));
    fireEvent.click(screen.getByRole('button', { name: 'Conferma' }));
    expect(await screen.findByText('Nel frattempo avete pareggiato: siete in pari.')).toBeDefined();
  });
});
