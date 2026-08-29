
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Logan',
  seeded boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  emoji text not null default '✅',
  category text not null default 'life',
  frequency text not null default 'daily',
  target_per_week int not null default 7,
  weight int not null default 1,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.habits to authenticated;
grant all on public.habits to service_role;
alter table public.habits enable row level security;
create policy "own habits" on public.habits for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  date date not null default current_date,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
grant select, insert, update, delete on public.habit_logs to authenticated;
grant all on public.habit_logs to service_role;
alter table public.habit_logs enable row level security;
create policy "own habit logs" on public.habit_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  description text,
  deadline date,
  priority int not null default 2,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "own projects" on public.projects for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  notes text,
  date date,
  priority int not null default 2,
  done boolean not null default false,
  done_at timestamptz,
  project_id uuid references public.projects on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "own tasks" on public.tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null default 'personal',
  description text,
  deadline date,
  target_value numeric,
  current_value numeric not null default 0,
  unit text,
  priority int not null default 2,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.goals to authenticated;
grant all on public.goals to service_role;
alter table public.goals enable row level security;
create policy "own goals" on public.goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  type text not null default 'personal',
  date date not null,
  end_date date,
  time text,
  location text,
  notes text,
  is_milestone boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "own events" on public.events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  professor text,
  location text,
  meeting_times text,
  term text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.classes to authenticated;
grant all on public.classes to service_role;
alter table public.classes enable row level security;
create policy "own classes" on public.classes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  kind text not null default 'checking',
  balance numeric not null default 0,
  is_savings boolean not null default false,
  sort_order int not null default 0
);
grant select, insert, update, delete on public.accounts to authenticated;
grant all on public.accounts to service_role;
alter table public.accounts enable row level security;
create policy "own accounts" on public.accounts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  amount numeric not null,
  kind text not null default 'expense',
  category text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  hours numeric not null default 0,
  earnings numeric not null default 0,
  miles numeric,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.work_shifts to authenticated;
grant all on public.work_shifts to service_role;
alter table public.work_shifts enable row level security;
create policy "own shifts" on public.work_shifts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null default current_date,
  vape_free boolean,
  weed_night_only boolean,
  exercise_minutes int not null default 0,
  mood int,
  notes text,
  productivity_score int,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
grant select, insert, update, delete on public.daily_logs to authenticated;
grant all on public.daily_logs to service_role;
alter table public.daily_logs enable row level security;
create policy "own daily logs" on public.daily_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.change_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  summary text not null,
  detail text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.change_log to authenticated;
grant all on public.change_log to service_role;
alter table public.change_log enable row level security;
create policy "own change log" on public.change_log for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "own chat" on public.chat_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.seed_life_os()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  if exists (select 1 from public.profiles where id = uid and seeded) then return; end if;

  insert into public.habits (user_id, name, emoji, category, frequency, target_per_week, weight, sort_order) values
    (uid,'Wake up at a reasonable time','🌅','morning','daily',7,2,1),
    (uid,'No weed before evening','🌙','morning','daily',7,3,2),
    (uid,'Shower','🚿','morning','daily',7,2,3),
    (uid,'Eat a real meal','🍽️','morning','daily',7,2,4),
    (uid,'Drink water','💧','morning','daily',7,1,5),
    (uid,'Out of bed before 10','⏰','morning','daily',7,2,6),
    (uid,'Work Uber Eats','💰','money','weekly',5,3,7),
    (uid,'Exercise','🏃','fitness','weekly',4,3,8),
    (uid,'Walk 20+ minutes','🚶','fitness','daily',7,1,9),
    (uid,'Clean / tidy','🧹','life','daily',7,1,10),
    (uid,'Laundry','🧺','life','weekly',1,1,11),
    (uid,'Fraternity responsibility','🏠','life','weekly',3,1,12),
    (uid,'Did not buy a vape','🚭','vape','daily',7,4,13),
    (uid,'Vape-free day','🫁','vape','daily',7,4,14),
    (uid,'Responsibilities done before weed','✅','night','daily',7,3,15),
    (uid,'Wind down / bed at reasonable time','😴','night','daily',7,2,16);

  insert into public.projects (user_id, name, description, deadline, priority)
  values (uid,'Move Fraternity Room','Move rooms at Delta Chi before the Sept 4 trip.', date '2026-09-03', 1)
  returning id into pid;

  insert into public.tasks (user_id, title, project_id, priority, sort_order) values
    (uid,'Sort belongings',pid,1,1),
    (uid,'Trash / recycle',pid,2,2),
    (uid,'Laundry',pid,1,3),
    (uid,'Pack clothes',pid,1,4),
    (uid,'Pack bathroom items',pid,2,5),
    (uid,'Pack electronics',pid,2,6),
    (uid,'Pack miscellaneous items',pid,3,7),
    (uid,'Move belongings',pid,1,8),
    (uid,'Clean old room',pid,1,9),
    (uid,'Set up new room',pid,2,10),
    (uid,'Final check',pid,3,11);

  insert into public.tasks (user_id, title, date, priority, sort_order) values
    (uid,'Shower', current_date, 1, 1),
    (uid,'Start laundry', current_date, 1, 2),
    (uid,'Work Uber Eats', current_date, 1, 3),
    (uid,'Exercise / walk', current_date, 2, 4),
    (uid,'Clean room', current_date, 2, 5),
    (uid,'Eat a real meal', current_date, 1, 6),
    (uid,'Do not buy a vape', current_date, 1, 7);

  insert into public.goals (user_id, name, category, description, deadline, target_value, current_value, unit, priority) values
    (uid,'Quit vaping','health','No new vape. Ride out the last one and stop.', null, 30, 0, 'vape-free days',1),
    (uid,'Make $250 before the trip','financial','Uber Eats income before September 4.', date '2026-09-04', 250, 0, 'dollars',1),
    (uid,'Get more active','fitness','At least 4 workouts or activities per week.', null, 4, 0, 'sessions/week',2),
    (uid,'Fix the daily routine','personal','Productive mornings, weed at night only.', null, 7, 0, 'good days',1),
    (uid,'Move fraternity rooms','living','Fully moved before the trip.', date '2026-09-03', 100, 0, 'percent',1),
    (uid,'Prepare for the trip','travel','Packed, funded and ready by September 4.', date '2026-09-04', 100, 0, 'percent',2),
    (uid,'Get ready for school','school','Supplies, schedule and routine ready for term.', null, 100, 0, 'percent',2),
    (uid,'Save $1,000','financial','Long-term savings target.', null, 1000, 312.69, 'dollars',3),
    (uid,'Pass all classes','school','Forestry coursework at OSU.', null, 100, 0, 'percent',2),
    (uid,'Get a forestry internship','career','Apply and land a forestry internship.', null, 100, 0, 'percent',3);

  insert into public.events (user_id, title, type, date, is_milestone, notes) values
    (uid,'Trip','trip', date '2026-09-04', true, 'First major milestone — the reset deadline.'),
    (uid,'Move out of old fraternity room','fraternity', date '2026-09-03', false, 'People move into the house.');

  insert into public.accounts (user_id, name, kind, balance, is_savings, sort_order) values
    (uid,'Checking','checking',8.60,false,1),
    (uid,'Savings','savings',312.69,true,2),
    (uid,'Cash','cash',24.00,false,3);

  insert into public.change_log (user_id, summary, detail)
  values (uid,'Life OS initialized','Phase 1 — Reset: August 28 → September 4, 2026');

  update public.profiles set seeded = true where id = uid;
end;
$$;
grant execute on function public.seed_life_os() to authenticated;
