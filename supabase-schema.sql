-- Мои дела · синхронизация между устройствами (Supabase)
-- Выполните ОДИН РАЗ в SQL Editor собственного проекта Supabase.
-- Этот скрипт НЕ содержит паролей и секретных ключей.

create table if not exists public.moi_dela_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  body jsonb not null,
  modified_at timestamptz not null,
  primary key (user_id, id),
  constraint moi_dela_id_length check (length(id) between 1 and 200),
  constraint moi_dela_body_object check (jsonb_typeof(body) = 'object')
);

alter table public.moi_dela_items enable row level security;
revoke all on public.moi_dela_items from anon;
grant select, insert, update on public.moi_dela_items to authenticated;

drop policy if exists "moi_dela_read_own" on public.moi_dela_items;
create policy "moi_dela_read_own" on public.moi_dela_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "moi_dela_insert_own" on public.moi_dela_items;
create policy "moi_dela_insert_own" on public.moi_dela_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "moi_dela_update_own" on public.moi_dela_items;
create policy "moi_dela_update_own" on public.moi_dela_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Атомарно принимает локальные версии записей и возвращает победившие
-- версии после объединения. Для одной записи побеждает более поздний
-- updatedAt. Удаление передаётся как tombstone c deletedAt.
create or replace function public.moi_dela_sync(p_items jsonb)
returns table (id text, body jsonb, modified_at timestamptz)
language plpgsql security invoker
set search_path = ''
as $$
declare
  entry jsonb;
  entry_id text;
  edit_time timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) > 2000 then
    raise exception 'Invalid batch';
  end if;

  for entry in select value from jsonb_array_elements(p_items) loop
    entry_id := entry ->> 'id';
    if jsonb_typeof(entry) <> 'object'
       or entry_id is null or length(entry_id) < 1
       or length(entry_id) > 200
       or length(entry::text) > 100000 then
      raise exception 'Invalid item';
    end if;
    begin
      edit_time := (entry ->> 'updatedAt')::timestamptz;
    exception when others then
      raise exception 'Invalid item timestamp';
    end;
    if edit_time is null then
      raise exception 'Missing item timestamp';
    end if;

    insert into public.moi_dela_items as dest
      (user_id, id, body, modified_at)
    values
      ((select auth.uid()), entry_id, entry, edit_time)
    on conflict (user_id, id) do update
      set body = excluded.body, modified_at = excluded.modified_at
    where dest.modified_at < excluded.modified_at;
  end loop;

  return query
    select t.id, t.body, t.modified_at
      from public.moi_dela_items t
     where t.user_id = (select auth.uid());
end;
$$;

revoke all on function public.moi_dela_sync(jsonb) from public, anon;
grant execute on function public.moi_dela_sync(jsonb) to authenticated;
