# TaskFlow

A Kanban-style task manager built with Next.js 14, Supabase, and @dnd-kit.

## What it is

TaskFlow lets you organize work across boards with drag-and-drop Kanban columns. Each board comes with three default columns — **To Do**, **In Progress**, and **Done**. Cards support a title, description, priority level (low / medium / high), and a due date. Changes sync in real time across browser tabs via Supabase Realtime.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (Postgres + Auth + Realtime) |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Date utilities | date-fns |
| Deployment | Vercel |

## How to run locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key from the Supabase dashboard → Project Settings → API.

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Apply the database schema

Open the Supabase SQL editor and run the contents of `supabase/schema.sql`. This creates the `boards`, `columns`, and `cards` tables with RLS policies and enables Realtime on `cards`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

1. Push this repo to GitHub.
2. Connect the repo in [Vercel](https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project environment variables.
4. Deploy.
