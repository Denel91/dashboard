-- =====================================================================
-- T-11 · Test 2 — I conti tornano (R2–R5, R7, US-30…33, US-44)
--
-- A (Daniele) e B (Simona) nel nucleo N1. Tutte le spese le inserisce A
-- da utente collegato, come farebbe l'app.
-- Convenzione della vista saldi: positivo = l'altra persona mi deve.
--
-- Andamento del saldo di A, passo per passo:
--   +500   A paga 10,01 € a metà          → B deve 5,00 € (centesimo ad A)
--      0   A registra il reso −10,01 €    → si annulla esattamente
--  −2000   B paga 20,00 € per A           → A deve 20,00 €
--  −2000   A anticipa 30,00 € per Marco   → fuori dal saldo
--   +500   A paga 50,00 € a metà          → B deve 25,00 €
--  −2000   quella spesa va nel Cestino    → non conta più
--      0   A rimborsa 20,00 € a B         → in pari
--  −2000   il rimborso viene annullato    → si torna indietro
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

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
-- Da qui in poi è collegato A
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}';

-- Categoria e budget: 400,00 € da novembre, 500,00 € da dicembre
insert into public.categorie (id, nucleo_id, nome, icona) values
  ('ca000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000', 'Spesa', 'shopping-cart');

insert into public.budget_categorie (nucleo_id, categoria_id, importo_centesimi, valido_dal) values
  ('11111111-0000-0000-0000-000000000000', 'ca000000-0000-0000-0000-000000000000', 40000, '2026-11-01'),
  ('11111111-0000-0000-0000-000000000000', 'ca000000-0000-0000-0000-000000000000', 50000, '2026-12-01');

-- 1. A paga 10,01 € a metà (R2, R4)
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione, categoria_id, data_spesa)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        1001, 'Esselunga', 'ca000000-0000-0000-0000-000000000000', '2026-11-05');

select is(
  (select quota_altra_persona_centesimi::int from public.quote_spese q
     join public.spese s using (id) where s.descrizione = 'Esselunga'),
  500,
  '10,01 € a metà: l''altra persona deve 5,00 €, il centesimo resta a chi ha pagato (R4)');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  500,
  'Saldo di A: +5,00 €');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'b0000000-0000-0000-0000-000000000000'),
  -500,
  'Saldo di B: −5,00 €, l''opposto di A');

-- 2. Reso uguale e contrario (US-18)
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione, categoria_id, data_spesa)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        -1001, 'Reso Esselunga', 'ca000000-0000-0000-0000-000000000000', '2026-11-05');

select is(
  (select quota_altra_persona_centesimi::int from public.quote_spese q
     join public.spese s using (id) where s.descrizione = 'Reso Esselunga'),
  -500,
  'Reso di −10,01 €: quota −5,00 €, stessa regola troncata verso lo zero');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  0,
  'Spesa e reso uguali si annullano esattamente');

-- 3. B paga 20,00 € "per l'altra persona" (R3)
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, divisione, descrizione, categoria_id, data_spesa)
values ('11111111-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000',
        2000, 'per_altra_persona', 'Farmacia per A', 'ca000000-0000-0000-0000-000000000000', '2026-11-05');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  -2000,
  '"Per l''altra persona": A deve l''intero importo, 20,00 €');

-- 4. Anticipo per una terza persona (R5)
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione, categoria_id,
                          data_spesa, terza_persona)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        3000, 'Concerto', 'ca000000-0000-0000-0000-000000000000', '2026-11-05', 'Marco');

select is_empty(
  $$ select 1 from public.quote_spese q join public.spese s using (id)
     where s.descrizione = 'Concerto' $$,
  'L''anticipo per Marco non ha quote di coppia');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  -2000,
  'L''anticipo per Marco non cambia il saldo di coppia');

-- 5. Spesa da 50,00 € e poi Cestino (US-14)
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione, categoria_id, data_spesa)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        5000, 'Benzina', 'ca000000-0000-0000-0000-000000000000', '2026-11-05');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  500,
  'Con la benzina da 50,00 €: B deve 25,00 €, il saldo di A torna a +5,00 €');

update public.spese set data_eliminazione = now() where descrizione = 'Benzina';

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  -2000,
  'La spesa nel Cestino non conta più nel saldo');

-- 6. "Segna come saldato": A rimborsa 20,00 € a B (US-31)
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi)
values ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
        'b0000000-0000-0000-0000-000000000000', 2000);

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  0,
  'Dopo il rimborso il saldo di A è zero');

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'b0000000-0000-0000-0000-000000000000'),
  0,
  'Dopo il rimborso anche il saldo di B è zero');

-- 7. Annullamento del rimborso (US-33)
update public.rimborsi set data_eliminazione = now();

select is(
  (select saldo_centesimi::int from public.saldi where membro_id = 'a0000000-0000-0000-0000-000000000000'),
  -2000,
  'Il rimborso annullato non conta: A torna a −20,00 €');

select is(
  (select sum(saldo_centesimi)::int from public.saldi),
  0,
  'La somma dei due saldi è sempre zero');

-- 8. Speso e budget del mese (US-40, US-44)
--    10,01 − 10,01 + 20,00 = 20,00 €; esclusi l'anticipo e la spesa nel Cestino
select is(
  (select speso_centesimi::int from public.spesa_mensile_per_categoria
    where categoria_id = 'ca000000-0000-0000-0000-000000000000' and mese = '2026-11-01'),
  2000,
  'Speso di novembre: 20,00 €, senza anticipo e Cestino, con il reso che riduce');

select is(
  (select budget_centesimi::int from public.spesa_mensile_per_categoria
    where categoria_id = 'ca000000-0000-0000-0000-000000000000' and mese = '2026-11-01'),
  40000,
  'Budget di novembre: 400,00 €; il nuovo budget di dicembre non cambia novembre');

select * from finish();
rollback;
