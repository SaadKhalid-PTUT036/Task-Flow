'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Column, Card, Priority } from '@/types'
import CardItem from './CardItem'

interface KanbanColumnProps {
  column: Column
  cards: Card[]
  onAddCard: (
    columnId: string,
    title: string,
    description?: string,
    priority?: string,
    dueDate?: string
  ) => void
  onDeleteCard: (cardId: string) => void
}

export default function KanbanColumn({ column, cards, onAddCard, onDeleteCard }: KanbanColumnProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    await onAddCard(column.id, title.trim(), description.trim() || undefined, priority || undefined, dueDate || undefined)
    setTitle('')
    setDescription('')
    setPriority('')
    setDueDate('')
    setShowForm(false)
    setAdding(false)
  }

  const columnColors: Record<string, string> = {
    'To Do': 'bg-slate-500',
    'In Progress': 'bg-yellow-500',
    'Done': 'bg-green-500',
  }

  const dotColor = columnColors[column.title] ?? 'bg-indigo-500'

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
          {column.title}
        </h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 transition-colors min-h-[120px] ${
          isOver
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-400'
            : 'bg-gray-200/60 dark:bg-gray-800/60'
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} onDelete={onDeleteCard} />
            ))}
          </div>
        </SortableContext>

        {cards.length === 0 && !showForm && (
          <p className="text-center text-gray-400 dark:text-gray-500 text-xs py-6">
            No cards yet
          </p>
        )}
      </div>

      {/* Add card form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2"
        >
          <input
            autoFocus
            type="text"
            placeholder="Card title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
              className="flex-1 text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 text-sm py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !title.trim()}
              className="flex-1 text-sm py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/60 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Add card
        </button>
      )}
    </div>
  )
}
