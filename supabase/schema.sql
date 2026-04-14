create extension if not exists pgcrypto;

create table if not exists public.pet_owner_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  phone_number text not null,
  email text not null,
  pet_name text not null,
  language text not null default 'mk',
  source text not null default 'website',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists pet_owner_contacts_created_at_idx
  on public.pet_owner_contacts (created_at desc);

create index if not exists pet_owner_contacts_email_idx
  on public.pet_owner_contacts (email);

alter table public.pet_owner_contacts enable row level security;
