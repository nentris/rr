import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, Edit2, GripHorizontal } from "lucide-react";
import { Category, Task } from "../types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskItem } from "./TaskItem";
import { motion } from "motion/react";

interface CategoryCardProps {
  category: Category;
  onAddTask: (categoryId: string) => void;
  onToggleTask: (categoryId: string, taskId: string) => void;
  onDeleteTask: (categoryId: string, taskId: string) => void;
  onEditTask: (categoryId: string, taskId: string) => void;
  onDeleteCategory: (id: string) => void;
  onEditCategory: (id: string) => void;
  onShowStats: (id: string) => void;
  key?: string;
}

export function CategoryCard({
  category,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onDeleteCategory,
  onEditCategory,
  onShowStats,
}: CategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  const completedCount = category.tasks.filter((t) => t.completed).length;
  const totalCount = category.tasks.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const chartData = [
    { name: "Completed", value: completedCount },
    { name: "Remaining", value: totalCount === 0 ? 1 : Math.max(0, totalCount - completedCount) },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-[calc(100vw-2rem)] md:w-80 flex flex-col h-[calc(100vh-8rem)] bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden transition-all snap-center outline-none ${
        isDragging ? "opacity-50 scale-105 shadow-2xl ring-2 ring-indigo-500/50" : ""
      }`}
    >
      {/* Header with Chart at the top */}
      <div className="p-6 flex flex-col items-center bg-slate-900/60 border-b border-slate-800 relative">
        <div {...attributes} {...listeners} className="absolute top-4 left-4 cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-500">
          <GripHorizontal size={20} />
        </div>

        <div className="absolute top-4 right-4 flex gap-1">
          <button
            onClick={() => onEditCategory(category.id)}
            className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors outline-none"
          >
            <Edit2 size={16} />
          </button>
        </div>

        <div className="w-44 h-44 relative cursor-pointer group/chart outline-none" onClick={() => onShowStats(category.id)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                cornerRadius={10}
              >
                <Cell fill={category.color} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
            <span className="text-3xl font-black text-slate-100 leading-none group-hover/chart:scale-110 transition-transform">{percentage}%</span>
            <span className="text-[10px] font-bold text-slate-500 mt-2 text-center line-clamp-2 uppercase tracking-widest leading-tight max-w-full">
              {category.name}
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar-none">
        <SortableContext items={category.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {category.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              color={category.color}
              onToggle={(taskId) => onToggleTask(category.id, taskId)}
              onDelete={(taskId) => onDeleteTask(category.id, taskId)}
              onEdit={(taskId) => onEditTask(category.id, taskId)}
            />
          ))}
        </SortableContext>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddTask(category.id)}
          className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400 hover:bg-slate-800/30 transition-all font-medium mt-2"
        >
          <Plus size={18} />
          <span className="text-sm">Add Task</span>
        </motion.button>
      </div>
    </div>
  );
}
