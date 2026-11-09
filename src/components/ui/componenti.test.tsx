import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RegioneAvvisi, chiudiAvviso, mostraAvviso } from './avviso';
import { Card } from './card';
import { ApriFoglio, Foglio } from './foglio';
import { GruppoRighe, Riga } from './gruppo-righe';
import { Iniziale, inizialeDi } from './iniziale';
import { PulsantePrincipale } from './pulsante';

afterEach(cleanup);

describe('Card', () => {
  it('usa superficie, o il colore tenue della persona che deve', () => {
    const { container, rerender } = render(<Card>Totale</Card>);
    expect(container.firstElementChild?.className).toContain('bg-superficie');
    rerender(<Card tono="persona-b">Simona ti deve</Card>);
    expect(container.firstElementChild?.className).toContain('bg-persona-b-tenue');
  });
});

describe('Iniziale', () => {
  it('prende la prima lettera maiuscola, anche con spazi o lettere accentate', () => {
    expect(inizialeDi('simona')).toBe('S');
    expect(inizialeDi('  daniele ')).toBe('D');
    expect(inizialeDi('élodie')).toBe('É');
    expect(inizialeDi('')).toBe('?');
  });

  it('ha il nome intero per i lettori di schermo, oppure si nasconde se è decorativa', () => {
    render(<Iniziale nome="Simona" persona="b" />);
    expect(screen.getByRole('img', { name: 'Simona' }).textContent).toBe('S');
    cleanup();
    const { container } = render(<Iniziale nome="Simona" persona="b" decorativa />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('GruppoRighe e Riga', () => {
  it('mostra intestazione e righe; la riga con href è un link con il chevron', () => {
    render(
      <GruppoRighe titolo="Profilo">
        <Riga titolo="Il tuo nome" valore="Daniele" href="/altro/profilo" />
        <Riga titolo="Account Google" sottotitolo="daniele@example.com" />
      </GruppoRighe>,
    );
    expect(screen.getByRole('heading', { name: 'Profilo' })).toBeTruthy();
    const righe = screen.getAllByRole('listitem');
    expect(righe).toHaveLength(2);
    const link = within(righe[0]).getByRole('link');
    expect(link.getAttribute('href')).toBe('/altro/profilo');
    expect(link.querySelector('svg')).toBeTruthy();
    expect(within(righe[1]).queryByRole('link')).toBeNull();
  });
});

describe('Foglio', () => {
  it('si apre dal pulsante, è una finestra con il suo titolo e si chiude dal contenuto', async () => {
    render(
      <ApriFoglio>
        <PulsantePrincipale>Segna come saldato</PulsantePrincipale>
        <Foglio titolo="Segna come saldato">
          {({ chiudi }) => <PulsantePrincipale onPress={chiudi}>Conferma</PulsantePrincipale>}
        </Foglio>
      </ApriFoglio>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Segna come saldato' }));
    const finestra = await screen.findByRole('dialog', { name: 'Segna come saldato' });
    fireEvent.click(within(finestra).getByRole('button', { name: 'Conferma' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('si chiude con Esc', async () => {
    const chiamate: boolean[] = [];
    render(
      <Foglio titolo="Spostare nel Cestino?" isOpen onOpenChange={(aperto) => chiamate.push(aperto)}>
        <p>Potrai recuperarla per 30 giorni.</p>
      </Foglio>,
    );
    const finestra = await screen.findByRole('dialog', { name: 'Spostare nel Cestino?' });
    fireEvent.keyDown(finestra, { key: 'Escape' });
    expect(chiamate).toEqual([false]);
  });
});

describe('Avvisi', () => {
  it('mostraAvviso fa comparire il testo nella regione, con il pulsante Chiudi', async () => {
    render(<RegioneAvvisi />);
    let chiave = '';
    act(() => {
      chiave = mostraAvviso('Spesa salvata · Simona ti deve 47,05 €');
    });
    const regione = await screen.findByRole('region', { name: 'Avvisi' });
    expect(within(regione).getByText('Spesa salvata · Simona ti deve 47,05 €')).toBeTruthy();
    expect(within(regione).getByRole('button', { name: 'Chiudi' })).toBeTruthy();
    act(() => chiudiAvviso(chiave));
    await waitFor(() => expect(screen.queryByText('Spesa salvata · Simona ti deve 47,05 €')).toBeNull());
  });
});
