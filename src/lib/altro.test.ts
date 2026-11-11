import { describe, expect, it } from 'vitest';
import { PAGINE_ALTRO } from '@/components/ui';
import { PAGINE_ALTRO_IN_ARRIVO, paginaAltro } from './altro';

describe('pagine di Altro (T-31)', () => {
  it('ogni voce della barra laterale porta a una pagina che esiste', () => {
    for (const voce of PAGINE_ALTRO) {
      const slug = voce.href.replace('/altro/', '');
      expect(paginaAltro(slug), voce.href).not.toBeNull();
      expect(paginaAltro(slug)?.titolo).toBe(voce.etichetta);
    }
  });

  it('un indirizzo sconosciuto non è una pagina', () => {
    expect(paginaAltro('impostazioni')).toBeNull();
    expect(paginaAltro('qualcosa')).toBeNull();
  });

  it('ogni pagina dice cosa succede già oggi ai suoi dati', () => {
    for (const p of PAGINE_ALTRO_IN_ARRIVO) expect(p.inAttesa.length).toBeGreaterThan(20);
  });
});
