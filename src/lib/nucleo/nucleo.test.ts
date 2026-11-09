import { describe, expect, it } from 'vitest';
import { eBrowserInterno } from '../browser-interno';
import { codiceErroreNucleo, erroreNucleo } from './errori';
import { codiceInvitoValido, linkInvito, linkInvitoAccorciato } from './invito';
import { nomeDaAccountGoogle } from './nome';

const CODICE = '3f9c2a7b1e4d4c0f9a8b7c6d5e4f3a2b';

describe('link d’invito', () => {
  it('accetta solo 32 caratteri esadecimali minuscoli', () => {
    expect(codiceInvitoValido(CODICE)).toBe(true);
    expect(codiceInvitoValido(CODICE.slice(1))).toBe(false);
    expect(codiceInvitoValido(CODICE.toUpperCase())).toBe(false);
    expect(codiceInvitoValido('../../accesso')).toBe(false);
  });

  it('costruisce il link e lo accorcia come nei wireframe', () => {
    const link = linkInvito('https://dashboard-denel.vercel.app', CODICE);
    expect(link).toBe(`https://dashboard-denel.vercel.app/invito/${CODICE}`);
    expect(linkInvitoAccorciato(link)).toBe('dashboard-denel.vercel.app/invito/3f9c2a…');
  });
});

describe('errori del nucleo (tavola 16)', () => {
  it('traduce P0001, P0002 e P0003 con i testi della Progettazione', () => {
    expect(erroreNucleo('P0001', 'Casa nostra').testo).toBe('Casa nostra ha già due persone.');
    expect(erroreNucleo('P0001').testo).toBe('Questo nucleo ha già due persone.');
    expect(erroreNucleo('P0002').titolo).toBe('Invito non valido');
    expect(erroreNucleo('P0003').testo).toContain('Controlla di aver scelto l’account giusto');
  });

  it('riconosce solo i tre codici del nucleo', () => {
    expect(codiceErroreNucleo({ code: 'P0001' })).toBe('P0001');
    expect(codiceErroreNucleo({ code: '23505' })).toBeNull();
    expect(codiceErroreNucleo(null)).toBeNull();
  });
});

describe('browser interni delle app', () => {
  it('riconosce Instagram, Facebook, Messenger e TikTok', () => {
    expect(eBrowserInterno('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Instagram 350.0.0')).toBe(true);
    expect(eBrowserInterno('Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/480.0]')).toBe(true);
    expect(eBrowserInterno('Mozilla/5.0 (iPhone) Messenger/400')).toBe(true);
    expect(eBrowserInterno('Mozilla/5.0 (Linux; Android 14) musical_ly_2023')).toBe(true);
  });

  it('lascia passare Safari, Chrome e il browser che apre WhatsApp', () => {
    expect(
      eBrowserInterno(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
    expect(eBrowserInterno('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36')).toBe(false);
    expect(eBrowserInterno(null)).toBe(false);
  });
});

describe('nome dall’account Google', () => {
  it('prende solo il nome di battesimo, al massimo 40 caratteri', () => {
    expect(nomeDaAccountGoogle({ full_name: 'Daniele Di Salvo' })).toBe('Daniele');
    expect(nomeDaAccountGoogle({ name: '  Simona ' })).toBe('Simona');
    expect(nomeDaAccountGoogle({})).toBe('');
    expect(nomeDaAccountGoogle(undefined)).toBe('');
  });
});
