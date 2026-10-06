create table palabras (
  id uuid primary key default gen_random_uuid(),
  sesion text not null check (sesion ~ '^[a-z0-9-]{1,40}$'),
  texto text not null check (texto ~ '^[a-záéíóúüñ]{2,20}$'),
  fase smallint not null default 1 check (fase in (1, 3)),
  created_at timestamptz not null default now()
);

create index palabras_sesion_idx on palabras (sesion, created_at);

alter table palabras enable row level security;

create policy "insertar anon" on palabras
  for insert to anon with check (true);

create policy "leer anon" on palabras
  for select to anon using (true);

alter publication supabase_realtime add table palabras;
