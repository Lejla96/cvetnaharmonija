-- Site settings: key-value store for all editable content
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings enable row level security;

create policy "Anyone can read settings"
  on public.site_settings for select using (true);

create policy "Authenticated users can update settings"
  on public.site_settings for update using (auth.role() = 'authenticated');

create policy "Authenticated users can insert settings"
  on public.site_settings for insert with check (auth.role() = 'authenticated');

-- Gallery images
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title_mk text not null default '',
  title_en text not null default '',
  description_mk text not null default '',
  description_en text not null default '',
  position int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.gallery_images enable row level security;

create policy "Anyone can read gallery"
  on public.gallery_images for select using (true);

create policy "Authenticated users can insert gallery"
  on public.gallery_images for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update gallery"
  on public.gallery_images for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete gallery"
  on public.gallery_images for delete using (auth.role() = 'authenticated');

-- Storage bucket for gallery images
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "Public read gallery bucket"
  on storage.objects for select using (bucket_id = 'gallery');

create policy "Auth upload gallery bucket"
  on storage.objects for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

create policy "Auth delete gallery bucket"
  on storage.objects for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');

-- Seed default settings from the current site
insert into public.site_settings (key, value) values
  ('brand_name', 'PetShop Skopje'),
  ('phone', '+389 70 123 456'),
  ('email', 'bookings@petshopskopje.mk'),
  ('address', 'Crvena Voda br.37'),
  ('city', '1000 Skopje'),
  ('country_mk', 'Северна Македонија'),
  ('country_en', 'North Macedonia'),
  ('working_hours', '09:00 - 19:00'),
  ('working_days_mk', 'Понеделник - Сабота'),
  ('working_days_en', 'Monday - Saturday'),
  ('hero_title_mk', 'Професионален grooming салон за кучиња и мачки.'),
  ('hero_title_en', 'Professional grooming salon for dogs and cats.'),
  ('hero_desc_mk', 'Во <strong>PetShop Skopje</strong> нудиме капење, шишање, четкање, сечење нокти и целосен grooming третман за вашите миленици. Цените се движат од <strong>50 EUR</strong> до <strong>150 EUR</strong>, со одделни пакети за кучиња и мачки и брзо онлајн закажување.'),
  ('hero_desc_en', 'At <strong>PetShop Skopje</strong>, we provide bathing, trimming, brushing, nail care, and full grooming treatments for your pets. Prices range from <strong>50 EUR</strong> to <strong>150 EUR</strong>, with separate packages for dogs and cats and a fast online booking flow.'),
  ('color_primary', '#ff4fa3'),
  ('color_primary_dark', '#e0187d'),
  ('color_secondary', '#7b1451'),
  ('color_accent', '#ffd0e7'),
  ('color_bg', '#fff3fb'),
  ('map_query', 'Crvena Voda 37, Skopje')
on conflict (key) do nothing;
