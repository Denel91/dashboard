-- =====================================================================
-- Rimborsi controllati sulla tabella e permessi delle funzioni
-- 12 novembre 2026 (verifica prima di T-30, decisione D25)
--
-- 1. "Un rimborso non supera mai il saldo" (deciso il 10 novembre) valeva
--    solo dentro registra_rimborso(): chi ha fatto l'accesso poteva ancora
--    inserire in `rimborsi` direttamente dall'API (/rest/v1/rimborsi) con
--    un importo qualsiasi, o ripristinare un rimborso annullato, e
--    invertire il debito. Ora lo controlla un trigger sulla tabella, per
--    qualunque strada e per qualunque ruolo:
--      * chi dà i soldi è chi deve (saldo negativo);
--      * l'importo è maggiore di zero e non supera il suo debito;
--      * vale per l'inserimento e per il ripristino di un rimborso
--        annullato (data_eliminazione che torna vuota).
--    Annullare resta sempre possibile (US-33). Il trigger prende lo stesso
--    blocco sul nucleo di registra_rimborso() e annulla_rimborso(), quindi
--    due operazioni contemporanee non si scavalcano.
--
-- 2. Security Advisor (lint 0028 e 0029 di Supabase, aprile 2026): le
--    funzioni dei trigger erano eseguibili da tutti (il permesso a PUBLIC
--    che Postgres dà a ogni funzione nuova) e quindi chiamabili da
--    /rest/v1/rpc. Un trigger non ha bisogno di EXECUTE per scattare:
--    serve solo a chi crea il trigger. ping() serve solo ad anon (il cron
--    di Vercel non ha sessione).
--
-- Errori (li traduce src/app/actions/rimborsi.ts, come quelli della
-- migrazione 20261110180000_rimborsi.sql, che per errore indicava
-- src/lib/saldo/errori.ts):
--   P0005  siete in pari: non c'è niente da rimborsare
--   P0006  importo non valido: zero, negativo, più del debito, oppure dato
--          da chi non deve niente
-- =====================================================================

create function public.controlla_rimborso()
returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  v_saldo_da bigint;
begin
  -- Contano solo i rimborsi validi: un rimborso inserito già annullato, o
  -- un annullamento, non toccano il saldo
  if new.data_eliminazione is not null then
    return new;
  end if;
  -- Modifica della sola nota di un rimborso valido: niente da controllare
  if tg_op = 'UPDATE' and old.data_eliminazione is null then
    return new;
  end if;

  -- Un'operazione sul saldo alla volta per nucleo (stesso blocco delle
  -- funzioni dei rimborsi; dentro registra_rimborso() è già preso)
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('saldo:' || new.nucleo_id::text, 0));

  -- Saldo di chi dà i soldi, senza questo rimborso (nel ripristino la
  -- riga è ancora annullata): deve essere negativo, cioè un debito
  select s.saldo_centesimi into v_saldo_da
  from public.saldi s
  where s.membro_id = new.da_membro;
  v_saldo_da := coalesce(v_saldo_da, 0);

  if v_saldo_da = 0 then
    raise exception 'Siete già in pari' using errcode = 'P0005';
  end if;
  if v_saldo_da > 0
     or new.importo_centesimi is null
     or new.importo_centesimi <= 0
     or new.importo_centesimi > -v_saldo_da then
    raise exception 'Importo non valido' using errcode = 'P0006';
  end if;

  return new;
end $$;

comment on function public.controlla_rimborso() is
  'Trigger su rimborsi (D25): un rimborso valido lo dà solo chi deve, e mai più del suo debito; vale per l''inserimento e per il ripristino. Nessuna strada lo scavalca, nemmeno l''API diretta.';

create trigger rimborsi_controllo
  before insert or update of data_eliminazione on public.rimborsi
  for each row execute function public.controlla_rimborso();

-- Funzioni dei trigger: nessuno le chiama dall'API
revoke execute on function public.controlla_rimborso()     from public, anon, authenticated;
revoke execute on function public.imposta_autore()         from public, anon, authenticated;
revoke execute on function public.registra_cronologia()    from public, anon, authenticated;
revoke execute on function public.aggiorna_data_modifica() from public, anon, authenticated;

-- ping(): lo chiama solo il cron di Vercel, senza sessione (anon)
revoke execute on function public.ping() from public, authenticated;
grant  execute on function public.ping() to anon, service_role;
