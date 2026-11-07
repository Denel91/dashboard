-- =====================================================================
-- T-11 · Test 3 — Cronologia e integrità (R6, US-13…15, US-33, NF-06, D9, D10)
--
-- A (Daniele) inserisce una spesa da 45,00 €, B (Simona) la corregge a
-- 47,30 €, la sposta nel Cestino e la ripristina. Si controlla che:
--   * autore e date li decida il database, non il client;
--   * la cronologia registri ogni passo con chi l'ha fatto e i valori;
--   * nessuno possa scrivere o ritoccare la cronologia, né cancellare spese.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

-- ---------------------------------------------------------------------
-- Dati di base (come postgres)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.it'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.it');

insert into public.nuclei (id, nome, codice_invito) values
  ('11111111-0000-0000-0000-000000000000', 'Casa nostra', 'codice-n1');

insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('a0000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-0000-0000-000000000000', 'Daniele'),
  ('b0000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'bbbbbbbb-0000-0000-0000-000000000000', 'Simona');

-- ---------------------------------------------------------------------
-- Collegato A: inserimento
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ insert into public.spese (nucleo_id, pagata_da, importo_centesimi, autore)
     values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
             1000, 'b0000000-0000-0000-0000-000000000000') $$,
  '42501', null,
  'A non può inserire una spesa scegliendo un altro autore');

insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        4500, 'Esselunga');

select is(
  (select autore from public.spese where descrizione = 'Esselunga'),
  'a0000000-0000-0000-0000-000000000000'::uuid,
  'L''autore della spesa lo imposta il database: è A');

select throws_ok(
  $$ update public.spese set data_modifica = '2020-01-01' where descrizione = 'Esselunga' $$,
  '42501', null,
  'data_modifica non si può cambiare dal client (serve al controllo dei conflitti)');

select throws_ok(
  $$ update public.spese set nucleo_id = gen_random_uuid() where descrizione = 'Esselunga' $$,
  '42501', null,
  'Il nucleo di una spesa non si può cambiare');

select throws_ok(
  $$ delete from public.spese where descrizione = 'Esselunga' $$,
  '42501', null,
  'Le spese non si cancellano davvero: si usa il Cestino (D10)');

-- Conflitto di modifica (NF-06): salvataggio con una data_modifica vecchia
with modificate as (
  update public.spese set importo_centesimi = 9999
  where descrizione = 'Esselunga' and data_modifica = '2026-01-01T00:00:00Z'
  returning 1
)
select is(count(*)::int, 0,
  'Con una data_modifica vecchia il salvataggio non tocca nulla (NF-06)')
from modificate;

-- ---------------------------------------------------------------------
-- Collegata B: modifica, Cestino, ripristino
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000000","role":"authenticated"}';

update public.spese set importo_centesimi = 4730 where descrizione = 'Esselunga';
update public.spese set data_eliminazione = now() where descrizione = 'Esselunga';
update public.spese set data_eliminazione = null  where descrizione = 'Esselunga';

select is(
  (select array_agg(c.azione order by c.id)
     from public.cronologia c join public.spese s on s.id = c.riga_id
    where c.tabella = 'spese' and s.descrizione = 'Esselunga'),
  array['creazione', 'modifica', 'eliminazione', 'ripristino'],
  'La cronologia registra creazione, modifica, eliminazione e ripristino');

select is(
  (select c.autore from public.cronologia c join public.spese s on s.id = c.riga_id
    where c.azione = 'modifica' and s.descrizione = 'Esselunga'),
  'b0000000-0000-0000-0000-000000000000'::uuid,
  'La modifica è attribuita a B');

select is(
  (select c.valori_prima ->> 'importo_centesimi' from public.cronologia c
     join public.spese s on s.id = c.riga_id
    where c.azione = 'modifica' and s.descrizione = 'Esselunga'),
  '4500',
  'Valore prima della modifica: 45,00 €');

select is(
  (select c.valori_dopo ->> 'importo_centesimi' from public.cronologia c
     join public.spese s on s.id = c.riga_id
    where c.azione = 'modifica' and s.descrizione = 'Esselunga'),
  '4730',
  'Valore dopo la modifica: 47,30 €');

-- Rimborso registrato e poi annullato (US-33)
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
values ('11111111-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000000', 2365);
update public.rimborsi set data_eliminazione = now();

select is(
  (select array_agg(azione order by id) from public.cronologia where tabella = 'rimborsi'),
  array['creazione', 'eliminazione'],
  'L''annullamento del rimborso finisce nella cronologia');

-- La cronologia la scrivono solo i trigger (D9)
select throws_ok(
  $$ insert into public.cronologia (nucleo_id, tabella, riga_id, azione)
     values ('11111111-0000-0000-0000-000000000000', 'spese', gen_random_uuid(), 'creazione') $$,
  '42501', null,
  'Nessuno può scrivere a mano nella cronologia');

select throws_ok(
  $$ update public.cronologia set autore = null $$,
  '42501', null,
  'Nessuno può ritoccare la cronologia');

select throws_ok(
  $$ delete from public.cronologia $$,
  '42501', null,
  'Nessuno può cancellare la cronologia');

-- Ognuno modifica solo il proprio profilo
with modificati as (
  update public.membri set nome_visualizzato = 'Pippo'
  where id = 'a0000000-0000-0000-0000-000000000000'
  returning 1
)
select is(count(*)::int, 0, 'B non può rinominare A')
from modificati;

select * from finish();
rollback;
