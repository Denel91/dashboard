import { describe, expect, it } from 'vitest';
import { anteprimaSpesa, avvisoSpesa, testoSaldo } from './testi';

// Gli spazi prima di € sono non separabili (formattaEuro)
const n = (s: string) => s.replace(/ /g, ' ');

describe('testoSaldo', () => {
  it('dice chi deve a chi, sempre con il nome', () => {
    expect(n(testoSaldo(2340, 'Simona'))).toBe('Simona ti deve 23,40 €');
    expect(n(testoSaldo(-2340, 'Simona'))).toBe('Devi a Simona 23,40 €');
    expect(testoSaldo(0, 'Simona')).toBe('Siete in pari');
  });
});

describe('avvisoSpesa (F7, tavola 19b)', () => {
  const persone = { io: { nome: 'Daniele', persona: 'a' as const }, altra: { nome: 'Simona', persona: 'b' as const } };
  const base = { titolo: 'Spesa salvata', descrizione: 'Esselunga', importoCentesimi: 4730, categoria: 'Spesa', persone };

  it('tre righe: titolo, dettaglio e saldo con chi deve', () => {
    const a = avvisoSpesa({ ...base, saldoCentesimi: 4705 });
    expect(a.testo).toBe('Spesa salvata');
    expect(n(a.dettaglio!)).toBe('Esselunga · 47,30 € · Spesa');
    expect({ ...a.saldo, importo: n(a.saldo!.importo!) }).toEqual({ testo: 'Simona ti deve', importo: '47,05 €', nome: 'Simona', persona: 'b' });
    expect(a.conferma).toBe(true);
  });

  it('se devo io, accanto c’è la mia iniziale; in pari, nessun importo', () => {
    expect(avvisoSpesa({ ...base, saldoCentesimi: -100 }).saldo).toMatchObject({ testo: 'Devi a Simona', nome: 'Daniele', persona: 'a' });
    expect(avvisoSpesa({ ...base, saldoCentesimi: 0 }).saldo).toEqual({ testo: 'Siete in pari' });
  });

  it('senza descrizione né categoria resta l’importo; senza saldo niente terza riga', () => {
    const a = avvisoSpesa({ ...base, descrizione: null, categoria: null, saldoCentesimi: null });
    expect(n(a.dettaglio!)).toBe('47,30 €');
    expect(a.saldo).toBeUndefined();
    expect(avvisoSpesa({ ...base, saldoCentesimi: 10, persone: { ...persone, altra: null } }).saldo).toBeUndefined();
  });
});

describe('anteprimaSpesa (tavola 06)', () => {
  it('a metà: il centesimo dispari resta a chi ha pagato (R4)', () => {
    expect(n(anteprimaSpesa(4730, true, 'a_meta', 'Simona')!.testo)).toBe('Simona ti dovrà 23,65 €');
    expect(n(anteprimaSpesa(1001, true, 'a_meta', 'Simona')!.testo)).toBe('Simona ti dovrà 5,00 €');
  });

  it('pagata dall’altra persona: "Dovrai a…", e il debitore sono io', () => {
    const a = anteprimaSpesa(3800, false, 'a_meta', 'Simona')!;
    expect(n(a.testo)).toBe('Dovrai a Simona 19,00 €');
    expect(a.debitore).toBe('io');
  });

  it('"per l’altra persona": l’intero importo (R3)', () => {
    expect(n(anteprimaSpesa(2000, true, 'per_altra_persona', 'Simona')!.testo)).toBe('Simona ti dovrà 20,00 €');
  });

  it('niente anteprima senza un importo valido e positivo', () => {
    expect(anteprimaSpesa(null, true, 'a_meta', 'Simona')).toBeNull();
    expect(anteprimaSpesa(0, true, 'a_meta', 'Simona')).toBeNull();
    expect(anteprimaSpesa(-450, true, 'a_meta', 'Simona')).toBeNull();
  });
});
