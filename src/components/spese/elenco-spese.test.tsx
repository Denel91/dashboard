import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { raggruppaPerGiorno, type SpesaInElenco } from '@/lib/spese/elenco';
import { ElencoSpese } from './elenco-spese';

afterEach(cleanup);

const IO = { id: 'm1', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: 'm2', nome: 'Simona', persona: 'b' as const, sonoIo: false };
const CATEGORIE = new Map([['c1', { nome: 'Spesa', icona: 'shopping-cart', colore: '#299f47' }]]);
const base = { divisione: 'a_meta' as const, terza_persona: null, valuta: 'EUR', importo_originale: null };

const spese: SpesaInElenco[] = [
  { ...base, id: 's1', importo_centesimi: 4730, descrizione: 'Esselunga', data_spesa: '2026-11-10', pagata_da: 'm1', categoria_id: 'c1' },
  { ...base, id: 's2', importo_centesimi: 3800, descrizione: null, data_spesa: '2026-11-09', pagata_da: 'm2', categoria_id: 'c1', divisione: 'per_altra_persona' },
  { ...base, id: 's3', importo_centesimi: 1200, descrizione: null, data_spesa: '2026-11-09', pagata_da: 'm1', categoria_id: null },
];

describe('ElencoSpese (tavola 05)', () => {
  it('raggruppa per giorno con il totale, e mostra descrizione, categoria e chi ha pagato', () => {
    render(<ElencoSpese giorni={raggruppaPerGiorno(spese)} categorie={CATEGORIE} membri={[IO, SIMONA]} oggi="2026-11-10" />);
    const [oggi, ieri] = [...document.querySelectorAll('section')];
    expect(within(oggi as HTMLElement).getByRole('heading').textContent).toBe('oggi · martedì 10 novembre');
    expect(within(oggi as HTMLElement).getByText('Esselunga')).toBeDefined();
    expect(within(oggi as HTMLElement).getByText('pagata da te')).toBeDefined();
    expect((ieri as HTMLElement).textContent).toContain('ieri · lunedì 9 novembre');
    expect((ieri as HTMLElement).textContent).toMatch(/50,00/);
    expect(within(ieri as HTMLElement).getByText('per l’altra persona')).toBeDefined();
    expect(within(ieri as HTMLElement).getByText('pagata da Simona')).toBeDefined();
    expect(within(ieri as HTMLElement).getByText('Senza categoria')).toBeDefined();
  });
});
