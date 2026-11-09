import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PulsanteDistruttivo,
  PulsantePrincipale,
  PulsanteSecondario,
  PulsanteTesto,
} from './pulsante';

afterEach(cleanup);

describe('pulsanti', () => {
  it.each([
    ['principale', PulsantePrincipale],
    ['secondario', PulsanteSecondario],
    ['di testo', PulsanteTesto],
    ['distruttivo', PulsanteDistruttivo],
  ])('il pulsante %s è un vero <button> che risponde al tocco', (_, Componente) => {
    const onPress = vi.fn();
    render(<Componente onPress={onPress}>Prova</Componente>);
    const pulsante = screen.getByRole('button', { name: 'Prova' });
    expect(pulsante.tagName).toBe('BUTTON');
    fireEvent.click(pulsante);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('usa solo i token: accento per il principale, pericolo per il distruttivo pieno', () => {
    render(
      <>
        <PulsantePrincipale>Salva</PulsantePrincipale>
        <PulsanteDistruttivo variante="pieno">Cancella account</PulsanteDistruttivo>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Salva' }).className).toContain('bg-accento');
    expect(screen.getByRole('button', { name: 'Cancella account' }).className).toContain('bg-pericolo');
  });

  it('da disattivato non risponde', () => {
    const onPress = vi.fn();
    render(
      <PulsantePrincipale isDisabled onPress={onPress}>
        Salva
      </PulsantePrincipale>,
    );
    const pulsante = screen.getByRole('button', { name: 'Salva' });
    expect(pulsante).toHaveProperty('disabled', true);
    fireEvent.click(pulsante);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('aggiunge le classi di disposizione passate', () => {
    render(<PulsanteSecondario className="mt-4">Copia link</PulsanteSecondario>);
    expect(screen.getByRole('button', { name: 'Copia link' }).className).toContain('mt-4');
  });
});
