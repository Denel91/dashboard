# Informativa sulla privacy

*Ultimo aggiornamento: 7 novembre 2026*

**Nucleo** (`dashboard-denel.vercel.app`) è una web app privata e non commerciale, usata da due persone per registrare le spese comuni e sapere chi deve quanto all'altra. Questa pagina spiega quali dati raccoglie, dove li conserva e chi può vederli.

## Chi gestisce i dati

L'app è sviluppata e gestita da Daniele per uso personale. Per qualunque domanda sui dati: **disi91@hotmail.it**.

## Dati ricevuti da Google

L'accesso avviene solo con **"Continua con Google"**. Al momento dell'accesso Google comunica all'app:

- nome e cognome dell'account Google;
- indirizzo email;
- immagine del profilo, se presente.

L'app chiede solo questi dati di base (permessi `openid`, `email`, `profile`). **Non legge** Gmail, Drive, Calendar, contatti né altri dati dell'account Google, e non riceve la password.

Il nome serve a proporre il nome visualizzato nell'app (modificabile). L'email serve a riconoscere l'account e a mostrare, nelle Impostazioni, con quale account si è entrati.

## Dati inseriti nell'app

- le spese comuni: importo, data, categoria, descrizione, metodo di pagamento, note, eventuale valuta estera, e il nome di una terza persona per cui si è anticipato un importo;
- i rimborsi tra le due persone;
- le categorie e i budget mensili;
- la cronologia delle modifiche: chi ha creato, modificato, eliminato o ripristinato una spesa o un rimborso, e quando;
- un link di pagamento facoltativo (PayPal.me, Satispay…).

## Dove sono conservati

| Servizio | Cosa fa | Dove |
| --- | --- | --- |
| Supabase | Database e accesso | Unione Europea (Francoforte) |
| Vercel | Pubblica il sito ed esegue il codice lato server | Server a Francoforte; registri tecnici (per esempio l'indirizzo IP) gestiti da Vercel |
| Google | Verifica l'identità al momento dell'accesso | Secondo l'informativa di Google |

## Chi può vedere i dati

Solo le **due persone dello stesso nucleo**. Il database applica questa regola a ogni richiesta (Row Level Security): un altro account, anche se ha fatto l'accesso, non vede né modifica nulla.

I dati **non vengono venduti, condivisi o usati per pubblicità**. L'app non usa cookie di profilazione né strumenti di tracciamento: usa solo i cookie tecnici necessari a mantenere la sessione dopo l'accesso.

## Per quanto tempo

I dati restano finché l'account esiste. Una spesa eliminata resta nel Cestino per 30 giorni, poi viene cancellata; la voce nella cronologia resta, così entrambe le persone vedono chi ha eliminato cosa.

## I tuoi diritti

Dalle Impostazioni dell'app puoi:

- **esportare** tutti i dati del nucleo in CSV o JSON;
- **cancellare il tuo account**. Le spese comuni restano all'altra persona, che le aveva registrate insieme a te, e il tuo nome nella cronologia diventa "Ex membro".

Puoi anche revocare l'accesso dell'app al tuo account Google da [myaccount.google.com/permissions](https://myaccount.google.com/permissions), e scrivere all'indirizzo sopra per qualunque richiesta di accesso, correzione o cancellazione.

## Modifiche

Se questa informativa cambia, la nuova versione viene pubblicata a questo indirizzo con la data aggiornata.
