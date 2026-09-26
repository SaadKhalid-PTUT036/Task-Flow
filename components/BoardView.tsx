'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { Board, Column, Card } from '@/types'
import KanbanColumn from './KanbanColumn'
import CardItem from './CardItem'

interface BoardViewProps {
  board: Board
  initialColumns: Column[]
  initialCards: Card[]
}

export default function BoardView({ board, initialColumns, initialCards }: BoardViewProps) {
  const [columns] = useState<Column[]>(initialColumns)
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // ─── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const columnIds = columns.map((c) => c.id)
    if (columnIds.length === 0) return

    const channel = supabase
      .channel(`board-${board.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `column_id=in.(${columnIds.join(',')})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCards((prev) => {
              if (prev.find((c) => c.id === (payload.new as Card).id)) return prev
              return [...prev, payload.new as Card]
            })
          } else if (payload.eventType === 'UPDATE') {
            setCards((prev) =>
              prev.map((c) => (c.id === (payload.new as Card).id ? (payload.new as Card) : c))
            )
          } else if (payload.eventType === 'DELETE') {
            setCards((prev) => prev.filter((c) => c.id !== (payload.old as Card).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [board.id, columns])

  // ─── Add card ─────────────────────────────────────────────────────────────
  const handleAddCard = useCallback(
    async (columnId: string, title: string, description?: string, priority?: string, dueDate?: string) => {
      const supabase = createClient()

      const columnCards = cards.filter((c) => c.column_id === columnId)
      const maxPosition = columnCards.length > 0 ? Math.max(...columnCards.map((c) => c.position)) + 1 : 0

      const { data, error } = await supabase
        .from('cards')
        .insert({
          column_id: columnId,
          title,
          description: description || null,
          priority: priority || null,
          due_date: dueDate || null,
          position: maxPosition,
        })
        .select()
        .single()

      if (!error && data) {
        setCards((prev) => [...prev, data as Card])
      }
    },
    [cards]
  )

  // ─── Delete card ──────────────────────────────────────────────────────────
  const handleDeleteCard = useCallback(async (cardId: string) => {
    const supabase = createClient()
    setCards((prev) => prev.filter((c) => c.id !== cardId))
    await supabase.from('cards').delete().eq('id', cardId)
  }, [])

  // ─── Drag handlers ────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeCard = cards.find((c) => c.id === activeId)
    if (!activeCard) return

    // over a column directly
    const overColumn = columns.find((col) => col.id === overId)
    if (overColumn && activeCard.column_id !== overColumn.id) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, column_id: overColumn.id } : c
        )
      )
      return
    }

    // over another card
    const overCard = cards.find((c) => c.id === overId)
    if (!overCard) return

    if (activeCard.column_id !== overCard.column_id) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, column_id: overCard.column_id } : c
        )
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const movedCard = cards.find((c) => c.id === activeId)
    if (!movedCard) return

    // Determine target column
    const overColumn = columns.find((col) => col.id === overId)
    const overCard = cards.find((c) => c.id === overId)
    const targetColumnId = overColumn ? overColumn.id : overCard?.column_id ?? movedCard.column_id

    // Build new ordered list for that column
    const columnCards = cards
      .filter((c) => c.column_id === targetColumnId)
      .sort((a, b) => a.position - b.position)

    let newColumnCards: Card[]
    if (overCard && overCard.column_id === targetColumnId) {
      const oldIdx = columnCards.findIndex((c) => c.id === activeId)
      const newIdx = columnCards.findIndex((c) => c.id === overId)
      if (oldIdx !== -1 && newIdx !== -1) {
        newColumnCards = arrayMove(columnCards, oldIdx, newIdx)
      } else if (oldIdx === -1) {
        newColumnCards = [...columnCards, movedCard]
      } else {
        newColumnCards = columnCards
      }
    } else {
      newColumnCards = [...columnCards]
      if (!newColumnCards.find((c) => c.id === activeId)) {
        newColumnCards.push({ ...movedCard, column_id: targetColumnId })
      }
    }

    // Assign positions
    const updatedColumnCards = newColumnCards.map((c, i) => ({ ...c, position: i }))

    // Optimistic update
    setCards((prev) => {
      const otherCards = prev.filter((c) => c.column_id !== targetColumnId || c.id === activeId ? c.column_id !== targetColumnId : false)
      const filtered = prev.filter((c) => c.column_id !== targetColumnId)
      return [
        ...filtered.filter((c) => c.id !== activeId),
        ...updatedColumnCards,
      ]
    })

    // Persist to Supabase
    const supabase = createClient()
    const updates = updatedColumnCards.map((c) =>
      supabase.from('cards').update({ column_id: c.column_id, position: c.position }).eq('id', c.id)
    )
    await Promise.all(updates)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 min-h-full items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={cards
              .filter((c) => c.column_id === column.id)
              .sort((a, b) => a.position - b.position)}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-3 opacity-90">
            <CardItem card={activeCard} onDelete={() => {}} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
