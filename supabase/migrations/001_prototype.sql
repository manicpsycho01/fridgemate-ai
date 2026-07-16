-- FridgeMate AI prototype — run in Supabase SQL Editor or via CLI migrate

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamp with time zone default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  source text,
  created_at timestamp with time zone default now()
);

create table if not exists public.essential_items (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  is_checked boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.recipe_history (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade not null,
  recipe_json jsonb,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.essential_items enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.recipe_history enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid () = id);

create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid () = id);

create policy "profiles_update_own" on public.profiles for update using (auth.uid () = id);

-- inventory_items
create policy "inventory_select_own" on public.inventory_items for select using (auth.uid () = user_id);

create policy "inventory_insert_own" on public.inventory_items for insert with check (auth.uid () = user_id);

create policy "inventory_update_own" on public.inventory_items for update using (auth.uid () = user_id);

create policy "inventory_delete_own" on public.inventory_items for delete using (auth.uid () = user_id);

-- essential_items
create policy "essentials_select_own" on public.essential_items for select using (auth.uid () = user_id);

create policy "essentials_insert_own" on public.essential_items for insert with check (auth.uid () = user_id);

create policy "essentials_update_own" on public.essential_items for update using (auth.uid () = user_id);

create policy "essentials_delete_own" on public.essential_items for delete using (auth.uid () = user_id);

-- shopping_list_items
create policy "shopping_select_own" on public.shopping_list_items for select using (auth.uid () = user_id);

create policy "shopping_insert_own" on public.shopping_list_items for insert with check (auth.uid () = user_id);

create policy "shopping_update_own" on public.shopping_list_items for update using (auth.uid () = user_id);

create policy "shopping_delete_own" on public.shopping_list_items for delete using (auth.uid () = user_id);

-- recipe_history
create policy "recipe_history_select_own" on public.recipe_history for select using (auth.uid () = user_id);

create policy "recipe_history_insert_own" on public.recipe_history for insert with check (auth.uid () = user_id);

create policy "recipe_history_update_own" on public.recipe_history for update using (auth.uid () = user_id);

create policy "recipe_history_delete_own" on public.recipe_history for delete using (auth.uid () = user_id);
