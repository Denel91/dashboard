import { describe, expect, it } from 'vitest';
import { richiestaAutorizzata } from './ping';

const SEGRETO = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

describe('richiestaAutorizzata (T-20)', () => {
  it('accetta il segreto giusto', () => {
    expect(richiestaAutorizzata(`Bearer ${SEGRETO}`, SEGRETO)).toBe(true);
  });

  it('rifiuta un segreto sbagliato o senza "Bearer"', () => {
    expect(richiestaAutorizzata(`Bearer ${SEGRETO}x`, SEGRETO)).toBe(false);
    expect(richiestaAutorizzata('Bearer sbagliato-sbagliato-123', SEGRETO)).toBe(false);
    expect(richiestaAutorizzata(SEGRETO, SEGRETO)).toBe(false);
  });

  it('rifiuta se manca l’intestazione', () => {
    expect(richiestaAutorizzata(null, SEGRETO)).toBe(false);
  });

  it('rifiuta tutti se il segreto non è configurato o è troppo corto', () => {
    expect(richiestaAutorizzata('Bearer undefined', undefined)).toBe(false);
    expect(richiestaAutorizzata('Bearer ', '')).toBe(false);
    expect(richiestaAutorizzata('Bearer corto', 'corto')).toBe(false);
  });
});
