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

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  email text not null,
  phone_number text not null,
  pet_name text not null,
  pet_type text not null,
  service text not null,
  appointment_date date not null,
  appointment_time text not null,
  notes text not null default '',
  language text not null default 'mk',
  source text not null default 'website',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists appointment_requests_created_at_idx
  on public.appointment_requests (created_at desc);

create index if not exists appointment_requests_reference_idx
  on public.appointment_requests (reference);

create index if not exists appointment_requests_email_idx
  on public.appointment_requests (email);

alter table public.appointment_requests enable row level security;
