import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Pagina pubblica e statica: è il "Link alle norme sulla privacy" della
// schermata di consenso di Google. Il testo è lo stesso di PRIVACY.md:
// se cambi uno dei due, aggiorna anche l'altro.

export const metadata: Metadata = {
  title: 'Privacy · Dashboard di coppia',
  description: 'Quali dati raccoglie l’app, dove li conserva e chi può vederli.',
};

const EMAIL_CONTATTO = 'disi91@hotmail.it';

export default function PaginaPrivacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold">Informativa sulla privacy</h1>
      <p className="mt-1 text-sm text-testo-secondario">Ultimo aggiornamento: 7 novembre 2026</p>

      <p className="mt-6">
        <strong>Dashboard di coppia</strong> è una web app privata e non commerciale, usata da due
        persone per registrare le spese comuni e sapere chi deve quanto all’altra. Questa pagina
        spiega quali dati raccoglie, dove li conserva e chi può vederli.
      </p>

      <Sezione titolo="Chi gestisce i dati">
        <p>
          L’app è sviluppata e gestita da Daniele per uso personale. Per qualunque domanda sui dati:{' '}
          <a className="text-accento underline" href={`mailto:${EMAIL_CONTATTO}`}>
            {EMAIL_CONTATTO}
          </a>
          .
        </p>
      </Sezione>

      <Sezione titolo="Dati ricevuti da Google">
        <p>
          L’accesso avviene solo con <strong>“Continua con Google”</strong>. Al momento dell’accesso
          Google comunica all’app:
        </p>
        <ul className="mt-2 list-disc pl-6">
          <li>nome e cognome dell’account Google;</li>
          <li>indirizzo email;</li>
          <li>immagine del profilo, se presente.</li>
        </ul>
        <p className="mt-3">
          L’app chiede solo questi dati di base (permessi <code>openid</code>, <code>email</code>,{' '}
          <code>profile</code>). <strong>Non legge</strong> Gmail, Drive, Calendar, contatti né altri
          dati dell’account Google, e non riceve la password.
        </p>
        <p className="mt-3">
          Il nome serve a proporre il nome visualizzato nell’app (modificabile). L’email serve a
          riconoscere l’account e a mostrare, nelle Impostazioni, con quale account si è entrati.
        </p>
      </Sezione>

      <Sezione titolo="Dati inseriti nell’app">
        <ul className="list-disc pl-6">
          <li>
            le spese comuni: importo, data, categoria, descrizione, metodo di pagamento, note,
            eventuale valuta estera, e il nome di una terza persona per cui si è anticipato un
            importo;
          </li>
          <li>i rimborsi tra le due persone;</li>
          <li>le categorie e i budget mensili;</li>
          <li>
            la cronologia delle modifiche: chi ha creato, modificato, eliminato o ripristinato una
            spesa o un rimborso, e quando;
          </li>
          <li>un link di pagamento facoltativo (PayPal.me, Satispay…).</li>
        </ul>
      </Sezione>

      <Sezione titolo="Dove sono conservati">
        <ul className="list-disc pl-6">
          <li>
            <strong>Supabase</strong> — database e accesso, nell’Unione Europea (Francoforte).
          </li>
          <li>
            <strong>Vercel</strong> — pubblica il sito ed esegue il codice lato server, su server a
            Francoforte; i registri tecnici (per esempio l’indirizzo IP) sono gestiti da Vercel.
          </li>
          <li>
            <strong>Google</strong> — verifica l’identità al momento dell’accesso, secondo
            l’informativa di Google.
          </li>
        </ul>
      </Sezione>

      <Sezione titolo="Chi può vedere i dati">
        <p>
          Solo le <strong>due persone dello stesso nucleo</strong>. Il database applica questa regola
          a ogni richiesta (Row Level Security): un altro account, anche se ha fatto l’accesso, non
          vede né modifica nulla.
        </p>
        <p className="mt-3">
          I dati <strong>non vengono venduti, condivisi o usati per pubblicità</strong>. L’app non usa
          cookie di profilazione né strumenti di tracciamento: usa solo i cookie tecnici necessari a
          mantenere la sessione dopo l’accesso.
        </p>
      </Sezione>

      <Sezione titolo="Per quanto tempo">
        <p>
          I dati restano finché l’account esiste. Una spesa eliminata resta nel Cestino per 30
          giorni, poi viene cancellata; la voce nella cronologia resta, così entrambe le persone
          vedono chi ha eliminato cosa.
        </p>
      </Sezione>

      <Sezione titolo="I tuoi diritti">
        <p>Dalle Impostazioni dell’app puoi:</p>
        <ul className="mt-2 list-disc pl-6">
          <li>
            <strong>esportare</strong> tutti i dati del nucleo in CSV o JSON;
          </li>
          <li>
            <strong>cancellare il tuo account</strong>. Le spese comuni restano all’altra persona,
            che le aveva registrate insieme a te, e il tuo nome nella cronologia diventa “Ex membro”.
          </li>
        </ul>
        <p className="mt-3">
          Puoi anche revocare l’accesso dell’app al tuo account Google da{' '}
          <a
            className="text-accento underline"
            href="https://myaccount.google.com/permissions"
            rel="noopener noreferrer"
            target="_blank"
          >
            myaccount.google.com/permissions
          </a>
          , e scrivere all’indirizzo sopra per qualunque richiesta di accesso, correzione o
          cancellazione.
        </p>
      </Sezione>

      <Sezione titolo="Modifiche">
        <p>
          Se questa informativa cambia, la nuova versione viene pubblicata a questo indirizzo con la
          data aggiornata.
        </p>
      </Sezione>
    </main>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-xl font-semibold">{titolo}</h2>
      {children}
    </section>
  );
}
