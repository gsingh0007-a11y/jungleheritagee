create table if not exists public.experiences (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  title text not null,
  description text null,
  image_url text null,
  category text null,
  slug text not null,
  constraint experiences_pkey primary key (id),
  constraint experiences_slug_key unique (slug)
);

alter table public.experiences enable row level security;

create policy "Enable read access for all users"
on "public"."experiences"
as PERMISSIVE
for SELECT
to public
using (
  true
);

create policy "Enable insert for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for INSERT
to authenticated
with check (
  true
);

create policy "Enable update for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for UPDATE
to authenticated
using (
  true
);

create policy "Enable delete for authenticated users only"
on "public"."experiences"
as PERMISSIVE
for DELETE
to authenticated
using (
  true
);
