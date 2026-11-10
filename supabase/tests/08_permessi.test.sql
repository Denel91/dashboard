-- =====================================================================
-- Test 8 — Permessi espliciti per l'API (Fase 3, sezione 4)
--
-- Dal 30 maggio 2026 i progetti Supabase nuovi non danno più permessi
-- automatici sulle tabelle di public: senza i grant delle migrazioni l'app
-- non legge niente (successo sullo staging con US-02). In locale la CLI li
-- dà ancora, quindi un grant dimenticato si vedrebbe solo sullo staging:
-- questo test lo fa vedere in CI. Controlla i permessi che l'app USA.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- Lettura per chi ha fatto l'accesso: tabelle e viste
select ok(has_table_privilege('authenticated', t, 'select'), format('authenticated legge %s', t))
from unnest(array[
  'public.nuclei', 'public.membri', 'public.categorie', 'public.budget_categorie',
  'public.spese', 'public.rimborsi', 'public.cronologia',
  'public.quote_spese', 'public.saldi', 'public.spesa_mensile_per_categoria'
]) as t;

-- Scritture usate dall'app (US-10, US-13): inserire una spesa, modificarla
-- e spostarla nel Cestino, solo nelle colonne del contenuto
select ok(has_column_privilege('authenticated', 'public.spese', 'importo_centesimi', 'insert'),
  'authenticated inserisce una spesa');
select ok(has_column_privilege('authenticated', 'public.spese', 'importo_centesimi', 'update'),
  'authenticated modifica l''importo di una spesa');
select ok(has_column_privilege('authenticated', 'public.spese', 'data_eliminazione', 'update'),
  'authenticated sposta una spesa nel Cestino');
select ok(not has_column_privilege('authenticated', 'public.spese', 'nucleo_id', 'update'),
  'authenticated NON cambia il nucleo di una spesa');
select ok(not has_column_privilege('authenticated', 'public.spese', 'autore', 'update'),
  'authenticated NON riscrive l''autore di una spesa');
select ok(not has_table_privilege('authenticated', 'public.spese', 'delete'),
  'authenticated NON cancella davvero una spesa (D10)');

-- Funzioni chiamate senza sessione
select ok(has_function_privilege('anon', 'public.anteprima_invito(text)', 'execute'),
  'anon apre l''anteprima dell''invito (D14)');

select * from finish();
rollback;
