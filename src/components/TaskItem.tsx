import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Trash2, Edit2, GripVertical } from "lucide-react";
import { Task } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  color: string;
  key?: string;
}

export function TaskItem({ task, onToggle, onDelete, onEdit, color }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 p-3 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 transition-all hover:bg-slate-800/60",
        task.completed && "opacity-60",
        isDragging && "opacity-50 scale-105 shadow-2xl bg-slate-700 ring-1 ring-indigo-500/30"
      )}
    >
      <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-500">
        <GripVertical size={16} />
      </div>

      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          task.completed ? "border-transparent" : "border-slate-600 hover:border-slate-500"
        )}
        style={{ 
          backgroundColor: task.completed ? color : 'transparent',
          boxShadow: task.completed ? `0 0 10px ${color}40` : 'none'
        }}
      >
        {task.completed && <Check size={12} className="text-white stroke-[3px]" />}
      </button>

      <div className="flex-grow min-w-0 pt-0.5">
        <p className={cn(
          "text-sm font-medium text-slate-200 break-words leading-relaxed transition-all",
          task.completed && "line-through text-slate-500 blur-[0.5px]"
        )}>
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {task.clickCount} {task.clickCount === 1 ? 'click' : 'clicks'}
          </span>
        </div>
      </div>

      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task.id)}
          className="p-1.5 text-slate-600 hover:text-indigo-400 hover:bg-slate-700/50 rounded-xl transition-colors"
        >
          <Edit2 size={14} />
        </button>
      </div>
    </div>
  );
}
