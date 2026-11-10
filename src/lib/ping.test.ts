import { describe, expect, it, vi } from 'vitest';
import { richiestaAutorizzata, rispondiAlPing } from './ping';

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

describe('rispondiAlPing (T-20, T-30)', () => {
  const SEGRETO_CRON = 'un-segreto-abbastanza-lungo';
  const richiesta = (auth?: string) => new Request('https://x/api/ping', { headers: auth ? { authorization: auth } : {} });

  it('senza il segreto del cron risponde 401, prima di toccare il database', async () => {
    vi.stubEnv('CRON_SECRET', SEGRETO_CRON);
    const r = await rispondiAlPing(richiesta(), { nome: 'staging', url: 'https://x.supabase.co', chiave: 'k' });
    expect(r.status).toBe(401);
    vi.unstubAllEnvs();
  });

  it('se mancano URL o chiave del progetto risponde 503 e lo scrive nei log', async () => {
    vi.stubEnv('CRON_SECRET', SEGRETO_CRON);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await rispondiAlPing(richiesta(`Bearer ${SEGRETO_CRON}`), { nome: 'staging', url: undefined, chiave: 'k' });
    expect(r.status).toBe(503);
    expect(log).toHaveBeenCalledWith('[ping] mancano URL o chiave del progetto staging');
    log.mockRestore();
    vi.unstubAllEnvs();
  });
});
