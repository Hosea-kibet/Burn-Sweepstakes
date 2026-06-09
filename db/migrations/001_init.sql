create extension if not exists pgcrypto;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  department text not null,
  phone text not null,
  location text not null,
  team_preferences text[] not null,
  assigned_team text,
  assignment_rank integer,
  payment_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'eliminated', 'winner')),
  elimination_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_preferences_count check (cardinality(team_preferences) between 1 and 3)
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists participants_set_updated_at on participants;
create trigger participants_set_updated_at
before update on participants
for each row
execute function set_updated_at();
