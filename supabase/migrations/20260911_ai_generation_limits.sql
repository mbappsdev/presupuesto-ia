create table if not exists public.ai_generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  generations integer not null default 0 check (generations >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_generation_usage enable row level security;

create or replace function public.get_ai_generation_remaining(
  p_user_id uuid,
  p_limit integer default 20
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Argentina/Cordoba', now()))::date;
  v_used integer;
begin
  select generations
    into v_used
  from public.ai_generation_usage
  where user_id = p_user_id
    and usage_date = v_today;

  return greatest(p_limit - coalesce(v_used, 0), 0);
end;
$$;

create or replace function public.consume_ai_generation(
  p_user_id uuid,
  p_limit integer default 20
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Argentina/Cordoba', now()))::date;
  v_remaining integer;
begin
  insert into public.ai_generation_usage (user_id, usage_date, generations)
  values (p_user_id, v_today, 0)
  on conflict (user_id, usage_date) do nothing;

  update public.ai_generation_usage
     set generations = generations + 1,
         updated_at = now()
   where user_id = p_user_id
     and usage_date = v_today
     and generations < p_limit
  returning p_limit - generations into v_remaining;

  if v_remaining is null then
    return -1;
  end if;

  return v_remaining;
end;
$$;

create or replace function public.release_ai_generation(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Argentina/Cordoba', now()))::date;
begin
  update public.ai_generation_usage
     set generations = greatest(generations - 1, 0),
         updated_at = now()
   where user_id = p_user_id
     and usage_date = v_today;
end;
$$;

revoke all on function public.get_ai_generation_remaining(uuid, integer) from public, anon, authenticated;
revoke all on function public.consume_ai_generation(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_ai_generation(uuid) from public, anon, authenticated;

grant execute on function public.get_ai_generation_remaining(uuid, integer) to service_role;
grant execute on function public.consume_ai_generation(uuid, integer) to service_role;
grant execute on function public.release_ai_generation(uuid) to service_role;
