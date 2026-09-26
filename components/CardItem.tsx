'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Priority } from '@/types'
import { format, isPast, isToday } from 'date-fns'

interface CardItemProps {
  card: Card
  onDelete: (cardId: string) => void
  isDragging?: boolean
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
}

export default function CardItem({ card, onDelete, isDragging = false }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dueDateObj = card.due_date ? new Date(card.due_date) : null
  const duePast = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj)
  const dueToday = dueDateObj && isToday(dueDateObj)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow
        ${isSortableDragging || isDragging ? 'opacity-50 ring-2 ring-indigo-400' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug flex-1">
          {card.title}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card.id)
          }}
          className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors text-xs flex-shrink-0 mt-0.5"
          aria-label="Delete card"
        >
          ✕
        </button>
      </div>

      {card.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {card.priority && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[card.priority].color}`}>
            {priorityConfig[card.priority].label}
          </span>
        )}
        {dueDateObj && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              duePast
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : dueToday
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            📅 {format(dueDateObj, 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}
