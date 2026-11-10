import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CATEGORIE_PREDEFINITE } from '@/lib/categorie';
import { CampoData, oggiIso } from './campo-data';
import { CampoImporto } from './campo-importo';
import { CampoTesto } from './campo';
import { ControlloSegmentato } from './controllo-segmentato';
import { IconaCategoria } from './icona-categoria';
import { Interruttore } from './interruttore';
import { SceltaCategoria } from './scelta-categoria';
import { SezioneEspandibile } from './sezione-espandibile';

afterEach(cleanup);

const CATEGORIE = CATEGORIE_PREDEFINITE.map((c, i) => ({ id: `c${i + 1}`, nome: c.nome, icona: c.icona }));

function datiDel(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form));
}

describe('ControlloSegmentato', () => {
  it('è un gruppo di radio con etichetta, e manda il valore nel modulo', () => {
    const { container } = render(
      <form>
        <ControlloSegmentato
          etichetta="Chi ha pagato"
          name="pagata_da"
          valoreIniziale="m1"
          opzioni={[
            { valore: 'm1', etichetta: 'Io' },
            { valore: 'm2', etichetta: 'Simona' },
          ]}
        />
      </form>,
    );
    const gruppo = screen.getByRole('radiogroup', { name: 'Chi ha pagato' });
    expect(within(gruppo).getByRole('radio', { name: 'Io' })).toHaveProperty('checked', true);
    fireEvent.click(within(gruppo).getByRole('radio', { name: 'Simona' }));
    expect(datiDel(container.querySelector('form')!)).toEqual({ pagata_da: 'm2' });
  });
});

describe('Interruttore', () => {
  it('è uno switch: acceso manda "on", spento non manda niente', () => {
    const { container } = render(
      <form>
        <Interruttore name="per_altra_persona">Per l’altra persona</Interruttore>
      </form>,
    );
    const form = container.querySelector('form')!;
    const sw = screen.getByRole('switch', { name: 'Per l’altra persona' });
    expect(datiDel(form)).toEqual({});
    fireEvent.click(sw);
    expect(datiDel(form)).toEqual({ per_altra_persona: 'on' });
  });
});

describe('SceltaCategoria (D24)', () => {
  it('mostra le prime 8 e "Altre categorie" con quante ne mancano', () => {
    render(<SceltaCategoria categorie={CATEGORIE} />);
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect(screen.getByRole('radio', { name: 'Spesa' })).toBeDefined();
    expect(screen.queryByRole('radio', { name: 'Affitto' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Altre categorie (12)' }));
    expect(screen.getAllByRole('radio')).toHaveLength(20);
    expect(screen.getByRole('button', { name: 'Meno categorie' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('una categoria scelta tra le altre resta visibile anche con l’elenco chiuso', () => {
    render(<SceltaCategoria categorie={CATEGORIE} valoreIniziale="c9" />);
    expect(screen.getAllByRole('radio')).toHaveLength(9);
    expect(screen.getByRole('radio', { name: 'Affitto' }).getAttribute('aria-checked')).toBe('true');
  });

  it('manda l’id nel modulo; toccare di nuovo la scelta la toglie', () => {
    const { container } = render(
      <form>
        <SceltaCategoria categorie={CATEGORIE} name="categoria_id" />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(datiDel(form)).toEqual({ categoria_id: '' });
    fireEvent.click(screen.getByRole('radio', { name: 'Ristoranti e bar' }));
    expect(datiDel(form)).toEqual({ categoria_id: 'c2' });
    fireEvent.click(screen.getByRole('radio', { name: 'Ristoranti e bar' }));
    expect(datiDel(form)).toEqual({ categoria_id: '' });
  });
});

describe('IconaCategoria', () => {
  it('usa il colore della categoria e ripiega su "tag" se il nome non è in elenco', () => {
    const { container } = render(<IconaCategoria icona="sofa" colore="#a2845e" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.backgroundColor).toBe('rgb(162, 132, 94)');
    expect(box.getAttribute('aria-hidden')).toBe('true');
    expect(box.querySelector('svg')?.getAttribute('class')).toContain('lucide-sofa');
    cleanup();
    const { container: c2 } = render(<IconaCategoria icona="razzo" colore="#8b8b91" />);
    expect(c2.querySelector('svg')?.getAttribute('class')).toContain('lucide-tag');
  });
});

describe('CampoImporto', () => {
  it('ha l’etichetta "Importo" e il tastierino decimale', () => {
    render(<CampoImporto name="importo" />);
    const campo = screen.getByRole('textbox', { name: 'Importo' });
    expect(campo.getAttribute('inputmode')).toBe('decimal');
    expect(campo.getAttribute('name')).toBe('importo');
  });
});

describe('CampoData', () => {
  it('scrive la data di oggi nel fuso italiano, anche quando in UTC è ancora ieri', () => {
    expect(oggiIso(new Date('2026-11-09T23:30:00Z'))).toBe('2026-11-10');
    expect(oggiIso(new Date('2026-07-05T21:59:00Z'))).toBe('2026-07-05');
    expect(oggiIso(new Date('2026-07-05T22:01:00Z'))).toBe('2026-07-06');
  });

  it('è un campo data nativo, già su oggi, con "oggi" accanto', () => {
    render(<CampoData name="data_spesa" oggi="2026-11-10" />);
    const campo = screen.getByLabelText('Data') as HTMLInputElement;
    expect(campo.type).toBe('date');
    expect(campo.value).toBe('2026-11-10');
    expect(campo.max).toBe('2026-11-10');
    expect(screen.getByText('oggi')).toBeDefined();
    fireEvent.change(campo, { target: { value: '2026-11-01' } });
    expect(screen.queryByText('oggi')).toBeNull();
  });
});

describe('SezioneEspandibile', () => {
  it('si apre col tocco, e i campi dentro arrivano nel modulo anche da chiusa', () => {
    const { container } = render(
      <form>
        <SezioneEspandibile titolo="Altro" riassunto="Descrizione, pagamento, nota">
          <CampoTesto etichetta="Descrizione" name="descrizione" defaultValue="Esselunga" />
          <CampoTesto etichetta="Nota" name="note" righe={3} />
        </SezioneEspandibile>
      </form>,
    );
    const pulsante = screen.getByRole('button', { name: /Altro/ });
    expect(pulsante.getAttribute('aria-expanded')).toBe('false');
    expect(datiDel(container.querySelector('form')!)).toEqual({ descrizione: 'Esselunga', note: '' });
    fireEvent.click(pulsante);
    expect(pulsante.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Nota' }).tagName).toBe('TEXTAREA');
  });
});
