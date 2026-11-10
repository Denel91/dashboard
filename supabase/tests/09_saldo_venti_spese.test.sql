-- =====================================================================
-- US-30 · Il saldo coincide al centesimo con un calcolo fatto a mano,
-- su 22 spese (il criterio di accettazione ne chiede almeno 20).
--
-- A = Daniele, B = Simona. Ogni riga della tabella qui sotto dice la quota
-- a carico di chi NON ha pagato, calcolata a mano con le regole R2–R5:
--   a metà            → metà troncata verso lo zero (il centesimo dispari
--                       resta a chi ha pagato, anche sui resi)
--   per l'altra       → tutto l'importo
--   anticipo per terzi, spesa nel Cestino → 0, fuori dal saldo
-- e l'effetto sul saldo di A (+ se ha pagato A, − se ha pagato B).
--
--  #  pagato  importo  divisione       quota   saldo di A
--  1  A        47,30   a metà          23,65   +23,65
--  2  B        38,00   a metà          19,00    +4,65
--  3  A        13,30   a metà           6,65   +11,30
--  4  A        10,01   a metà           5,00   +16,30
--  5  B         9,99   a metà           4,99   +11,31
--  6  A        25,00   per l'altra     25,00   +36,31
--  7  B        12,50   per l'altra     12,50   +23,81
--  8  A       850,00   a metà         425,00  +448,81
--  9  B       850,00   a metà         425,00   +23,81
-- 10  A       −10,01   reso a metà     −5,00   +18,81
-- 11  B        64,20   a metà          32,10   −13,29
-- 12  A        30,00   anticipo Marco   0      −13,29
-- 13  A        50,00   nel Cestino      0      −13,29
-- 14  B        19,99   a metà           9,99   −23,28
-- 15  A       123,45   a metà          61,72   +38,44
-- 16  B         7,77   a metà           3,88   +34,56
-- 17  A         0,01   a metà           0,00   +34,56
-- 18  B         0,03   a metà           0,01   +34,55
-- 19  A        49,99   per l'altra     49,99   +84,54
-- 20  B       150,00   a metà          75,00    +9,54
-- 21  A        27,89   a metà          13,94   +23,48
-- 22  B        44,10   a metà          22,05    +1,43
--
-- Poi B restituisce 1,00 € ad A (+1,43 − 1,00 = +0,43) e un rimborso di
-- 5,00 € di A a B viene annullato (non conta). Saldo finale: Simona deve
-- 0,43 € a Daniele.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000009', 'a9@test.it'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'b9@test.it');
insert into public.nuclei (id, nome, codice_invito) values
  ('99999999-0000-0000-0000-000000000000', 'Casa dei conti', 'codice-n9');
insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('a9000000-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-0000-0000-000000000009', 'Daniele'),
  ('b9000000-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000000',
   'bbbbbbbb-0000-0000-0000-000000000009', 'Simona');

-- Le 22 spese con la quota calcolata a mano (colonna "attesa")
create temporary table attese (n int, pagata_da uuid, importo bigint, divisione text, terza text,
                               cestino boolean, attesa bigint) on commit drop;
insert into attese values
  ( 1, 'a9000000-0000-0000-0000-000000000000',  4730, 'a_meta',            null,   false,  2365),
  ( 2, 'b9000000-0000-0000-0000-000000000000',  3800, 'a_meta',            null,   false,  1900),
  ( 3, 'a9000000-0000-0000-0000-000000000000',  1330, 'a_meta',            null,   false,   665),
  ( 4, 'a9000000-0000-0000-0000-000000000000',  1001, 'a_meta',            null,   false,   500),
  ( 5, 'b9000000-0000-0000-0000-000000000000',   999, 'a_meta',            null,   false,   499),
  ( 6, 'a9000000-0000-0000-0000-000000000000',  2500, 'per_altra_persona', null,   false,  2500),
  ( 7, 'b9000000-0000-0000-0000-000000000000',  1250, 'per_altra_persona', null,   false,  1250),
  ( 8, 'a9000000-0000-0000-0000-000000000000', 85000, 'a_meta',            null,   false, 42500),
  ( 9, 'b9000000-0000-0000-0000-000000000000', 85000, 'a_meta',            null,   false, 42500),
  (10, 'a9000000-0000-0000-0000-000000000000', -1001, 'a_meta',            null,   false,  -500),
  (11, 'b9000000-0000-0000-0000-000000000000',  6420, 'a_meta',            null,   false,  3210),
  (12, 'a9000000-0000-0000-0000-000000000000',  3000, 'a_meta',            'Marco', false,  null),
  (13, 'a9000000-0000-0000-0000-000000000000',  5000, 'a_meta',            null,   true,   null),
  (14, 'b9000000-0000-0000-0000-000000000000',  1999, 'a_meta',            null,   false,   999),
  (15, 'a9000000-0000-0000-0000-000000000000', 12345, 'a_meta',            null,   false,  6172),
  (16, 'b9000000-0000-0000-0000-000000000000',   777, 'a_meta',            null,   false,   388),
  (17, 'a9000000-0000-0000-0000-000000000000',     1, 'a_meta',            null,   false,     0),
  (18, 'b9000000-0000-0000-0000-000000000000',     3, 'a_meta',            null,   false,     1),
  (19, 'a9000000-0000-0000-0000-000000000000',  4999, 'per_altra_persona', null,   false,  4999),
  (20, 'b9000000-0000-0000-0000-000000000000', 15000, 'a_meta',            null,   false,  7500),
  (21, 'a9000000-0000-0000-0000-000000000000',  2789, 'a_meta',            null,   false,  1394),
  (22, 'b9000000-0000-0000-0000-000000000000',  4410, 'a_meta',            null,   false,  2205);
grant select on attese to authenticated;

-- Da qui è collegata A, come nell'app: registra anche le spese pagate da B
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000009","role":"authenticated"}';

insert into public.spese (nucleo_id, pagata_da, importo_centesimi, divisione, terza_persona, descrizione, data_spesa)
select '99999999-0000-0000-0000-000000000000', pagata_da, importo, divisione, terza, 'Spesa ' || n,
       date '2026-11-01' + (n % 9)
from attese order by n;

update public.spese set data_eliminazione = now()
where nucleo_id = '99999999-0000-0000-0000-000000000000' and descrizione = 'Spesa 13';

-- 1–22: la quota di ogni spesa coincide con quella calcolata a mano
select is(
  (select q.quota_altra_persona_centesimi::bigint
     from public.spese s left join public.quote_spese q on q.id = s.id
    where s.nucleo_id = '99999999-0000-0000-0000-000000000000' and s.descrizione = 'Spesa ' || a.n),
  a.attesa,
  'spesa ' || a.n || ': quota calcolata a mano'
)
from attese a order by a.n;

-- 23: prima dei rimborsi Simona deve 1,43 € a Daniele
select is(
  (select saldo_centesimi::bigint from public.saldi where membro_id = 'a9000000-0000-0000-0000-000000000000'),
  143::bigint,
  'dopo le 22 spese il saldo di Daniele è +1,43 € (calcolo a mano)'
);

-- Rimborsi: Simona dà 1,00 € a Daniele; un rimborso di Daniele viene annullato
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso)
values ('99999999-0000-0000-0000-000000000000', 'b9000000-0000-0000-0000-000000000000',
        'a9000000-0000-0000-0000-000000000000', 100, '2026-11-09'),
       ('99999999-0000-0000-0000-000000000000', 'a9000000-0000-0000-0000-000000000000',
        'b9000000-0000-0000-0000-000000000000', 500, '2026-11-09');
update public.rimborsi set data_eliminazione = now()
where nucleo_id = '99999999-0000-0000-0000-000000000000' and importo_centesimi = 500;

-- 24–25: saldo finale, visto da Daniele e da Simona
select is(
  (select saldo_centesimi::bigint from public.saldi where membro_id = 'a9000000-0000-0000-0000-000000000000'),
  43::bigint,
  'con i rimborsi il saldo di Daniele è +0,43 €'
);
select is(
  (select saldo_centesimi::bigint from public.saldi where membro_id = 'b9000000-0000-0000-0000-000000000000'),
  -43::bigint,
  'e quello di Simona è −0,43 €'
);

-- 26: i due saldi si annullano sempre
select is(
  (select sum(saldo_centesimi)::bigint from public.saldi where nucleo_id = '99999999-0000-0000-0000-000000000000'),
  0::bigint,
  'la somma dei due saldi è zero'
);

-- 27: Simona, collegata, legge lo stesso saldo
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000009","role":"authenticated"}';
select is(
  (select saldo_centesimi::bigint from public.saldi where membro_id = 'b9000000-0000-0000-0000-000000000000'),
  -43::bigint,
  'Simona collegata vede di dovere 0,43 €'
);

select * from finish();
rollback;
