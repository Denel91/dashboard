import { describe, expect, it } from 'vitest';
import { saluto, dataEstesa } from '@/lib/date';
import {
  fraseDopoAnnullamento,
  notaImportoRimborso,
  rimborsiInElenco,
  saldoDopoAnnullamento,
  sottotitoloRimborso,
  statoSaldo,
  tonoCardSaldo,
} from './saldo';

const DANIELE = { id: 'm1', nome: 'Daniele', persona: 'a' as const, sonoIo: true };
const SIMONA = { id: 'm2', nome: 'Simona', persona: 'b' as const, sonoIo: false };
const NUCLEO = { io: DANIELE, membri: [DANIELE, SIMONA] };

describe('statoSaldo (US-30)', () => {
  it('saldo positivo: l’altra persona mi deve', () => {
    expect(statoSaldo(2340, NUCLEO)).toEqual({ tipo: 'debito', debitore: SIMONA, creditore: DANIELE, importoCentesimi: 2340, ioDevo: false });
  });

  it('saldo negativo: devo io, con l’importo positivo', () => {
    expect(statoSaldo(-2340, NUCLEO)).toEqual({ tipo: 'debito', debitore: DANIELE, creditore: SIMONA, importoCentesimi: 2340, ioDevo: true });
  });

  it('zero: in pari, con le due persone in ordine di ingresso anche se è collegata Simona', () => {
    const s = statoSaldo(0, { io: { ...SIMONA, sonoIo: true }, membri: [DANIELE, { ...SIMONA, sonoIo: true }] });
    expect(s.tipo).toBe('pari');
    expect(s.tipo === 'pari' && s.membri.map((m) => m.nome)).toEqual(['Daniele', 'Simona']);
  });

  it('una persona sola: non c’è ancora un saldo', () => {
    expect(statoSaldo(0, { io: DANIELE, membri: [DANIELE] })).toEqual({ tipo: 'solo' });
  });

  it('rifiuta un saldo che non è in centesimi interi (K6)', () => {
    expect(() => statoSaldo(23.4, NUCLEO)).toThrow();
  });

  it('la card prende il colore di chi deve, neutra in pari (D17)', () => {
    expect(tonoCardSaldo(statoSaldo(2340, NUCLEO))).toBe('persona-b');
    expect(tonoCardSaldo(statoSaldo(-1, NUCLEO))).toBe('persona-a');
    expect(tonoCardSaldo(statoSaldo(0, NUCLEO))).toBe('normale');
  });
});

describe('rimborsi in elenco (tavola 08a)', () => {
  const riga = { id: 'r1', da_membro: 'm2', a_membro: 'm1', importo_centesimi: 4000, data_rimborso: '2026-10-28', nota: 'Bonifico', data_eliminazione: null };

  it('aggiunge i nomi e dice se è annullato', () => {
    const [r, annullato] = rimborsiInElenco(
      [riga, { ...riga, id: 'r2', nota: null, data_eliminazione: '2026-10-16T10:00:00Z' }],
      [{ id: 'm1', nome: 'Daniele' }, { id: 'm2', nome: 'Simona' }],
      NUCLEO,
    );
    expect(r).toMatchObject({ da: SIMONA, a: DANIELE, importoCentesimi: 4000, annullato: false });
    expect(annullato.annullato).toBe(true);
  });

  it('un membro uscito dal nucleo resta con il suo nome', () => {
    const [r] = rimborsiInElenco([{ ...riga, da_membro: 'm0' }], [{ id: 'm0', nome: 'Luca' }, { id: 'm1', nome: 'Daniele' }], NUCLEO);
    expect(r.da).toMatchObject({ nome: 'Luca', persona: 'a', sonoIo: false });
  });

  it('sotto i nomi: data ed eventuale nota', () => {
    expect(sottotitoloRimborso({ data: '2026-10-28', nota: 'Bonifico' })).toBe('28/10/2026 · Bonifico');
    expect(sottotitoloRimborso({ data: '2026-10-15', nota: '  ' })).toBe('15/10/2026');
  });
});

describe('intestazione della Home sul computer (D23)', () => {
  it('saluto secondo l’ora italiana, anche quando il server è in UTC', () => {
    expect(saluto(new Date('2026-11-10T06:30:00Z'))).toBe('Buongiorno'); // 7:30 a Roma
    expect(saluto(new Date('2026-11-10T13:00:00Z'))).toBe('Buon pomeriggio');
    expect(saluto(new Date('2026-11-10T17:30:00Z'))).toBe('Buonasera'); // 18:30
    expect(saluto(new Date('2026-11-10T02:00:00Z'))).toBe('Buonasera'); // 3 di notte
  });

  it('data per esteso con la maiuscola', () => {
    expect(dataEstesa('2026-11-10')).toBe('Martedì 10 novembre');
  });
});

describe('foglio Segna come saldato (tavola 08b)', () => {
  it('la nota sotto l’importo segue quello che si scrive', () => {
    expect(notaImportoRimborso(2340, 2340)).toEqual({ testo: 'Il saldo tornerà a zero: siete in pari.', valido: true });
    expect(notaImportoRimborso(1000, 2340).testo).toBe('Resteranno da saldare 13,40 €.');
    expect(notaImportoRimborso(3000, 2340)).toEqual({ testo: 'Al massimo 23,40 €, il saldo attuale.', valido: false });
    expect(notaImportoRimborso(0, 2340).valido).toBe(false);
    expect(notaImportoRimborso(null, 2340).valido).toBe(false);
  });
});

describe('conferma Annullare il rimborso? (tavola 19e)', () => {
  const r = { da: SIMONA, a: DANIELE, importoCentesimi: 4000 };

  it('il rimborso esce dal saldo come nella vista saldi', () => {
    expect(saldoDopoAnnullamento(2340, r, DANIELE.id)).toBe(6340); // Simona mi deve di nuovo quei 40 €
    expect(saldoDopoAnnullamento(-2340, r, SIMONA.id)).toBe(-6340);
  });

  it('la frase dice il saldo di dopo, anche quando cambia chi deve', () => {
    const prima = statoSaldo(2340, NUCLEO);
    expect(fraseDopoAnnullamento(prima, statoSaldo(6340, NUCLEO))).toBe('Il saldo tornerà a 63,40 €.');
    expect(fraseDopoAnnullamento(prima, statoSaldo(-2870, NUCLEO))).toBe('Dopo, Daniele dovrà 28,70 € a Simona.');
    expect(fraseDopoAnnullamento(prima, statoSaldo(0, NUCLEO))).toBe('Dopo sarete in pari.');
    expect(fraseDopoAnnullamento(statoSaldo(0, NUCLEO), statoSaldo(4000, NUCLEO))).toBe('Dopo, Simona dovrà 40,00 € a Daniele.');
  });
});
