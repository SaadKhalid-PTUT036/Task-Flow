-- ============================================================
-- TaskFlow Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Boards
create table if not exists public.boards (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now()
);

-- Columns
create table if not exists public.columns (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  title       text not null,
  position    integer not null default 0
);

-- Cards
create table if not exists public.cards (
  id          uuid primary key default uuid_generate_v4(),
  column_id   uuid not null references public.columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text check (priority in ('low', 'medium', 'high')),
  due_date    date,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists boards_user_id_idx on public.boards(user_id);
create index if not exists columns_board_id_idx on public.columns(board_id);
create index if not exists cards_column_id_idx on public.cards(column_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

-- Boards: users can only access their own boards
create policy "Users can view own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can create own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Columns: accessible if user owns the parent board
create policy "Users can view columns of own boards"
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can create columns on own boards"
  on public.columns for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can update columns on own boards"
  on public.columns for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete columns on own boards"
  on public.columns for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = columns.board_id
        and boards.user_id = auth.uid()
    )
  );

-- Cards: accessible if user owns the grandparent board
create policy "Users can view cards on own boards"
  on public.cards for select
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can create cards on own boards"
  on public.cards for insert
  with check (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can update cards on own boards"
  on public.cards for update
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete cards on own boards"
  on public.cards for delete
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      where columns.id = cards.column_id
        and boards.user_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime on cards table
alter publication supabase_realtime add table public.cards;
