-- =====================================================================
-- T-21 · Test 7 — Categorie predefinite (US-19, D24)
--
-- crea_nucleo() crea anche le 20 categorie predefinite, con icone e
-- colori della tavolozza; chi entra nel nucleo non ne aggiunge altre.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('a7a7a7a7-0000-0000-0000-000000000000', 'a7@test.it'),
  ('b7b7b7b7-0000-0000-0000-000000000000', 'b7@test.it');

set local role authenticated;
set local request.jwt.claims = '{"sub":"a7a7a7a7-0000-0000-0000-000000000000","role":"authenticated"}';

select public.crea_nucleo('Daniele');

select is(
  (select count(*)::int from public.categorie),
  20,
  'Il nucleo nuovo ha le 20 categorie predefinite');

select is(
  (select array_agg(nome order by ordine) from (select nome, ordine from public.categorie order by ordine limit 3) c),
  array['Spesa', 'Ristoranti e bar', 'Mezzi pubblici'],
  'Le più usate vengono per prime');

select is(
  (select nome from public.categorie order by ordine desc limit 1),
  'Altro',
  'Altro è l''ultima');

select is(
  (select count(*)::int from public.categorie
    where colore not in ('#299f47', '#cc7700', '#af8404', '#2a98ac',
                         '#a2845e', '#009c93', '#ff4838', '#8b8b91')),
  0,
  'Tutti i colori vengono dalla tavolozza delle categorie');

select is(
  (select count(distinct colore)::int from public.categorie),
  8,
  'Un colore per famiglia: 8 famiglie');

select is(
  (select array_agg(nome order by ordine) from public.categorie where colore = '#af8404'),
  array['Luce', 'Gas', 'Acqua', 'Internet e telefono'],
  'Le utenze hanno lo stesso colore (D24)');

select is(
  (select count(distinct ordine)::int from public.categorie),
  20,
  'Ogni categoria ha una posizione diversa');

select throws_ok(
  $$ select public.crea_categorie_predefinite(
       (select nucleo_id from public.membri limit 1)) $$,
  '42501', null,
  'Dal client non si possono richiamare le categorie predefinite');

-- B entra: le categorie restano 20
set local request.jwt.claims = '{"sub":"b7b7b7b7-0000-0000-0000-000000000000","role":"authenticated"}';
reset role;
update public.nuclei set codice_invito = 'codice-test-07'
 where id = (select nucleo_id from public.membri
              where utente_id = 'a7a7a7a7-0000-0000-0000-000000000000');
set local role authenticated;
select public.entra_nel_nucleo('codice-test-07', 'Simona');

select is(
  (select count(*)::int from public.categorie),
  20,
  'Chi entra nel nucleo vede le stesse 20 categorie, senza doppioni');

-- Richiamata una seconda volta (per esempio dal recupero dei nuclei
-- vecchi), non crea doppioni
reset role;
select public.crea_categorie_predefinite(
  (select nucleo_id from public.membri
    where utente_id = 'a7a7a7a7-0000-0000-0000-000000000000'));

select is(
  (select count(*)::int from public.categorie c
     join public.membri m on m.nucleo_id = c.nucleo_id
    where m.utente_id = 'a7a7a7a7-0000-0000-0000-000000000000'),
  20,
  'Richiamarla di nuovo non crea doppioni');

select * from finish();
rollback;
