import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { statoSaldo, type RimborsoInElenco } from '@/lib/saldo/saldo';
import { CardSaldo } from './card-saldo';
import { ElencoRimborsi } from './elenco-rimborsi';

afterEach(cleanup);

const DANIELE = { id: 'm1', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: 'm2', nome: 'Simona', persona: 'b' as const, sonoIo: false };
const NUCLEO = { io: DANIELE, membri: [DANIELE, SIMONA] };

describe('CardSaldo (tavole 04, 08a, 15a)', () => {
  it('Simona ti deve 23,40 €, nel suo colore e con il nome che dà il titolo alla card', () => {
    render(<CardSaldo stato={statoSaldo(2340, NUCLEO)} variante="pagina" titoloId="t" />);
    const card = screen.getByRole('region', { name: 'Simona ti deve' });
    expect(card.textContent).toContain('23,40');
    expect(card.className).toContain('bg-persona-b-tenue');
    expect(card.className).toContain('lg:bg-persona-b');
  });

  it('quando devo io: "Devi a Simona", nel mio colore', () => {
    render(<CardSaldo stato={statoSaldo(-1900, NUCLEO)} variante="home" titoloId="t" />);
    const card = screen.getByRole('region', { name: 'Devi a Simona' });
    expect(card.textContent).toContain('19,00');
    expect(card.className).toContain('bg-persona-a-tenue');
  });

  it('in pari: "Daniele e Simona · Siete in pari", card neutra', () => {
    render(<CardSaldo stato={statoSaldo(0, NUCLEO)} variante="home" titoloId="t" />);
    const card = screen.getByRole('region', { name: 'Daniele e Simona' });
    expect(card.textContent).toContain('Siete in pari');
    expect(card.className).toContain('vetro-card');
  });
});

describe('ElencoRimborsi (tavola 08a)', () => {
  const base: RimborsoInElenco = { id: 'r1', da: SIMONA, a: DANIELE, importoCentesimi: 4000, data: '2026-10-28', nota: 'Bonifico', annullato: false };

  it('mostra chi ha dato a chi, data, nota e importo; gli annullati barrati con l’etichetta', () => {
    render(<ElencoRimborsi rimborsi={[base, { ...base, id: 'r2', importoCentesimi: 2000, nota: null, annullato: true }]} />);
    const righe = screen.getAllByRole('listitem');
    expect(righe[0].textContent).toContain('Rimborso: Simona a Daniele');
    expect(righe[0].textContent).toContain('28/10/2026 · Bonifico');
    expect(righe[0].textContent).toContain('40,00');
    expect(righe[1].textContent).toContain('Rimborso annullato');
    expect(righe[1].textContent).toContain('Annullato');
  });

  it('l’azione compare solo sui rimborsi validi', () => {
    render(<ElencoRimborsi rimborsi={[base, { ...base, id: 'r2', annullato: true }]} azione={() => <button>Annulla</button>} />);
    expect(screen.getAllByRole('button', { name: 'Annulla' })).toHaveLength(1);
  });

  it('senza rimborsi lo dice', () => {
    render(<ElencoRimborsi rimborsi={[]} />);
    expect(screen.getByText('Nessun rimborso finora.')).toBeDefined();
  });
});
