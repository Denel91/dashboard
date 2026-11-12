-- =====================================================================
-- Test 11 — La regola dei rimborsi non si aggira (D25) e permessi delle
-- funzioni (Security Advisor, lint 0028 e 0029)
--
-- A (Daniele) e B (Simona) nel nucleo N1. A paga 46,80 € a metà:
-- Simona deve 23,40 € a Daniele. Tutto come se arrivasse dall'API,
-- con insert e update diretti invece di registra_rimborso().
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000b', 'a11@test.it'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b11@test.it');
insert into public.nuclei (id, nome, codice_invito) values
  ('1b000000-0000-0000-0000-000000000000', 'Casa nostra', 'codice-11a');
insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('ab000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000b', 'Daniele'),
  ('bc000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000b', 'Simona');

-- 1–6: nessuna funzione dei trigger si chiama dall'API; ping() solo da anon
select ok(not has_function_privilege('anon', 'public.imposta_autore()', 'execute'),
  'anon non esegue imposta_autore()');
select ok(not has_function_privilege('authenticated', 'public.registra_cronologia()', 'execute'),
  'authenticated non esegue registra_cronologia()');
select ok(not has_function_privilege('authenticated', 'public.aggiorna_data_modifica()', 'execute'),
  'authenticated non esegue aggiorna_data_modifica()');
select ok(not has_function_privilege('authenticated', 'public.controlla_rimborso()', 'execute'),
  'authenticated non esegue controlla_rimborso()');
select ok(not has_function_privilege('authenticated', 'public.ping()', 'execute'),
  'authenticated non esegue ping()');
select ok(has_function_privilege('anon', 'public.ping()', 'execute'),
  'anon esegue ping() (cron di Vercel)');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa)
values ('1b000000-0000-0000-0000-000000000000', 'ab000000-0000-0000-0000-000000000000', 4680, '2026-11-05');

-- 7–8: i trigger scattano anche senza EXECUTE sulle loro funzioni
select is((select autore from public.spese where nucleo_id = '1b000000-0000-0000-0000-000000000000'),
  'ab000000-0000-0000-0000-000000000000'::uuid, 'l''autore della spesa lo imposta ancora il trigger');
select is((select count(*)::int from public.cronologia where nucleo_id = '1b000000-0000-0000-0000-000000000000'),
  1, 'la cronologia si scrive ancora');

-- 9–11: insert diretto (come /rest/v1/rimborsi) fuori dalla regola
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-000000000000',
             'ab000000-0000-0000-0000-000000000000', 10000) $$,
  'P0006', null, 'insert diretto: Simona non dà 100,00 € su un debito di 23,40 €');
select throws_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'ab000000-0000-0000-0000-000000000000',
             'bc000000-0000-0000-0000-000000000000', 500) $$,
  'P0006', null, 'insert diretto: Daniele, che deve ricevere, non dà soldi');
select throws_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-000000000000',
             'ab000000-0000-0000-0000-000000000000', -100) $$,
  'P0006', null, 'insert diretto: niente importi negativi');

-- 12–13: un insert diretto dentro la regola passa (stesso effetto della funzione)
select lives_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-000000000000',
             'ab000000-0000-0000-0000-000000000000', 2340) $$,
  'insert diretto di tutto il debito: passa');
select throws_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-000000000000',
             'ab000000-0000-0000-0000-000000000000', 100) $$,
  'P0005', null, 'in pari non si inserisce un altro rimborso');

-- 14–15: annullare e cambiare la nota restano possibili
select lives_ok(
  $$ update public.rimborsi set nota = 'Bonifico' where nucleo_id = '1b000000-0000-0000-0000-000000000000' $$,
  'la nota di un rimborso si modifica');
select lives_ok(
  $$ update public.rimborsi set data_eliminazione = now() where nucleo_id = '1b000000-0000-0000-0000-000000000000' $$,
  'il rimborso si annulla (US-33)');

-- 16–18: ripristino di un rimborso annullato. Intanto Simona salda di
-- nuovo con la funzione: ripristinare il vecchio rimborso invertirebbe il debito
select lives_ok(
  $$ select public.registra_rimborso('1b000000-0000-0000-0000-000000000000', 2340, -2340, '2026-11-12') $$,
  'Simona salda di nuovo con registra_rimborso()');
select throws_ok(
  $$ update public.rimborsi set data_eliminazione = null
     where nucleo_id = '1b000000-0000-0000-0000-000000000000' and data_eliminazione is not null $$,
  'P0005', null, 'il rimborso annullato non si ripristina se siete già in pari');
select is((select sum(saldo_centesimi)::int from public.saldi where nucleo_id = '1b000000-0000-0000-0000-000000000000' and saldo_centesimi <> 0),
  null, 'il saldo resta a zero');

-- 19: ripristino dentro la regola (dopo aver annullato il secondo rimborso)
update public.rimborsi set data_eliminazione = now()
where nucleo_id = '1b000000-0000-0000-0000-000000000000' and data_eliminazione is null;
select lives_ok(
  $$ update public.rimborsi set data_eliminazione = null
     where id = (select id from public.rimborsi
                 where nucleo_id = '1b000000-0000-0000-0000-000000000000'
                 order by data_creazione limit 1) $$,
  'un rimborso annullato si ripristina se non supera il debito');

-- 20: nemmeno il proprietario del database scavalca la regola
reset role;
select throws_ok(
  $$ insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
     values ('1b000000-0000-0000-0000-000000000000', 'bc000000-0000-0000-0000-000000000000',
             'ab000000-0000-0000-0000-000000000000', 100) $$,
  'P0005', null, 'anche come postgres: in pari niente rimborsi');

select * from finish();
rollback;
