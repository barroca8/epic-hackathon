create table triples (
  id bigint generated always as identity primary key,
  subject text not null,
  predicate text not null,
  object text not null,
  weight numeric default 1,
  circle text,
  source text,
  created_at timestamptz default now()
);
create index on triples (subject, predicate);
create index on triples (object, predicate);
alter table triples enable row level security;
create policy "anon read" on triples for select to anon using (true);
create policy "anon insert" on triples for insert to anon with check (true);
alter publication supabase_realtime add table triples;
