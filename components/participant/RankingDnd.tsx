"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  TouchSensor,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RankingDndProps {
  question: string;
  options: string[];
  onSubmit: (order: number[]) => void;
}

interface Item {
  id: string;
  originalIndex: number;
  label: string;
}

interface SortableItemProps {
  item: Item;
  position: number;
}

function SortableItem({ item, position }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 select-none ${
        isDragging ? "opacity-50 shadow-2xl" : "opacity-100"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none px-1 text-2xl text-gray-400 active:cursor-grabbing"
        aria-label="Drag handle"
      >
        &#9776;
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
        {position}
      </span>
      <span className="flex-1 text-base font-medium">{item.label}</span>
    </div>
  );
}

export default function RankingDnd({ question, options, onSubmit }: RankingDndProps) {
  const [items, setItems] = useState<Item[]>(() =>
    options.map((label, index) => ({
      id: `item-${index}`,
      originalIndex: index,
      label,
    }))
  );
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleSubmit() {
    onSubmit(items.map((item) => item.originalIndex));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-xl font-semibold text-green-400">Answer submitted!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg font-semibold">{question}</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3" style={{ minHeight: `${items.length * 56}px` }}>
            {items.map((item, index) => (
              <SortableItem key={item.id} item={item} position={index + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={handleSubmit}
        className="rounded-xl bg-blue-600 py-4 text-lg font-semibold transition hover:bg-blue-500 active:bg-blue-700"
      >
        Submit
      </button>
    </div>
  );
}
