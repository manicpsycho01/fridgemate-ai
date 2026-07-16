alter table public.inventory_items
add column if not exists quantity integer not null default 1;

update public.inventory_items
set quantity = 1
where quantity is null or quantity < 1;
