import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardGrid from '@/components/BoardGrid'
import NewBoardModal from '@/components/NewBoardModal'
import { LogoutButton } from '@/components/LogoutButton'
import { Board } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: boards, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">TaskFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Boards</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {boards?.length ?? 0} board{(boards?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <NewBoardModal userId={user.id} />
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-4">
            Failed to load boards. Please refresh the page.
          </div>
        )}

        <BoardGrid boards={(boards as Board[]) ?? []} />
      </main>
    </div>
  )
}
