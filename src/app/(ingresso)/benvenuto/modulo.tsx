'use client';

import { useActionState } from 'react';
import { creaNucleo, type StatoModulo } from '@/app/actions/nucleo';
import { CampoTesto, Modulo, PulsantePrincipale } from '@/components/ui';

export function ModuloCreaNucleo({ nomeIniziale }: { nomeIniziale: string }) {
  const [stato, azione, inCorso] = useActionState<StatoModulo, FormData>(creaNucleo, {});

  return (
    <Modulo action={azione} validationErrors={stato.errori} className="mt-8 flex-1">
      <CampoTesto
        name="nome"
        etichetta="Il tuo nome"
        defaultValue={nomeIniziale}
        nota="È il nome che vedrà l’altra persona."
        autoComplete="given-name"
        maxLength={40}
      />
      <CampoTesto
        name="nomeNucleo"
        etichetta="Nome del nucleo (facoltativo)"
        segnaposto="Casa nostra"
        maxLength={60}
      />
      {stato.messaggio && (
        <p role="alert" className="text-sottotitolo text-pericolo">
          {stato.messaggio}
        </p>
      )}
      {/* Il pulsante sta nella metà bassa dello schermo (linee guida, sezione 6.3) */}
      <div className="mt-auto pt-6 md:pt-2">
        <PulsantePrincipale type="submit" isPending={inCorso} className="md:w-full">
          {inCorso ? 'Creo il nucleo…' : 'Crea'}
        </PulsantePrincipale>
      </div>
    </Modulo>
  );
}
