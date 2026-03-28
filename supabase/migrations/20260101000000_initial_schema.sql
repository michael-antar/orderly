-- Initial schema replicated from what is already in Supabase


-- ENUMS --

CREATE TYPE IF NOT EXISTS public.item_category AS ENUM (
  'restaurant',
  'movie',
  'book',
  'show',
  'album'
);

CREATE TYPE IF NOT EXISTS public.item_status AS ENUM (
  'ranked',
  'backlog'
);

CREATE TYPE IF NOT EXISTS public.price_range AS ENUM (
  '$',
  '$$',
  '$$$',
  '$$$$'
);


-- Tables --

CREATE TABLE IF NOT EXISTS public.category_definitions (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name              text        NOT NULL,
  icon              text,
  field_definitions jsonb       NOT NULL DEFAULT '[]'::jsonb,
  user_id           uuid        REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.category_definitions ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.items (
  id               uuid               NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text               NOT NULL,
  description      text,
  category_def_id  uuid               REFERENCES public.category_definitions (id) ON DELETE CASCADE,
  properties       jsonb,
  rating           numeric,
  rd               numeric            NOT NULL DEFAULT 350,
  comparison_count integer            NOT NULL DEFAULT 0,
  created_at       timestamptz        NOT NULL DEFAULT now(),
  last_compared_at timestamptz,
  status           public.item_status NOT NULL DEFAULT 'backlog',
  user_id          uuid               NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.comparisons (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz NOT NULL DEFAULT now(),
  winner_id            uuid        NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  loser_id             uuid        NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  winner_rating_before numeric     NOT NULL,
  winner_rating_after  numeric     NOT NULL,
  loser_rating_before  numeric     NOT NULL,
  loser_rating_after   numeric     NOT NULL,
  winner_rd_before     numeric,
  winner_rd_after      numeric,
  loser_rd_before      numeric,
  loser_rd_after       numeric,
  user_id              uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.tags (
  id              integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            text    NOT NULL,
  category_def_id uuid    NOT NULL REFERENCES public.category_definitions (id) ON DELETE CASCADE,
  user_id         uuid    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.item_tags (
  item_id uuid    NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
  tag_id  integer NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
