-- Мои дела · Cloud Sync 1.2 beta
-- Authenticated per-user records. Anonymous visitors cannot access any rows.
create table if not exists public.moi_dela_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null check (char_length(item_id) between 5 and 120),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  modified_at timestamptz not null,
  primary key (user_id, item_id)
);

alter table public.moi_dela_items enable row level security;

revoke all on public.moi_dela_items from anon;
revoke all on public.moi_dela_items from public;
grant select, insert, update on public.moi_dela_items to authenticated;

drop policy if exists "read own moi dela items" on public.moi_dela_items;
create policy "read own moi dela items" on public.moi_dela_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own moi dela items" on public.moi_dela_items;
create policy "insert own moi dela items" on public.moi_dela_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own moi dela items" on public.moi_dela_items;
create policy "update own moi dela items" on public.moi_dela_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Sync is atomic on the server. A newer per-item modified_at takes precedence.
-- Deletion is represented by body.deletedAt (a tombstone), never an untracked DELETE.
create or replace function public.moi_dela_sync(p_items jsonb)
returns table (body jsonb)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
  v_row jsonb;
  v_id text;
  v_when timestamptz;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid items array';
  end if;
  v_count := jsonb_array_length(p_items);
  if v_count > 10000 or pg_column_size(p_items) > 8000000 then
    raise exception 'Sync payload too large';
  end if;

  for v_row in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception 'Invalid record type';
    end if;

    v_id := v_row ->> 'id';
    if v_id is null or char_length(v_id) < 5 or char_length(v_id) > 120 then
      raise exception 'Invalid item id';
    end if;

    begin
      v_when := (v_row ->> 'updatedAt')::timestamptz;
    exception when others then
      raise exception 'Invalid updatedAt for record';
    end;
    if v_when is null then
      raise exception 'Missing updatedAt for record';
    end if;
    -- Limit pathological clock skew and malformed malicious future timestamps.
    if v_when > now() + interval '1 day' then
      raise exception 'Device clock is too far ahead';
    end if;

    insert into public.moi_dela_items (user_id, item_id, body, modified_at)
    values (v_uid, v_id, v_row, v_when)
    on conflict (user_id, item_id) do update
    set body = excluded.body, modified_at = excluded.modified_at
    where public.moi_dela_items.modified_at < excluded.modified_at;
  end loop;

  return query
    select m.body from public.moi_dela_items m
    where m.user_id = v_uid
    order by m.item_id;
end;
$function$;

revoke all on function public.moi_dela_sync(jsonb) from public;
revoke all on function public.moi_dela_sync(jsonb) from anon;
grant execute on function public.moi_dela_sync(jsonb) to authenticated;

comment on function public.moi_dela_sync(jsonb) is
'Merge client items by ID and updatedAt for the authenticated user only; returns the complete per-user dataset. Tombstones preserve deletions.';
