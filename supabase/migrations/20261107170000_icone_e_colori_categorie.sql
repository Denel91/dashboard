-- =====================================================================
-- Icone e colori delle categorie (Fase 3, D18) · 7 novembre 2026
--
-- I wireframe v2.2 (tavole 13a e 13b) e le linee guida iOS 27 usano icone
-- a linea in un quadratino colorato, scelte da un elenco fisso, non emoji.
-- Da qui categorie.icona contiene il NOME di un'icona (lo stesso della
-- libreria Lucide usata dall'app: 'shopping-cart', 'house'…), e il colore
-- predefinito è il grigio della tavolozza delle categorie.
-- L'elenco delle icone e dei colori ammessi lo controlla l'app (Zod):
-- il database controlla solo la forma, così aggiungere un'icona non
-- richiede una migrazione.
-- =====================================================================

-- Eventuali righe con un'emoji (dati di prova) passano all'icona generica
update public.categorie
   set icona = 'tag'
 where icona !~ '^[a-z][a-z0-9-]{0,39}$';

alter table public.categorie
  alter column icona drop default,
  alter column colore set default '#8b8b91',
  add constraint categorie_icona_valida
    check (icona ~ '^[a-z][a-z0-9-]{0,39}$');

comment on column public.categorie.icona is
  'Nome dell''icona della categoria, per esempio ''shopping-cart'' o ''house'' (minuscole, cifre e trattini). Elenco ammesso nell''app (D18).';
comment on column public.categorie.colore is
  'Colore della categoria in formato #RRGGBB, scelto dalla tavolozza delle linee guida (mai il blu e il rosa delle persone, D17).';
comment on constraint categorie_icona_valida on public.categorie is
  'L''icona è un nome (minuscole, cifre, trattini), non un''emoji.';
