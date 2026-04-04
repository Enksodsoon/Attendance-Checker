-- Enforce one-to-one LINE linking for production data integrity.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.line_accounts'::regclass
      and contype = 'u'
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.line_accounts'::regclass and attname = 'profile_id')
      ]::smallint[]
  ) then
    alter table public.line_accounts
      add constraint line_accounts_profile_id_unique unique (profile_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.line_accounts'::regclass
      and contype = 'u'
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.line_accounts'::regclass and attname = 'line_user_id')
      ]::smallint[]
  ) then
    alter table public.line_accounts
      add constraint line_accounts_line_user_id_unique unique (line_user_id);
  end if;
end $$;
