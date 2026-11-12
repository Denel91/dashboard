-- =====================================================================
-- Ultimo pareggio per la Home sul computer (tavola C1 v2, US-30)
-- 12 novembre 2026, decisione D26
--
-- "Dall'ultimo pareggio del 28 ottobre: 2 spese tue e 1 di Simona."
-- Prima la Home prendeva come pareggio l'ultimo rimborso, anche parziale,
-- e contava le spese successive leggendole una per una (con il limite di
-- 1000 righe delle API). Ora:
--   * pareggio = l'ultimo momento in cui il saldo è tornato a zero. Si
--     mettono in fila le spese che entrano nel saldo (vista quote_spese) e
--     i rimborsi non annullati, per data (data_spesa, data_rimborso) e, a
--     parità di giorno, per ora di registrazione, e si segue il saldo passo
--     per passo. Un rimborso parziale non è un pareggio;
--   * le spese dopo il pareggio le conta il database, divise tra chi
--     chiama e l'altra persona: nessun limite di righe.
-- Il saldo resta quello della vista saldi: alla fine della fila il saldo
-- progressivo coincide con quello (test 12).
--
-- security invoker: valgono la RLS e i permessi di chi chiama, come per
-- una lettura dall'app. Nessun avviso del Security Advisor.
-- =====================================================================

create function public.ultimo_pareggio(p_nucleo_id uuid)
returns table (data_pareggio date, spese_mie integer, spese_altra integer)
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_io uuid := public.membro_corrente(p_nucleo_id);
begin
  if v_io is null then
    raise exception 'Non fai parte di questo nucleo' using errcode = '42501';
  end if;

  return query
  with eventi as (
    -- Spese che entrano nel saldo: + la quota dell'altra se ho pagato io
    select s.data_spesa as giorno, s.data_creazione as istante, s.id,
           case when q.pagata_da = v_io then q.quota_altra_persona_centesimi
                else -q.quota_altra_persona_centesimi end as effetto,
           q.pagata_da
    from public.quote_spese q
    join public.spese s on s.id = q.id
    where q.nucleo_id = p_nucleo_id
    union all
    -- Rimborsi validi: + se li ho dati io, − se li ho ricevuti (vista saldi)
    select r.data_rimborso, r.data_creazione, r.id,
           case when r.da_membro = v_io then r.importo_centesimi
                else -r.importo_centesimi end,
           null::uuid
    from public.rimborsi r
    where r.nucleo_id = p_nucleo_id and r.data_eliminazione is null
  ),
  fila as (
    select e.pagata_da,
           e.giorno,
           row_number() over w as n,
           sum(e.effetto) over (w rows between unbounded preceding and current row) as saldo
    from eventi e
    window w as (order by e.giorno, e.istante, e.id)
  ),
  pareggio as (
    select max(f.n) as n from fila f where f.saldo = 0
  )
  select
    (select f.giorno from fila f, pareggio p where f.n = p.n),
    (count(*) filter (where f.pagata_da = v_io))::integer,
    (count(*) filter (where f.pagata_da is not null and f.pagata_da <> v_io))::integer
  from fila f, pareggio p
  where f.n > coalesce(p.n, 0);
end $$;

comment on function public.ultimo_pareggio(uuid) is
  'Home sul computer (C1, D26): il giorno dell''ultimo pareggio (l''ultima volta che il saldo è tornato a zero, vuoto se non è mai successo) e quante spese hanno registrato da allora chi chiama e l''altra persona.';

-- Permessi espliciti (Fase 3, sezione 4): solo chi ha fatto l'accesso
revoke execute on function public.ultimo_pareggio(uuid) from public, anon;
grant  execute on function public.ultimo_pareggio(uuid) to authenticated, service_role;
