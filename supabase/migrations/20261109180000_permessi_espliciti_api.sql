-- =====================================================================
-- Permessi espliciti per l'API (Data API di Supabase) · 9 novembre 2026
--
-- Dal 30 maggio 2026 i progetti Supabase nuovi NON danno più in automatico
-- select/insert/update/delete sulle tabelle di "public" ai ruoli anon,
-- authenticated e service_role. Il progetto di staging è nuovo, quindi le
-- tabelle esistevano ma l'app non poteva leggerle (permission denied):
-- crea_nucleo() funzionava (security definer), la lettura del nucleo no.
-- In locale la CLI dava ancora i permessi predefiniti e il problema non
-- si vedeva.
--
-- Da qui ogni migrazione che crea una tabella o una vista dà i propri
-- permessi in modo esplicito. Le regole su QUALI righe restano nella RLS;
-- le colonne modificabili restano quelle dei grant per colonna dello
-- schema iniziale. anon non riceve niente: l'anteprima dell'invito passa
-- da anteprima_invito() (D14).
-- =====================================================================

grant usage on schema public to authenticated, service_role;

-- Lettura per chi ha fatto l'accesso (la RLS limita al proprio nucleo)
grant select on
  public.nuclei,
  public.membri,
  public.categorie,
  public.budget_categorie,
  public.spese,
  public.rimborsi,
  public.cronologia
to authenticated;

-- Viste di calcolo (security_invoker: rispettano la RLS di chi interroga)
grant select on
  public.quote_spese,
  public.saldi,
  public.spesa_mensile_per_categoria
to authenticated;

-- Categorie e budget: gestiti direttamente dai membri (policy "for all")
grant insert, update, delete on public.categorie, public.budget_categorie to authenticated;

-- service_role (script di amministrazione, mai nel browser) aggira la RLS
-- ma ha comunque bisogno dei permessi sulle tabelle
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
