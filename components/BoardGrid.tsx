'use client'

import Link from 'next/link'
import { Board } from '@/types'
import { format } from 'date-fns'

interface BoardGridProps {
  boards: Board[]
}

export default function BoardGrid({ boards }: BoardGridProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No boards yet</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Create your first board to start organizing your tasks with a Kanban board.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {boards.map((board) => (
        <Link
          key={board.id}
          href={`/board/${board.id}`}
          className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-400 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-bold">
              {board.title.charAt(0).toUpperCase()}
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {board.title}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Created {format(new Date(board.created_at), 'MMM d, yyyy')}
          </p>
        </Link>
      ))}
    </div>
  )
}
