import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EliminaSpesa } from './elimina-spesa';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(cleanup);

describe('EliminaSpesa (F5)', () => {
  it('chiede conferma prima di spostare nel Cestino', async () => {
    const elimina = vi.fn(async () => ({ avviso: 'Spesa spostata nel Cestino' }));
    render(<EliminaSpesa elimina={elimina} dopo="/spese?mese=2026-11" />);

    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const finestra = await screen.findByRole('dialog', { name: 'Spostare nel Cestino?' });
    expect(finestra.textContent).toContain('Potrai recuperarla per 30 giorni.');
    expect(elimina).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sposta nel Cestino' }));
    await vi.waitFor(() => expect(elimina).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/spese?mese=2026-11'));
  });

  it('Annulla chiude senza eliminare', async () => {
    const elimina = vi.fn(async () => ({}));
    render(<EliminaSpesa elimina={elimina} dopo="/spese" />);
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Annulla' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(elimina).not.toHaveBeenCalled();
  });
});
