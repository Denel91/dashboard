import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CampoTesto, Modulo } from './campo';

afterEach(cleanup);

describe('CampoTesto e Modulo', () => {
  it('collega etichetta e nota al campo', () => {
    render(<CampoTesto name="nome" etichetta="Il tuo nome" nota="È il nome che vedrà l’altra persona." defaultValue="Daniele" />);
    const campo = screen.getByRole('textbox', { name: 'Il tuo nome' });
    expect((campo as HTMLInputElement).value).toBe('Daniele');
    expect(campo.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('mostra sotto il campo l’errore restituito dal server', () => {
    render(
      <Modulo validationErrors={{ nome: 'Scrivi il tuo nome.' }}>
        <CampoTesto name="nome" etichetta="Il tuo nome" />
      </Modulo>,
    );
    const campo = screen.getByRole('textbox', { name: 'Il tuo nome' });
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Scrivi il tuo nome.')).toBeTruthy();
  });
});
