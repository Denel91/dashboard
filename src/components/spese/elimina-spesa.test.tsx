import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EliminaSpesa } from './elimina-spesa';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(cleanup);

describe('EliminaSpesa (F5)', () => {
  it('chiede conferma prima di spostare nel Cestino', async () => {
    const elimina = vi.fn(async () => ({ avviso: 'Spesa spostata nel Cestino' }));
    render(<EliminaSpesa elimina={elimina} dopo="/spese?mese=2026-11" riassunto="Pizzeria Da Gino · 38,00 €" />);

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const finestra = await screen.findByRole('dialog', { name: 'Spostare nel Cestino?' });
    expect(finestra.textContent).toContain('Pizzeria Da Gino · 38,00 €. Potrai recuperarla dal Cestino per 30 giorni. Nel frattempo non conta nel saldo.');
    expect(elimina).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sposta nel Cestino' }));
    await vi.waitFor(() => expect(elimina).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/spese?mese=2026-11'));
  });

  it('Annulla chiude senza eliminare', async () => {
    const elimina = vi.fn(async () => ({}));
    render(<EliminaSpesa elimina={elimina} dopo="/spese" riassunto="Esselunga · 47,30 €" />);
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Annulla' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(elimina).not.toHaveBeenCalled();
  });
});
