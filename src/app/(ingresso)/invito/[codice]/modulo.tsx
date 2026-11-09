'use client';

import { useActionState } from 'react';
import { entraNelNucleo, type StatoModulo } from '@/app/actions/nucleo';
import { CampoTesto, Modulo, PulsantePrincipale } from '@/components/ui';
import { SchermataErroreNucleo } from '../../errore-nucleo';

export function ModuloEntra({ codice, nomeIniziale, email }: { codice: string; nomeIniziale: string; email: string }) {
  const [stato, azione, inCorso] = useActionState<StatoModulo, FormData>(entraNelNucleo.bind(null, codice), {});

  // Il nucleo si è riempito nel frattempo, o l'account è già in un altro nucleo
  if (stato.erroreNucleo) {
    return (
      <div className="mt-6 flex flex-1 flex-col">
        <SchermataErroreNucleo errore={stato.erroreNucleo} />
      </div>
    );
  }

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
      {/* K4: si vede con quale account Google si sta entrando */}
      <p className="px-1 text-nota text-testo-secondario">
        Entri con l’account Google <strong className="font-semibold text-testo">{email}</strong>.
      </p>
      {stato.messaggio && (
        <p role="alert" className="text-sottotitolo text-pericolo">
          {stato.messaggio}
        </p>
      )}
      <div className="mt-auto pt-6 md:pt-2">
        <PulsantePrincipale type="submit" isPending={inCorso} className="md:w-full">
          {inCorso ? 'Entro…' : 'Entra'}
        </PulsantePrincipale>
      </div>
    </Modulo>
  );
}
