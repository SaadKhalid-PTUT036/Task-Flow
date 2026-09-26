'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NewBoardModalProps {
  userId: string
}

export default function NewBoardModal({ userId }: NewBoardModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Create board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({ title: title.trim(), user_id: userId })
      .select()
      .single()

    if (boardError || !board) {
      setError(boardError?.message ?? 'Failed to create board')
      setLoading(false)
      return
    }

    // Seed 3 default columns
    const defaultColumns = [
      { board_id: board.id, title: 'To Do', position: 0 },
      { board_id: board.id, title: 'In Progress', position: 1 },
      { board_id: board.id, title: 'Done', position: 2 },
    ]

    const { error: colError } = await supabase.from('columns').insert(defaultColumns)

    if (colError) {
      setError(colError.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setTitle('')
    router.push(`/board/${board.id}`)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        <span className="text-lg leading-none">+</span>
        New Board
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create board</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="board-title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Board title
                </label>
                <input
                  id="board-title"
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Marketing Sprint Q4"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-semibold"
                >
                  {loading ? 'Creating…' : 'Create board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
