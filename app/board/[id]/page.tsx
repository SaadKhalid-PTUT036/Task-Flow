import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardView from '@/components/BoardView'
import { LogoutButton } from '@/components/LogoutButton'
import Link from 'next/link'
import { Board, Column, Card } from '@/types'

interface BoardPageProps {
  params: { id: string }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!board) notFound()

  const { data: columns } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', params.id)
    .order('position', { ascending: true })

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .in('column_id', (columns ?? []).map((c) => c.id))
    .order('position', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              ← Boards
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{board.title}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <BoardView
          board={board as Board}
          initialColumns={(columns ?? []) as Column[]}
          initialCards={(cards ?? []) as Card[]}
        />
      </div>
    </div>
  )
}
