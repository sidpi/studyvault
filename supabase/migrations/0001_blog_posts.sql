-- Blog posts: news, events, course links, and competition updates.
-- Run this in the Supabase SQL editor.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('news', 'event', 'course', 'competition')),
  body text not null,
  link text,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null default 'Member',
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Authenticated members can read posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "Authenticated members can create posts"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "Authors can update their own posts"
  on public.posts for update
  to authenticated
  using (author_id = auth.uid());

create policy "Authors can delete their own posts"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());