create table if not exists public.question_history (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('solved', 'solved-date-updated', 'revised')),
  event_at timestamptz not null,
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

alter table public.question_history enable row level security;

create policy "Users can view their own question history"
on public.question_history
for select
using (auth.uid() = user_id);

create policy "Users can insert their own question history"
on public.question_history
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own question history"
on public.question_history
for update
using (auth.uid() = user_id);

create policy "Users can delete their own question history"
on public.question_history
for delete
using (auth.uid() = user_id);
