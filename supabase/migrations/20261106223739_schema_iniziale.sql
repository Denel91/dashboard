-- =====================================================================
-- Dashboard finanziaria di coppia — schema iniziale
-- Versione 1.3 · 6 novembre 2026 · Fase 3, decisioni D6–D14 confermate
--
-- Novità 1.3: tutti i nomi sono in italiano (tabelle, colonne, valori,
-- viste, funzioni, trigger, indici) e ogni oggetto ha un COMMENT ON,
-- leggibile anche in Supabase Studio. Il comportamento è identico alla 1.2.
-- Novità 1.2: funzione anteprima_invito() per l'anteprima dell'invito
-- prima dell'accesso (D14, schermata 03a).
--
-- File di destinazione: supabase/migrations/<timestamp>_schema_iniziale.sql
--
-- Regole generali:
--   * Importi sempre in centesimi interi (R7): 12,50 € si salva come 1250.
--   * Divisione: 'a_meta' (50/50) oppure 'per_altra_persona' (100/0) (R2, R3).
--   * Le date (data_spesa, data_rimborso) le manda sempre l'app con la data
--     italiana: il default current_date del server è in UTC e vale solo
--     come riserva.
--   * Spese e rimborsi non si cancellano mai davvero: si valorizza
--     data_eliminazione (Cestino, annullamento) (D10).
--
-- Mappa delle tabelle:
--   nuclei            la coppia (il "nucleo"), con il codice d'invito
--   membri            le due persone del nucleo
--   categorie         categorie delle spese (Spesa, Casa, Svago…)
--   budget_categorie  tetto mensile di spesa per categoria
--   spese             ogni spesa comune, reso o anticipo per terzi
--   rimborsi          i soldi che una persona restituisce all'altra
--   cronologia        lo storico di ogni modifica a spese e rimborsi
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nucleo di coppia
-- ---------------------------------------------------------------------
create table public.nuclei (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null default 'Casa nostra' check (length(nome) between 1 and 60),
  codice_invito  text not null unique default replace(gen_random_uuid()::text, '-', ''),
  data_creazione timestamptz not null default now()
);

comment on table  public.nuclei is
  'Il nucleo di coppia: raggruppa le due persone e tutti i loro dati.';
comment on column public.nuclei.id is 'Identificativo del nucleo.';
comment on column public.nuclei.nome is 'Nome del nucleo mostrato nell''app, per esempio "Casa nostra" (1–60 caratteri).';
comment on column public.nuclei.codice_invito is
  'Codice di 32 caratteri casuali (128 bit) nel link d''invito /invito/<codice>. Si rigenera quando un membro esce (D12).';
comment on column public.nuclei.data_creazione is 'Quando è stato creato il nucleo.';

-- Un membro ha un suo id: le spese puntano al membro, non all'account Google.
-- Così dopo la cancellazione dell'account (US-04) la cronologia resta leggibile.
create table public.membri (
  id                uuid primary key default gen_random_uuid(),
  nucleo_id         uuid not null references public.nuclei (id) on delete cascade,
  utente_id         uuid references auth.users (id) on delete set null,
  nome_visualizzato text not null check (length(nome_visualizzato) between 1 and 40),
  link_pagamento    text check (link_pagamento is null or link_pagamento ~ '^https://'),
  data_ingresso     timestamptz not null default now(),
  data_uscita       timestamptz,
  unique (nucleo_id, id)             -- serve alle foreign key composte (D11)
);

-- Una persona sta in un solo nucleo attivo (Won't: più nuclei per persona)
create unique index membri_un_solo_nucleo_attivo
  on public.membri (utente_id)
  where data_uscita is null and utente_id is not null;

comment on table  public.membri is
  'Le persone di un nucleo (al massimo due attive). Le spese puntano al membro, non all''account (D8).';
comment on column public.membri.id is 'Identificativo del membro: è il valore usato in spese, rimborsi e cronologia.';
comment on column public.membri.nucleo_id is 'Il nucleo a cui appartiene il membro.';
comment on column public.membri.utente_id is
  'L''account Supabase Auth (accesso con Google). Diventa vuoto se l''account viene cancellato (US-04).';
comment on column public.membri.nome_visualizzato is 'Il nome mostrato nell''app, per esempio "Simona" (1–40 caratteri).';
comment on column public.membri.link_pagamento is 'Link di pagamento facoltativo (PayPal.me, Satispay…), solo https:// (US-35).';
comment on column public.membri.data_ingresso is 'Quando la persona è entrata nel nucleo.';
comment on column public.membri.data_uscita is
  'Quando la persona è uscita (cancellazione dell''account). Vuota = membro attivo.';

-- ---------------------------------------------------------------------
-- 2. Categorie e budget
-- ---------------------------------------------------------------------
create table public.categorie (
  id                  uuid primary key default gen_random_uuid(),
  nucleo_id           uuid not null references public.nuclei (id) on delete cascade,
  nome                text not null check (length(nome) between 1 and 40),
  icona               text not null default '🏷️',
  colore              text not null default '#64748b' check (colore ~ '^#[0-9a-fA-F]{6}$'),
  ordine              int  not null default 0,
  data_archiviazione  timestamptz,
  unique (nucleo_id, id)
);

-- Nome unico nel nucleo, senza distinguere maiuscole e minuscole
create unique index categorie_nome_unico
  on public.categorie (nucleo_id, lower(nome));

comment on table  public.categorie is
  'Categorie delle spese del nucleo (US-19). Non si cancellano se usate: si archiviano.';
comment on column public.categorie.id is 'Identificativo della categoria.';
comment on column public.categorie.nucleo_id is 'Il nucleo a cui appartiene la categoria.';
comment on column public.categorie.nome is 'Nome della categoria, unico nel nucleo (maiuscole ignorate).';
comment on column public.categorie.icona is 'Emoji mostrata accanto alla categoria.';
comment on column public.categorie.colore is 'Colore della categoria in formato #RRGGBB.';
comment on column public.categorie.ordine is 'Posizione nell''elenco: i numeri più bassi vengono prima.';
comment on column public.categorie.data_archiviazione is 'Quando la categoria è stata archiviata. Vuota = categoria in uso.';

-- Il budget del mese è la riga con valido_dal più recente <= mese (US-44).
-- importo_centesimi vuoto = "da questo mese nessun budget".
create table public.budget_categorie (
  id                 uuid primary key default gen_random_uuid(),
  nucleo_id          uuid not null,
  categoria_id       uuid not null,
  importo_centesimi  bigint check (importo_centesimi is null or importo_centesimi > 0),
  valido_dal         date not null check (extract(day from valido_dal) = 1),
  data_creazione     timestamptz not null default now(),
  unique (categoria_id, valido_dal),
  foreign key (nucleo_id, categoria_id)
    references public.categorie (nucleo_id, id) on delete cascade
);

create index budget_categorie_categoria
  on public.budget_categorie (nucleo_id, categoria_id);

comment on table  public.budget_categorie is
  'Tetto mensile di spesa per categoria (US-44). Ogni riga vale da valido_dal in poi, finché non arriva una riga più recente.';
comment on column public.budget_categorie.id is 'Identificativo della riga di budget.';
comment on column public.budget_categorie.nucleo_id is 'Il nucleo a cui appartiene il budget.';
comment on column public.budget_categorie.categoria_id is 'La categoria a cui si applica il budget.';
comment on column public.budget_categorie.importo_centesimi is
  'Tetto mensile in centesimi di euro. Vuoto = da quel mese nessun budget.';
comment on column public.budget_categorie.valido_dal is 'Primo mese di validità: sempre il giorno 1.';
comment on column public.budget_categorie.data_creazione is 'Quando è stata inserita la riga.';

-- ---------------------------------------------------------------------
-- 3. Spese
-- ---------------------------------------------------------------------
create table public.spese (
  id                 uuid primary key default gen_random_uuid(),
  nucleo_id          uuid not null references public.nuclei (id) on delete cascade,
  pagata_da          uuid not null,
  importo_centesimi  bigint not null check (importo_centesimi <> 0),      -- negativo = reso (US-18)
  divisione          text not null default 'a_meta'
                     check (divisione in ('a_meta', 'per_altra_persona')),  -- R2, R3
  descrizione        text check (descrizione is null or length(descrizione) <= 80),
  categoria_id       uuid,
  data_spesa         date not null default current_date,
  metodo_pagamento   text not null default 'carta'
                     check (metodo_pagamento in ('carta', 'contanti', 'bonifico')),
  note               text check (note is null or length(note) <= 500),
  -- Valuta estera: informativa, fa fede importo_centesimi in euro (US-17)
  valuta             char(3) not null default 'EUR' check (valuta ~ '^[A-Z]{3}$'),
  importo_originale  numeric(14, 2),
  tasso_cambio       numeric(14, 6) check (tasso_cambio is null or tasso_cambio > 0),
  -- Anticipo per terzi: fuori dal saldo di coppia (R5, US-25, US-26)
  terza_persona      text check (terza_persona is null or length(terza_persona) between 1 and 40),
  data_restituzione  date,
  autore             uuid,
  data_creazione     timestamptz not null default now(),
  data_modifica      timestamptz not null default now(),                  -- concorrenza ottimistica (NF-06)
  data_eliminazione  timestamptz,                                          -- Cestino (US-14)

  foreign key (nucleo_id, pagata_da)
    references public.membri (nucleo_id, id),
  foreign key (nucleo_id, categoria_id)
    references public.categorie (nucleo_id, id),
  foreign key (nucleo_id, autore)
    references public.membri (nucleo_id, id),

  constraint valuta_estera_coerente check (
    (valuta = 'EUR' and importo_originale is null and tasso_cambio is null)
    or (valuta <> 'EUR' and importo_originale is not null)
  ),
  constraint restituzione_solo_per_anticipi check (
    data_restituzione is null or terza_persona is not null
  ),
  constraint anticipo_sempre_a_meta check (
    terza_persona is null or divisione = 'a_meta'
  )
);

create index spese_nucleo_data
  on public.spese (nucleo_id, data_spesa desc)
  where data_eliminazione is null;
create index spese_categoria
  on public.spese (nucleo_id, categoria_id);
create index spese_pagata_da
  on public.spese (nucleo_id, pagata_da);
create index spese_controllo_doppioni
  on public.spese (nucleo_id, data_spesa, importo_centesimi)
  where data_eliminazione is null;                                        -- US-16

comment on table  public.spese is
  'Ogni spesa comune, reso (importo negativo) o anticipo per una terza persona.';
comment on column public.spese.id is 'Identificativo della spesa.';
comment on column public.spese.nucleo_id is 'Il nucleo a cui appartiene la spesa.';
comment on column public.spese.pagata_da is 'Il membro che ha pagato (id di membri, dello stesso nucleo).';
comment on column public.spese.importo_centesimi is
  'Importo in centesimi di euro: è il valore che fa fede per il saldo. Mai zero; negativo per un reso (US-18).';
comment on column public.spese.divisione is
  '''a_meta'' = 50/50, il centesimo dispari resta a chi ha pagato (R2, R4); ''per_altra_persona'' = tutto a carico di chi non ha pagato (R3).';
comment on column public.spese.descrizione is 'Descrizione facoltativa, per esempio "Esselunga" (al massimo 80 caratteri).';
comment on column public.spese.categoria_id is 'Categoria facoltativa (dello stesso nucleo).';
comment on column public.spese.data_spesa is 'Il giorno della spesa, anche nel passato (US-11).';
comment on column public.spese.metodo_pagamento is 'Come è stata pagata: carta, contanti o bonifico.';
comment on column public.spese.note is 'Nota libera facoltativa (al massimo 500 caratteri).';
comment on column public.spese.valuta is 'Codice ISO della valuta originale, per esempio EUR o USD (US-17).';
comment on column public.spese.importo_originale is
  'Importo nella valuta originale. Obbligatorio se la valuta non è EUR, vuoto se è EUR. Solo informativo.';
comment on column public.spese.tasso_cambio is 'Tasso di cambio usato, se noto. Solo informativo.';
comment on column public.spese.terza_persona is
  'Nome della persona esterna per cui si è anticipato (US-25). Se valorizzato la spesa non entra nel saldo di coppia (R5).';
comment on column public.spese.data_restituzione is
  'Quando la terza persona ha restituito i soldi (US-26). Solo per gli anticipi.';
comment on column public.spese.autore is
  'Il membro che ha inserito la spesa. Lo imposta il database con chi è collegato, il client non può sceglierlo.';
comment on column public.spese.data_creazione is 'Quando è stata inserita la spesa.';
comment on column public.spese.data_modifica is
  'Ultima modifica, aggiornata da un trigger. Serve a rifiutare il salvataggio se l''altra persona ha modificato nel frattempo (NF-06).';
comment on column public.spese.data_eliminazione is
  'Quando la spesa è stata spostata nel Cestino (US-14). Vuota = spesa attiva.';
comment on constraint valuta_estera_coerente on public.spese is
  'EUR: niente importo originale né tasso. Altra valuta: importo originale obbligatorio.';
comment on constraint restituzione_solo_per_anticipi on public.spese is
  'Si può segnare come restituita solo una spesa anticipata per una terza persona.';
comment on constraint anticipo_sempre_a_meta on public.spese is
  'Un anticipo per terzi non può essere anche "per l''altra persona".';

-- ---------------------------------------------------------------------
-- 4. Rimborsi tra i due membri
-- ---------------------------------------------------------------------
create table public.rimborsi (
  id                 uuid primary key default gen_random_uuid(),
  nucleo_id          uuid not null references public.nuclei (id) on delete cascade,
  da_membro          uuid not null,
  a_membro           uuid not null,
  importo_centesimi  bigint not null check (importo_centesimi > 0),
  data_rimborso      date not null default current_date,
  nota               text check (nota is null or length(nota) <= 200),
  autore             uuid,
  data_creazione     timestamptz not null default now(),
  data_modifica      timestamptz not null default now(),
  data_eliminazione  timestamptz,                                          -- annullamento (US-33)
  check (da_membro <> a_membro),
  foreign key (nucleo_id, da_membro) references public.membri (nucleo_id, id),
  foreign key (nucleo_id, a_membro)  references public.membri (nucleo_id, id),
  foreign key (nucleo_id, autore)    references public.membri (nucleo_id, id)
);

create index rimborsi_nucleo on public.rimborsi (nucleo_id, data_rimborso desc);
create index rimborsi_da     on public.rimborsi (nucleo_id, da_membro);
create index rimborsi_a      on public.rimborsi (nucleo_id, a_membro);

comment on table  public.rimborsi is
  'I soldi che una persona restituisce all''altra per pareggiare il saldo (US-31, US-32).';
comment on column public.rimborsi.id is 'Identificativo del rimborso.';
comment on column public.rimborsi.nucleo_id is 'Il nucleo a cui appartiene il rimborso.';
comment on column public.rimborsi.da_membro is 'Chi dà i soldi (di solito chi era in debito).';
comment on column public.rimborsi.a_membro is 'Chi riceve i soldi. Sempre diverso da da_membro.';
comment on column public.rimborsi.importo_centesimi is 'Importo in centesimi di euro, sempre positivo.';
comment on column public.rimborsi.data_rimborso is 'Il giorno del rimborso.';
comment on column public.rimborsi.nota is 'Nota facoltativa (al massimo 200 caratteri).';
comment on column public.rimborsi.autore is 'Il membro che ha registrato il rimborso. Lo imposta il database.';
comment on column public.rimborsi.data_creazione is 'Quando è stato registrato il rimborso.';
comment on column public.rimborsi.data_modifica is 'Ultima modifica, aggiornata da un trigger.';
comment on column public.rimborsi.data_eliminazione is
  'Quando il rimborso è stato annullato (US-33). Vuota = rimborso valido.';

-- ---------------------------------------------------------------------
-- 5. Cronologia delle modifiche (US-15, US-33, R6): scritta solo dai trigger
-- ---------------------------------------------------------------------
create table public.cronologia (
  id            bigint generated always as identity primary key,
  nucleo_id     uuid not null references public.nuclei (id) on delete cascade,
  tabella       text not null check (tabella in ('spese', 'rimborsi')),
  riga_id       uuid not null,
  azione        text not null check (azione in ('creazione', 'modifica', 'eliminazione', 'ripristino')),
  autore        uuid references public.membri (id),
  data_azione   timestamptz not null default now(),
  valori_prima  jsonb,
  valori_dopo   jsonb
);

create index cronologia_nucleo  on public.cronologia (nucleo_id, data_azione desc);
create index cronologia_riga    on public.cronologia (tabella, riga_id);
create index cronologia_autore  on public.cronologia (autore);

comment on table  public.cronologia is
  'Storico di ogni creazione, modifica, eliminazione e ripristino di spese e rimborsi. La scrivono solo i trigger (D9).';
comment on column public.cronologia.id is 'Numero progressivo della voce.';
comment on column public.cronologia.nucleo_id is 'Il nucleo a cui appartiene la voce.';
comment on column public.cronologia.tabella is 'Dove è avvenuta l''azione: ''spese'' oppure ''rimborsi''.';
comment on column public.cronologia.riga_id is 'L''id della spesa o del rimborso interessato.';
comment on column public.cronologia.azione is
  'creazione, modifica, eliminazione (spesa nel Cestino o rimborso annullato) oppure ripristino.';
comment on column public.cronologia.autore is 'Il membro che ha fatto l''azione.';
comment on column public.cronologia.data_azione is 'Quando è avvenuta l''azione.';
comment on column public.cronologia.valori_prima is 'La riga prima della modifica (vuoto per la creazione).';
comment on column public.cronologia.valori_dopo is 'La riga dopo la modifica.';

-- =====================================================================
-- Funzioni di supporto
-- =====================================================================

-- Il membro attivo che corrisponde all'utente collegato in quel nucleo
create function public.membro_corrente(p_nucleo_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.id from public.membri m
  where m.nucleo_id = p_nucleo_id and m.utente_id = auth.uid() and m.data_uscita is null
$$;

comment on function public.membro_corrente(uuid) is
  'Restituisce l''id del membro attivo che corrisponde all''utente collegato nel nucleo indicato, oppure niente.';

create function public.appartiene_al_nucleo(p_nucleo_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.membri m
    where m.nucleo_id = p_nucleo_id and m.utente_id = auth.uid() and m.data_uscita is null
  )
$$;

comment on function public.appartiene_al_nucleo(uuid) is
  'Vero se l''utente collegato è un membro attivo del nucleo. È la base di tutte le policy RLS.';

-- data_modifica aggiornata dal database, non dal client
create function public.aggiorna_data_modifica()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.data_modifica := now();
  return new;
end $$;

comment on function public.aggiorna_data_modifica() is
  'Trigger: imposta data_modifica all''ora attuale a ogni modifica della riga.';

create trigger spese_data_modifica    before update on public.spese
  for each row execute function public.aggiorna_data_modifica();
create trigger rimborsi_data_modifica before update on public.rimborsi
  for each row execute function public.aggiorna_data_modifica();

-- autore sempre = chi è collegato (non falsificabile dal client)
create function public.imposta_autore()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.autore := public.membro_corrente(new.nucleo_id);
  return new;
end $$;

comment on function public.imposta_autore() is
  'Trigger: all''inserimento imposta autore con il membro collegato, ignorando qualunque valore mandato dal client.';

create trigger spese_autore    before insert on public.spese
  for each row execute function public.imposta_autore();
create trigger rimborsi_autore before insert on public.rimborsi
  for each row execute function public.imposta_autore();

-- Cronologia: creazione / modifica / eliminazione (data_eliminazione
-- valorizzata) / ripristino (data_eliminazione svuotata)
create function public.registra_cronologia()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_azione text;
begin
  if tg_op = 'INSERT' then
    v_azione := 'creazione';
  elsif old.data_eliminazione is null and new.data_eliminazione is not null then
    v_azione := 'eliminazione';
  elsif old.data_eliminazione is not null and new.data_eliminazione is null then
    v_azione := 'ripristino';
  else
    v_azione := 'modifica';
  end if;

  insert into public.cronologia
    (nucleo_id, tabella, riga_id, azione, autore, valori_prima, valori_dopo)
  values (
    new.nucleo_id, tg_table_name, new.id, v_azione,
    public.membro_corrente(new.nucleo_id),
    case when tg_op = 'UPDATE' then to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end $$;

comment on function public.registra_cronologia() is
  'Trigger: scrive in cronologia ogni inserimento e modifica di spese e rimborsi, con i valori prima e dopo.';

create trigger spese_cronologia    after insert or update on public.spese
  for each row execute function public.registra_cronologia();
create trigger rimborsi_cronologia after insert or update on public.rimborsi
  for each row execute function public.registra_cronologia();

-- =====================================================================
-- Funzioni chiamate dall'app (RPC): anteprima dell'invito, creare il nucleo,
-- entrare con l'invito
-- =====================================================================

-- Anteprima dell'invito PRIMA dell'accesso (D14, schermata 03a).
-- Chiamabile anche da anon: la RLS non farebbe leggere nulla a chi non ha
-- fatto l'accesso. Restituisce solo il minimo indispensabile:
--   * nessuna riga        → invito non valido (P0002)
--   * completo = true     → nucleo completo (P0001), nomi nascosti
--   * altrimenti          → nome del nucleo e di chi invita
-- Il codice ha 128 bit casuali: indovinarlo non è praticabile.
create function public.anteprima_invito(p_codice_invito text)
returns table (nome_nucleo text, nome_invitante text, completo boolean)
language sql stable security definer set search_path = ''
as $$
  with n as (
    select nn.id, nn.nome,
           (select count(*) from public.membri m
             where m.nucleo_id = nn.id and m.data_uscita is null) >= 2 as pieno
    from public.nuclei nn
    where nn.codice_invito = p_codice_invito
  )
  select
    case when n.pieno then null else n.nome end,
    case when n.pieno then null else
      (select m.nome_visualizzato from public.membri m
        where m.nucleo_id = n.id and m.data_uscita is null
        order by m.data_ingresso limit 1)
    end,
    n.pieno
  from n
$$;

comment on function public.anteprima_invito(text) is
  'Anteprima della pagina d''invito, anche senza accesso (D14). Nessuna riga = invito non valido; completo = nucleo pieno, nomi nascosti; altrimenti nome del nucleo e di chi invita.';

create function public.crea_nucleo(p_nome_visualizzato text, p_nome_nucleo text default 'Casa nostra')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_nucleo uuid;
begin
  if auth.uid() is null then
    raise exception 'Accesso richiesto' using errcode = '28000';
  end if;

  if exists (select 1 from public.membri
             where utente_id = auth.uid() and data_uscita is null) then
    raise exception 'Fai già parte di un nucleo' using errcode = 'P0003';
  end if;

  insert into public.nuclei (nome) values (p_nome_nucleo) returning id into v_nucleo;
  insert into public.membri (nucleo_id, utente_id, nome_visualizzato)
    values (v_nucleo, auth.uid(), p_nome_visualizzato);
  return v_nucleo;
end $$;

comment on function public.crea_nucleo(text, text) is
  'Crea un nucleo e ci inserisce l''utente collegato come primo membro. Errore P0003 se fa già parte di un nucleo.';

create function public.entra_nel_nucleo(p_codice_invito text, p_nome_visualizzato text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_nucleo uuid;
  v_attivi int;
begin
  if auth.uid() is null then
    raise exception 'Accesso richiesto' using errcode = '28000';
  end if;

  select id into v_nucleo from public.nuclei
    where codice_invito = p_codice_invito
    for update;                                   -- evita due ingressi simultanei
  if v_nucleo is null then
    raise exception 'Invito non valido' using errcode = 'P0002';
  end if;

  -- Già membro di questo nucleo: nessun errore, si entra e basta
  if exists (select 1 from public.membri
             where nucleo_id = v_nucleo and utente_id = auth.uid() and data_uscita is null) then
    return v_nucleo;
  end if;

  -- Già in un ALTRO nucleo: una persona sta in un solo nucleo
  if exists (select 1 from public.membri
             where utente_id = auth.uid() and data_uscita is null) then
    raise exception 'Fai già parte di un nucleo' using errcode = 'P0003';
  end if;

  select count(*) into v_attivi from public.membri
    where nucleo_id = v_nucleo and data_uscita is null;
  if v_attivi >= 2 then
    raise exception 'Il nucleo è già completo' using errcode = 'P0001';  -- US-02
  end if;

  insert into public.membri (nucleo_id, utente_id, nome_visualizzato)
    values (v_nucleo, auth.uid(), p_nome_visualizzato);
  return v_nucleo;
end $$;

comment on function public.entra_nel_nucleo(text, text) is
  'Fa entrare l''utente collegato nel nucleo del codice d''invito. Errori: P0002 invito non valido, P0003 già in un altro nucleo, P0001 nucleo completo.';

-- Le funzioni di supporto non servono a chi non ha fatto l'accesso
revoke execute on function public.appartiene_al_nucleo(uuid) from public, anon;
revoke execute on function public.membro_corrente(uuid)      from public, anon;
grant  execute on function public.appartiene_al_nucleo(uuid) to authenticated;
grant  execute on function public.membro_corrente(uuid)      to authenticated;

revoke execute on function public.crea_nucleo(text, text)      from public, anon;
revoke execute on function public.entra_nel_nucleo(text, text) from public, anon;
grant  execute on function public.crea_nucleo(text, text)      to authenticated;
grant  execute on function public.entra_nel_nucleo(text, text) to authenticated;

-- L'anteprima dell'invito è l'unica funzione aperta anche ad anon (D14)
revoke execute on function public.anteprima_invito(text) from public;
grant  execute on function public.anteprima_invito(text) to anon, authenticated;

-- =====================================================================
-- Row Level Security (NF-05): attiva su OGNI tabella
-- =====================================================================
alter table public.nuclei           enable row level security;
alter table public.membri           enable row level security;
alter table public.categorie        enable row level security;
alter table public.budget_categorie enable row level security;
alter table public.spese            enable row level security;
alter table public.rimborsi         enable row level security;
alter table public.cronologia       enable row level security;

-- Nucleo: si legge e si rinomina; si crea solo con crea_nucleo()
create policy "membri leggono il nucleo" on public.nuclei
  for select to authenticated using (public.appartiene_al_nucleo(id));
create policy "membri rinominano il nucleo" on public.nuclei
  for update to authenticated
  using (public.appartiene_al_nucleo(id)) with check (public.appartiene_al_nucleo(id));

-- Membri: ognuno vede i membri del proprio nucleo e modifica solo il proprio profilo
create policy "membri leggono i membri" on public.membri
  for select to authenticated using (public.appartiene_al_nucleo(nucleo_id));
create policy "ognuno modifica il proprio profilo" on public.membri
  for update to authenticated
  using (utente_id = (select auth.uid()))
  with check (utente_id = (select auth.uid()));

-- Categorie e budget: lettura e scrittura per i membri (archiviazione, non cancellazione)
create policy "membri gestiscono le categorie" on public.categorie
  for all to authenticated
  using (public.appartiene_al_nucleo(nucleo_id)) with check (public.appartiene_al_nucleo(nucleo_id));
create policy "membri gestiscono i budget" on public.budget_categorie
  for all to authenticated
  using (public.appartiene_al_nucleo(nucleo_id)) with check (public.appartiene_al_nucleo(nucleo_id));

-- Spese e rimborsi: niente DELETE vero (si usa data_eliminazione), quindi nessuna policy delete
create policy "membri leggono le spese" on public.spese
  for select to authenticated using (public.appartiene_al_nucleo(nucleo_id));
create policy "membri inseriscono spese" on public.spese
  for insert to authenticated with check (public.appartiene_al_nucleo(nucleo_id));
create policy "membri modificano spese" on public.spese
  for update to authenticated
  using (public.appartiene_al_nucleo(nucleo_id)) with check (public.appartiene_al_nucleo(nucleo_id));

create policy "membri leggono i rimborsi" on public.rimborsi
  for select to authenticated using (public.appartiene_al_nucleo(nucleo_id));
create policy "membri inseriscono rimborsi" on public.rimborsi
  for insert to authenticated with check (public.appartiene_al_nucleo(nucleo_id));
create policy "membri annullano rimborsi" on public.rimborsi
  for update to authenticated
  using (public.appartiene_al_nucleo(nucleo_id)) with check (public.appartiene_al_nucleo(nucleo_id));

-- Cronologia: solo lettura
create policy "membri leggono la cronologia" on public.cronologia
  for select to authenticated using (public.appartiene_al_nucleo(nucleo_id));

-- =====================================================================
-- Permessi per colonna: la RLS dice QUALI righe, questi COSA si può cambiare.
-- Senza, un membro potrebbe cambiare il proprio nucleo_id ed entrare in
-- un altro nucleo, o riscrivere autore e nucleo_id di una spesa.
-- =====================================================================
-- TRUNCATE ignora la RLS: nessuno dei ruoli dell'API deve poterlo usare
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

revoke insert, update, delete on public.nuclei     from anon, authenticated;
revoke insert, update, delete on public.membri     from anon, authenticated;
revoke insert, update, delete on public.cronologia from anon, authenticated;
revoke insert, update, delete on public.spese      from anon, authenticated;
revoke insert, update, delete on public.rimborsi   from anon, authenticated;

-- In inserimento il client non sceglie id, autore, data_creazione,
-- data_modifica, data_eliminazione
grant insert (nucleo_id, pagata_da, importo_centesimi, divisione, descrizione, categoria_id,
              data_spesa, metodo_pagamento, note, valuta, importo_originale, tasso_cambio,
              terza_persona, data_restituzione)
                                                on public.spese    to authenticated;
grant insert (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso, nota)
                                                on public.rimborsi to authenticated;

grant update (nome)                              on public.nuclei   to authenticated;
grant update (nome_visualizzato, link_pagamento) on public.membri   to authenticated;
grant update (pagata_da, importo_centesimi, divisione, descrizione, categoria_id, data_spesa,
              metodo_pagamento, note, valuta, importo_originale, tasso_cambio,
              terza_persona, data_restituzione, data_eliminazione)
                                                on public.spese    to authenticated;
grant update (nota, data_eliminazione)           on public.rimborsi to authenticated;

-- =====================================================================
-- Viste di calcolo (security_invoker: rispettano la RLS di chi interroga)
-- =====================================================================

-- Quanto spetta all'ALTRA persona per ogni spesa che entra nel saldo.
-- 50/50: divisione intera troncata verso zero, il centesimo dispari resta
-- a chi ha pagato (R4), anche per i resi negativi. 100/0: tutto all'altra.
create view public.quote_spese
with (security_invoker = true) as
select
  s.id,
  s.nucleo_id,
  s.pagata_da,
  s.importo_centesimi,
  case s.divisione
    when 'a_meta'            then s.importo_centesimi / 2
    when 'per_altra_persona' then s.importo_centesimi
  end as quota_altra_persona_centesimi
from public.spese s
where s.data_eliminazione is null
  and s.terza_persona is null;

comment on view public.quote_spese is
  'Per ogni spesa che entra nel saldo (esclusi Cestino e anticipi per terzi), la quota a carico di chi non ha pagato (D6).';
comment on column public.quote_spese.quota_altra_persona_centesimi is
  'Quota dell''altra persona in centesimi: metà troncata verso lo zero (10,01 € → 5,00 €) oppure l''intero importo.';

-- Saldo per membro: positivo = l'altra persona gli deve questi centesimi
create view public.saldi
with (security_invoker = true) as
select
  m.nucleo_id,
  m.id as membro_id,
  m.nome_visualizzato,
  coalesce((select sum(q.quota_altra_persona_centesimi) from public.quote_spese q
            where q.nucleo_id = m.nucleo_id and q.pagata_da = m.id), 0)
  - coalesce((select sum(q.quota_altra_persona_centesimi) from public.quote_spese q
              where q.nucleo_id = m.nucleo_id and q.pagata_da <> m.id), 0)
  + coalesce((select sum(r.importo_centesimi) from public.rimborsi r
              where r.nucleo_id = m.nucleo_id and r.da_membro = m.id
                and r.data_eliminazione is null), 0)
  - coalesce((select sum(r.importo_centesimi) from public.rimborsi r
              where r.nucleo_id = m.nucleo_id and r.a_membro = m.id
                and r.data_eliminazione is null), 0)
  as saldo_centesimi
from public.membri m;

comment on view public.saldi is
  'Saldo di ogni membro. I saldi dei due membri sono sempre uno l''opposto dell''altro (US-30).';
comment on column public.saldi.membro_id is 'Il membro a cui si riferisce il saldo.';
comment on column public.saldi.saldo_centesimi is
  'Positivo = l''altra persona deve a questo membro la cifra indicata; negativo = questo membro deve all''altra.';

-- Speso del mese per categoria + budget valido in quel mese (US-40, US-44)
create view public.spesa_mensile_per_categoria
with (security_invoker = true) as
with speso as (
  select s.nucleo_id, s.categoria_id,
         date_trunc('month', s.data_spesa)::date as mese,
         sum(s.importo_centesimi) as speso_centesimi
  from public.spese s
  where s.data_eliminazione is null and s.terza_persona is null
  group by 1, 2, 3
)
select
  sp.nucleo_id, sp.categoria_id, sp.mese, sp.speso_centesimi,
  (select b.importo_centesimi from public.budget_categorie b
   where b.categoria_id = sp.categoria_id and b.valido_dal <= sp.mese
   order by b.valido_dal desc limit 1) as budget_centesimi
from speso sp;

comment on view public.spesa_mensile_per_categoria is
  'Totale speso per categoria e mese, con il budget valido in quel mese. Esclusi Cestino e anticipi per terzi; i resi riducono lo speso.';
comment on column public.spesa_mensile_per_categoria.mese is 'Il mese, indicato dal suo giorno 1.';
comment on column public.spesa_mensile_per_categoria.speso_centesimi is 'Totale speso nel mese in centesimi (importo intero delle spese, non la quota).';
comment on column public.spesa_mensile_per_categoria.budget_centesimi is 'Il budget valido in quel mese, vuoto se non c''è.';