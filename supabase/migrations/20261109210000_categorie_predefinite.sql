-- =====================================================================
-- Categorie predefinite (T-21, US-19, D24) · 9 novembre 2026
--
-- Ricavate dagli estratti conto di gennaio–novembre 2026 e decise in
-- coppia il 9 novembre. 20 categorie in 8 famiglie: il COLORE dice la
-- famiglia (casa, utenze, trasporti…), l'ICONA dice la voce (D24).
-- L'ordine mette prima quelle che si usano più spesso, perché Nuova
-- spesa mostra le prime e raccoglie le altre in "Altre categorie".
--
-- Le crea crea_nucleo(), insieme al nucleo. I nuclei che esistono già e
-- non hanno categorie le ricevono qui sotto.
-- =====================================================================

create function public.crea_categorie_predefinite(p_nucleo_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.categorie (nucleo_id, nome, icona, colore, ordine)
  select p_nucleo_id, c.nome, c.icona, c.colore, c.ordine
  from (values
    -- le più usate, in cima a Nuova spesa
    ('Spesa',               'shopping-cart',  '#299f47',  1),
    ('Ristoranti e bar',    'utensils',       '#cc7700',  2),
    ('Mezzi pubblici',      'bus-front',      '#2a98ac',  3),
    ('Carburante',          'fuel',           '#2a98ac',  4),
    ('Arredamento',         'sofa',           '#a2845e',  5),
    ('Svago',               'ticket',         '#009c93',  6),
    ('Salute',              'bandage',        '#ff4838',  7),
    ('Abbigliamento',       'shirt',          '#ff4838',  8),
    -- spese fisse e meno frequenti
    ('Affitto',             'key-round',      '#a2845e',  9),
    ('Condominio',          'building-2',     '#a2845e', 10),
    ('Luce',                'lightbulb',      '#af8404', 11),
    ('Gas',                 'flame',          '#af8404', 12),
    ('Acqua',               'droplet',        '#af8404', 13),
    ('Internet e telefono', 'wifi',           '#af8404', 14),
    ('Pedaggi e parcheggi', 'circle-parking', '#2a98ac', 15),
    ('Auto',                'wrench',         '#2a98ac', 16),
    ('Viaggi',              'plane',          '#009c93', 17),
    ('Abbonamenti',         'tv',             '#009c93', 18),
    ('Regali',              'gift',           '#ff4838', 19),
    ('Altro',               'tag',            '#8b8b91', 20)
  ) as c (nome, icona, colore, ordine)
  -- se una categoria con lo stesso nome c'è già, si lascia quella
  on conflict (nucleo_id, lower(nome)) do nothing;
$$;

comment on function public.crea_categorie_predefinite(uuid) is
  'Inserisce nel nucleo le 20 categorie predefinite (T-21, D24). Uso interno: la chiama crea_nucleo().';

-- Solo per uso interno: nessun ruolo dell'API la chiama direttamente
revoke execute on function public.crea_categorie_predefinite(uuid) from public, anon, authenticated;

-- crea_nucleo() come prima, più le categorie predefinite.
-- create or replace conserva i permessi già dati (solo authenticated).
create or replace function public.crea_nucleo(p_nome_visualizzato text, p_nome_nucleo text default 'Casa nostra')
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
  perform public.crea_categorie_predefinite(v_nucleo);
  return v_nucleo;
end $$;

comment on function public.crea_nucleo(text, text) is
  'Crea un nucleo con le categorie predefinite e ci inserisce l''utente collegato come primo membro. Errore P0003 se fa già parte di un nucleo.';

-- Nuclei creati prima di questa migrazione (staging, database locali)
select public.crea_categorie_predefinite(n.id)
from public.nuclei n
where not exists (select 1 from public.categorie c where c.nucleo_id = n.id);

-- Commento rimasto dalla v1.3: l'icona non è più un'emoji (D18)
comment on column public.categorie.icona is
  'Nome dell''icona della categoria (libreria Lucide), per esempio ''shopping-cart'' o ''key-round''. Elenco ammesso nell''app (D18, D24).';
