-- Year → Semester → Subject structure with the two fixed folders:
-- "Notes" and "Reference Books".
-- Run this in the Supabase SQL editor.

-- 1) Remove the old demo subjects, categories, materials, and bookmarks.
truncate table public.bookmarks, public.materials, public.categories, public.subjects cascade;

-- 2) Every subject belongs to a year (1-5) and a semester (1-2).
alter table public.subjects
  add column if not exists year int not null default 1 check (year between 1 and 5),
  add column if not exists semester int not null default 1 check (semester between 1 and 2);

alter table public.subjects drop constraint if exists subjects_name_key;
alter table public.subjects drop constraint if exists subjects_year_semester_name_key;
alter table public.subjects
  add constraint subjects_year_semester_name_key unique (year, semester, name);

-- 3) Row level security: every member can read the library,
--    only uploaders and super admins can change it.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'subjects' and policyname = 'Members can read subjects') then
    create policy "Members can read subjects"
      on public.subjects for select
      to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'subjects' and policyname = 'Uploaders and admins manage subjects') then
    create policy "Uploaders and admins manage subjects"
      on public.subjects for all
      to authenticated
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('uploader', 'super_admin')))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('uploader', 'super_admin')));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'Members can read categories') then
    create policy "Members can read categories"
      on public.categories for select
      to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'Uploaders and admins manage categories') then
    create policy "Uploaders and admins manage categories"
      on public.categories for all
      to authenticated
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('uploader', 'super_admin')))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('uploader', 'super_admin')));
  end if;
end $$;

-- 4) Creating a subject automatically creates its two folders.
create or replace function public.create_subject_folders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (subject_id, name)
  values (new.id, 'Notes'), (new.id, 'Reference Books');
  return new;
end;
$$;

drop trigger if exists subjects_create_folders on public.subjects;
create trigger subjects_create_folders
  after insert on public.subjects
  for each row execute function public.create_subject_folders();
