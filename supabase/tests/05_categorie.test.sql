-- =====================================================================
-- Test 5 — Icone e colori delle categorie (migrazione 20261107170000, D18)
-- L'icona è il nome di un'icona a linea, non un'emoji; il colore
-- predefinito è il grigio della tavolozza delle categorie.
-- Tutto gira dentro una transazione chiusa da ROLLBACK.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

insert into public.nuclei (id, nome) values ('00000000-0000-0000-0000-0000000000c1', 'Prova');

select lives_ok(
  $$insert into public.categorie (nucleo_id, nome, icona)
    values ('00000000-0000-0000-0000-0000000000c1', 'Spesa', 'shopping-cart')$$,
  'un nome di icona valido si salva'
);

select throws_ok(
  $$insert into public.categorie (nucleo_id, nome, icona)
    values ('00000000-0000-0000-0000-0000000000c1', 'Emoji', '🛒')$$,
  '23514', null,
  'un''emoji come icona viene rifiutata'
);

select throws_ok(
  $$insert into public.categorie (nucleo_id, nome, icona)
    values ('00000000-0000-0000-0000-0000000000c1', 'Maiuscole', 'Shopping-Cart')$$,
  '23514', null,
  'le maiuscole nel nome dell''icona vengono rifiutate'
);

select throws_ok(
  $$insert into public.categorie (nucleo_id, nome)
    values ('00000000-0000-0000-0000-0000000000c1', 'Senza icona')$$,
  '23502', null,
  'l''icona è obbligatoria: non c''è più un valore predefinito'
);

select is(
  (select colore from public.categorie where nome = 'Spesa'),
  '#8b8b91',
  'il colore predefinito è il grigio della tavolozza'
);

select * from finish();
rollback;
