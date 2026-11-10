-- =====================================================================
-- Rimborsi dall'app (US-31, US-32, US-33) · 10 novembre 2026
--
-- "Segna come saldato" (tutto il saldo) e il rimborso parziale passano da
-- registra_rimborso(); "Annulla" da annulla_rimborso(). Perché funzioni e
-- non un insert/update diretto:
--   * chi dà e chi riceve li decide il database dal saldo, non l'app;
--   * concorrenza: se Daniele e Simona toccano "Conferma" nello stesso
--     momento, senza controllo si registrerebbero due rimborsi dell'intero
--     saldo e il debito si invertirebbe. Le funzioni prendono un blocco sul
--     nucleo (pg_advisory_xact_lock, rilasciato a fine transazione) e
--     registrano solo se il saldo è ancora quello che la persona vedeva;
--   * l'importo non può superare il saldo (deciso in coppia il 10 novembre):
--     il saldo non cambia mai di segno per un errore di battitura.
--
-- security invoker: valgono la RLS e i permessi per colonna di chi chiama,
-- come per un insert dall'app. La cronologia la scrive il trigger di
-- sempre (creazione; annullamento = "eliminazione").
--
-- Errori (l'app li traduce, src/lib/saldo/errori.ts):
--   P0004  il saldo è cambiato nel frattempo
--   P0005  siete già in pari
--   P0006  importo non valido: zero, negativo o più del saldo
--   P0007  nel nucleo non c'è ancora l'altra persona
--   P0008  rimborso inesistente o di un altro nucleo
--   42501  chi chiama non fa parte del nucleo
-- =====================================================================

create function public.registra_rimborso(
  p_nucleo_id               uuid,
  p_importo_centesimi       bigint,
  p_saldo_atteso_centesimi  bigint,
  p_data_rimborso           date,
  p_nota                    text default null
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_io     uuid := public.membro_corrente(p_nucleo_id);
  v_altro  uuid;
  v_saldo  bigint;
  v_id     uuid;
begin
  if v_io is null then
    raise exception 'Non fai parte di questo nucleo' using errcode = '42501';
  end if;

  -- Un'operazione sul saldo alla volta per nucleo
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('saldo:' || p_nucleo_id::text, 0));

  select m.id into v_altro from public.membri m
  where m.nucleo_id = p_nucleo_id and m.id <> v_io and m.data_uscita is null;
  if v_altro is null then
    raise exception 'Nel nucleo non c''è ancora l''altra persona' using errcode = 'P0007';
  end if;

  -- Letto DOPO il blocco: vede il rimborso appena registrato dall'altra persona
  select s.saldo_centesimi into v_saldo from public.saldi s where s.membro_id = v_io;

  if v_saldo is distinct from p_saldo_atteso_centesimi then
    raise exception 'Il saldo è cambiato' using errcode = 'P0004';
  end if;
  if v_saldo = 0 then
    raise exception 'Siete già in pari' using errcode = 'P0005';
  end if;
  if p_importo_centesimi is null or p_importo_centesimi <= 0 or p_importo_centesimi > abs(v_saldo) then
    raise exception 'Importo non valido' using errcode = 'P0006';
  end if;

  -- Saldo positivo: l'altra persona mi deve, quindi è lei che dà i soldi
  insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso, nota)
  values (
    p_nucleo_id,
    case when v_saldo > 0 then v_altro else v_io end,
    case when v_saldo > 0 then v_io else v_altro end,
    p_importo_centesimi,
    p_data_rimborso,
    nullif(btrim(p_nota), '')
  )
  returning id into v_id;

  return v_id;
end $$;

comment on function public.registra_rimborso(uuid, bigint, bigint, date, text) is
  'Registra un rimborso tra i due membri (US-31, US-32): chi dà e chi riceve dal saldo, solo se il saldo è ancora quello atteso (P0004) e l''importo non lo supera (P0006). Un blocco sul nucleo evita due rimborsi contemporanei.';

create function public.annulla_rimborso(p_rimborso_id uuid)
returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_nucleo uuid;
  v_righe  int;
begin
  -- La RLS fa trovare solo i rimborsi del proprio nucleo
  select r.nucleo_id into v_nucleo from public.rimborsi r where r.id = p_rimborso_id;
  if v_nucleo is null then
    raise exception 'Rimborso inesistente' using errcode = 'P0008';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('saldo:' || v_nucleo::text, 0));

  update public.rimborsi set data_eliminazione = now()
  where id = p_rimborso_id and data_eliminazione is null;
  get diagnostics v_righe = row_count;
  -- false: era già annullato (per esempio dall'altra persona), va bene lo stesso
  return v_righe = 1;
end $$;

comment on function public.annulla_rimborso(uuid) is
  'Annulla un rimborso (US-33): resta in elenco e nella cronologia, ma non conta più nel saldo. Restituisce false se era già annullato.';

-- Permessi espliciti (Fase 3, sezione 4): solo chi ha fatto l'accesso
revoke execute on function public.registra_rimborso(uuid, bigint, bigint, date, text) from public, anon;
revoke execute on function public.annulla_rimborso(uuid) from public, anon;
grant  execute on function public.registra_rimborso(uuid, bigint, bigint, date, text) to authenticated;
grant  execute on function public.annulla_rimborso(uuid) to authenticated;
