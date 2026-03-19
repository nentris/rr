import { useState, useCallback, useEffect } from "react";
import { Plus, Settings2, X, BarChart3, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Category, Task } from "./types";
import { CategoryCard } from "./components/CategoryCard";

const COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#06b6d4", // cyan
];

// Mock data for stats with dates
const WEEKLY_DATA = [
  { name: '13 Mar', value: 4 },
  { name: '14 Mar', value: 7 },
  { name: '15 Mar', value: 5 },
  { name: '16 Mar', value: 8 },
  { name: '17 Mar', value: 6 },
  { name: '18 Mar', value: 9 },
  { name: '19 Mar', value: 4 },
];

const MONTHLY_DATA = [
  { name: '01 Mar', value: 25 },
  { name: '08 Mar', value: 32 },
  { name: '15 Mar', value: 28 },
  { name: '22 Mar', value: 35 },
];

const YEARLY_DATA = [
  { name: 'Oct', value: 120 },
  { name: 'Nov', value: 150 },
  { name: 'Dec', value: 180 },
  { name: 'Jan', value: 140 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 170 },
];

function StatsModal({ category, onClose }: { category: Category; onClose: () => void }) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  
  const data = timeframe === 'week' ? WEEKLY_DATA : timeframe === 'month' ? MONTHLY_DATA : YEARLY_DATA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden outline-none"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-100">
              {category.name}
            </h3>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 outline-none">
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-2 mb-8 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit mx-auto">
            {[
              { id: 'week', label: 'Weekly', icon: Clock },
              { id: 'month', label: 'Monthly', icon: Calendar },
              { id: 'year', label: 'Yearly', icon: BarChart3 },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${
                  timeframe === t.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="h-64 w-full outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#1e293b', radius: 8 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    outline: 'none'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={category.color} opacity={0.8 + (index / data.length) * 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("taskflow_data");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [statsCategoryId, setStatsCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTask, setEditingTask] = useState<{ categoryId: string; task: Task } | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [newTaskName, setNewTaskName] = useState("");

  useEffect(() => {
    localStorage.setItem("taskflow_data", JSON.stringify(categories));
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: newCategoryName, color: newCategoryColor }
          : c
      ));
    } else {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        name: newCategoryName,
        color: newCategoryColor,
        tasks: [],
      };
      setCategories((prev) => [...prev, newCategory]);
    }

    setNewCategoryName("");
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleAddTask = () => {
    if (!newTaskName.trim() || !currentCategoryId) return;

    if (editingTask) {
      setCategories(prev => prev.map(c => 
        c.id === editingTask.categoryId 
          ? { 
              ...c, 
              tasks: c.tasks.map(t => t.id === editingTask.task.id ? { ...t, name: newTaskName } : t) 
            }
          : c
      ));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: newTaskName,
        completed: false,
        clickCount: 0,
      };
      setCategories((prev) =>
        prev.map((c) =>
          c.id === currentCategoryId ? { ...c, tasks: [...c.tasks, newTask] } : c
        )
      );
    }

    setNewTaskName("");
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const handleToggleTask = (categoryId: string, taskId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              tasks: c.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed, clickCount: t.clickCount + 1 } : t
              ),
            }
          : c
      )
    );
  };

  const handleDeleteTask = (categoryId: string, taskId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
          : c
      )
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeCategory = categories.find(c => c.tasks.some(t => t.id === activeId));
    const overCategory = categories.find(c => c.id === overId || c.tasks.some(t => t.id === overId));

    if (!activeCategory || !overCategory) return;

    // Task to Task or Task to Category movement
    if (activeCategory.id !== overCategory.id) {
      setCategories(prev => {
        const activeTasks = [...activeCategory.tasks];
        const overTasks = [...overCategory.tasks];
        
        const activeIndex = activeTasks.findIndex(t => t.id === activeId);
        const task = activeTasks[activeIndex];
        
        activeTasks.splice(activeIndex, 1);
        
        const overIndex = overTasks.findIndex(t => t.id === overId);
        const newIndex = overIndex >= 0 ? overIndex : overTasks.length;
        
        overTasks.splice(newIndex, 0, task);

        return prev.map(c => {
          if (c.id === activeCategory.id) return { ...c, tasks: activeTasks };
          if (c.id === overCategory.id) return { ...c, tasks: overTasks };
          return c;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if we're dragging a category
    const activeCategoryIndex = categories.findIndex(c => c.id === activeId);
    const overCategoryIndex = categories.findIndex(c => c.id === overId);

    if (activeCategoryIndex !== -1 && overCategoryIndex !== -1) {
      setCategories(prev => arrayMove(prev, activeCategoryIndex, overCategoryIndex));
      return;
    }

    // Task within same category
    const category = categories.find(c => c.tasks.some(t => t.id === activeId));
    if (category) {
      const activeTaskIndex = category.tasks.findIndex(t => t.id === activeId);
      const overTaskIndex = category.tasks.findIndex(t => t.id === overId);
      
      if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
        setCategories(prev => prev.map(c => 
          c.id === category.id 
            ? { ...c, tasks: arrayMove(c.tasks, activeTaskIndex, overTaskIndex) }
            : c
        ));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 px-4 md:px-8 flex items-center justify-center bg-slate-950/50 backdrop-blur-md border-b border-slate-900 sticky top-0 z-30">
        <span className="font-black tracking-tighter text-2xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FEORMAGUS</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-x-auto overflow-y-hidden scrollbar-none snap-x snap-mandatory">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 md:gap-8 h-full min-w-max pb-4">
            <SortableContext items={categories.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onAddTask={(cid) => {
                    setCurrentCategoryId(cid);
                    setEditingTask(null);
                    setNewTaskName("");
                    setIsTaskModalOpen(true);
                  }}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={(cid, tid) => {
                    const cat = categories.find(c => c.id === cid);
                    const task = cat?.tasks.find(t => t.id === tid);
                    if (task) {
                      setEditingTask({ categoryId: cid, task });
                      setNewTaskName(task.name);
                      setCurrentCategoryId(cid);
                      setIsTaskModalOpen(true);
                    }
                  }}
                  onDeleteCategory={handleDeleteCategory}
                  onEditCategory={(id) => {
                    const cat = categories.find(c => c.id === id);
                    if (cat) {
                      setEditingCategory(cat);
                      setNewCategoryName(cat.name);
                      setNewCategoryColor(cat.color);
                      setIsCategoryModalOpen(true);
                    }
                  }}
                  onShowStats={(id) => setStatsCategoryId(id)}
                />
              ))}
            </SortableContext>

            {/* Add Category Button at the end */}
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingCategory(null);
                setNewCategoryName("");
                setIsCategoryModalOpen(true);
              }}
              className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-80 h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-700 hover:text-slate-400 transition-all group snap-center"
            >
              <div className="w-16 h-16 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={32} />
              </div>
              <span className="font-bold uppercase tracking-widest text-xs">Add Category</span>
            </motion.button>

            {categories.length === 0 && (
              <div className="flex flex-col items-center justify-center w-[80vw] h-full text-slate-700 gap-4">
                <p className="text-lg font-medium">Create your first category to get started</p>
              </div>
            )}
          </div>
        </DndContext>
      </main>

      {/* Stats Modal */}
      <AnimatePresence>
        {statsCategoryId && (
          <StatsModal 
            category={categories.find(c => c.id === statsCategoryId)!} 
            onClose={() => setStatsCategoryId(null)} 
          />
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-100">
                    {editingCategory ? "Edit Category" : "New Category"}
                  </h3>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Work, Fitness, Personal"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Color</label>
                    <div className="grid grid-cols-4 gap-3">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCategoryColor(color)}
                          className={`h-10 rounded-xl transition-all ${
                            newCategoryColor === color ? "ring-2 ring-white scale-110" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={handleAddCategory}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all"
                    >
                      {editingCategory ? "Save Changes" : "Create Category"}
                    </button>
                    
                    {editingCategory && (
                      <button
                        onClick={() => {
                          handleDeleteCategory(editingCategory.id);
                          setIsCategoryModalOpen(false);
                        }}
                        className="w-full py-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl font-bold transition-all"
                      >
                        Delete Category
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-100">
                    {editingTask ? "Edit Task" : "New Task"}
                  </h3>
                  <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Task Name</label>
                    <textarea
                      autoFocus
                      rows={3}
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={handleAddTask}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all"
                    >
                      {editingTask ? "Save Task" : "Add Task"}
                    </button>

                    {editingTask && (
                      <button
                        onClick={() => {
                          handleDeleteTask(editingTask.categoryId, editingTask.task.id);
                          setIsTaskModalOpen(false);
                        }}
                        className="w-full py-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl font-bold transition-all"
                      >
                        Delete Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
