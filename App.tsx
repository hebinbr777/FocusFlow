import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Repeat, 
  Plus, 
  Sparkles, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit,
  Calendar as CalendarIcon,
  Flame,
  Menu,
  X
} from 'lucide-react';
import { Task, Habit, Goal, Category, Priority, Subtask, ViewState } from './types';
import { generateSubtasks, getDailyMotivation, analyzeWeeklyProgress } from './services/geminiService';
import { Card, Button, Badge } from './components/ui';

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getTodayString = () => new Date().toISOString().split('T')[0];

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Planejar projeto Q4',
    category: Category.WORK,
    priority: Priority.HIGH,
    completed: false,
    date: getTodayString(),
    subtasks: [
      { id: 's1', title: 'Revisar métricas Q3', completed: true },
      { id: 's2', title: 'Definir OKRs', completed: false },
    ]
  },
  {
    id: '2',
    title: 'Ler 30 minutos',
    category: Category.STUDY,
    priority: Priority.MEDIUM,
    completed: true,
    date: getTodayString(),
    subtasks: []
  }
];

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', title: 'Beber 2L de água', streak: 5, completedDates: [], color: 'bg-blue-500' },
  { id: 'h2', title: 'Meditar', streak: 12, completedDates: [], color: 'bg-purple-500' },
  { id: 'h3', title: 'Exercício Físico', streak: 3, completedDates: [], color: 'bg-orange-500' },
];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Tarefas Completas', target: 20, current: 12, unit: 'tarefas' },
  { id: 'g2', title: 'Horas de Estudo', target: 10, current: 4, unit: 'h' },
];

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });
  
  const [motivation, setMotivation] = useState<string>("Carregando sua inspiração diária...");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>(Category.WORK);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  // Initial Motivation Load
  useEffect(() => {
    const fetchMotivation = async () => {
      const pending = tasks.filter(t => !t.completed).length;
      const completed = tasks.filter(t => t.completed).length;
      const msg = await getDailyMotivation(pending, completed);
      setMotivation(msg);
    };
    fetchMotivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Handlers ---
  
  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newStatus = !t.completed;
        // Update goal progress if simple task completion goal
        if (newStatus) {
            setGoals(gs => gs.map(g => g.id === 'g1' ? {...g, current: Math.min(g.current + 1, g.target)} : g));
        } else {
            setGoals(gs => gs.map(g => g.id === 'g1' ? {...g, current: Math.max(g.current - 1, 0)} : g));
        }
        return { ...t, completed: newStatus };
      }
      return t;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsAiLoading(true);
    
    // Auto-generate subtasks using AI
    let generatedSubtasks: string[] = [];
    try {
      generatedSubtasks = await generateSubtasks(newTaskTitle);
    } catch (e) {
      console.error(e);
    }

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      completed: false,
      date: getTodayString(),
      subtasks: generatedSubtasks.map(title => ({
        id: generateId(),
        title,
        completed: false
      }))
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setShowTaskModal(false);
    setIsAiLoading(false);
  };

  const toggleHabit = (habitId: string) => {
    const today = getTodayString();
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const isCompletedToday = h.completedDates.includes(today);
        let newDates = h.completedDates;
        let newStreak = h.streak;

        if (isCompletedToday) {
          newDates = h.completedDates.filter(d => d !== today);
          newStreak = Math.max(0, h.streak - 1); // Simplified streak logic
        } else {
          newDates = [...h.completedDates, today];
          newStreak = h.streak + 1;
        }
        return { ...h, completedDates: newDates, streak: newStreak };
      }
      return h;
    }));
  };

  // --- Render Sections ---

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FocusFlow</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Visão Geral" />
        <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={20} />} label="Tarefas" />
        <NavButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={<Repeat size={20} />} label="Hábitos" />
        <NavButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon={<Target size={20} />} label="Metas" />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <BrainCircuit size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">AI Coach</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">"{motivation}"</p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const completedToday = tasks.filter(t => t.completed && t.date === getTodayString()).length;
    const pendingTotal = tasks.filter(t => !t.completed).length;
    const activeHabits = habits.filter(h => h.completedDates.includes(getTodayString())).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Tarefas Hoje" value={completedToday.toString()} subtitle="Concluídas" icon={<CheckSquare className="text-blue-500" />} />
            <StatCard title="Pendências" value={pendingTotal.toString()} subtitle="Para fazer" icon={<CalendarIcon className="text-orange-500" />} />
            <StatCard title="Hábitos" value={`${activeHabits}/${habits.length}`} subtitle="Hoje" icon={<Flame className="text-red-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Próximas Tarefas</h2>
                    <Button variant="ghost" onClick={() => setActiveTab('tasks')}>Ver todas</Button>
                </div>
                <div className="space-y-3">
                    {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
                        <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onToggleSubtask={toggleSubtask} />
                    ))}
                    {tasks.filter(t => !t.completed).length === 0 && (
                        <p className="text-slate-400 text-center py-4">Tudo feito por hoje! 🎉</p>
                    )}
                </div>
            </Card>

            <Card>
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Rotina Diária</h2>
                    <Button variant="ghost" onClick={() => setActiveTab('habits')}>Gerenciar</Button>
                </div>
                <div className="space-y-4">
                    {habits.map(habit => (
                         <div key={habit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${habit.color}`}></div>
                                <span className="font-medium text-slate-700">{habit.title}</span>
                            </div>
                            <button 
                                onClick={() => toggleHabit(habit.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${habit.completedDates.includes(getTodayString()) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                            >
                                <Check size={16} />
                            </button>
                         </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
    );
  };

  const renderTasks = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Minhas Tarefas</h2>
            <Button onClick={() => setShowTaskModal(true)}>
                <Plus size={18} /> Nova Tarefa
            </Button>
        </div>
        
        <div className="space-y-2">
            {tasks.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <Sparkles className="mx-auto h-12 w-12 text-yellow-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Comece algo novo</h3>
                    <p className="text-slate-500">Adicione sua primeira tarefa para começar a produtividade.</p>
                </div>
            )}
            {tasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onToggleSubtask={toggleSubtask} />
            ))}
        </div>
    </div>
  );

  const renderHabits = () => {
    // Generate last 7 days for the header
    const days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { 
            str: d.toISOString().split('T')[0], 
            label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
        };
    });

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Rastreador de Hábitos</h2>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-4 text-slate-500 font-medium">Hábito</th>
                                {days.map(d => (
                                    <th key={d.str} className="text-center py-4 px-2 text-slate-500 font-medium text-sm">
                                        {d.label}
                                    </th>
                                ))}
                                <th className="text-center py-4 px-4 text-slate-500 font-medium">Sequência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {habits.map(habit => (
                                <tr key={habit.id} className="border-t border-slate-100">
                                    <td className="py-4 px-4 font-medium text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${habit.color}`} />
                                            {habit.title}
                                        </div>
                                    </td>
                                    {days.map(d => {
                                        const done = habit.completedDates.includes(d.str);
                                        return (
                                            <td key={d.str} className="py-4 px-2 text-center">
                                                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all ${done ? `${habit.color} text-white` : 'bg-slate-100 text-slate-300'}`}>
                                                    {done && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
                                            <Flame size={16} />
                                            {habit.streak}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
  };

  const renderGoals = () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Metas Semanais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                    <Card key={goal.id} className="relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{goal.title}</h3>
                                <p className="text-sm text-slate-500">Semana atual</p>
                            </div>
                            <span className="text-2xl font-bold text-indigo-600">{percentage}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
                            <div 
                                className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                            <span>0</span>
                            <span>{goal.current} / {goal.target} {goal.unit}</span>
                        </div>
                    </Card>
                );
            })}
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm h-fit">
                <Sparkles className="text-indigo-500" size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-1">Dica da IA</h3>
                <p className="text-indigo-800 opacity-80 leading-relaxed">
                    Para alcançar suas metas de estudo, tente usar a técnica Pomodoro. Divida seu tempo em blocos de 25 minutos de foco total.
                </p>
            </div>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-40 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">FocusFlow</h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
         </button>
      </div>

      {renderSidebar()}

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'tasks' && renderTasks()}
            {activeTab === 'habits' && renderHabits()}
            {activeTab === 'goals' && renderGoals()}
        </div>
      </main>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Nova Tarefa</h3>
                    <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input 
                            type="text" 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Ex: Terminar relatório mensal"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                            <select 
                                value={newTaskCategory}
                                onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                            <select 
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg flex gap-3 items-start mt-2">
                        <Sparkles className="text-indigo-600 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-xs text-indigo-800">
                            A IA irá analisar sua tarefa e sugerir automaticamente uma checklist de sub-tarefas para facilitar sua execução.
                        </p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="ghost" onClick={() => setShowTaskModal(false)} className="flex-1">Cancelar</Button>
                        <Button onClick={handleAddTask} className="flex-1" loading={isAiLoading}>Criar Tarefa</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components (Kept in App.tsx to keep file count low as requested) ---

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => (
    <Card className="flex items-center gap-4">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
            <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
    </Card>
);

interface TaskItemProps {
    task: Task;
    onToggle: () => void;
    onDelete: () => void;
    onToggleSubtask: (tid: string, sid: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onToggleSubtask }) => {
    const [expanded, setExpanded] = useState(false);

    // Color mapping for priority badge
    const priorityColor = {
        [Priority.HIGH]: 'red',
        [Priority.MEDIUM]: 'orange',
        [Priority.LOW]: 'green'
    }[task.priority] || 'blue';

    return (
        <div className={`group bg-white rounded-xl border transition-all duration-200 ${task.completed ? 'border-slate-100 opacity-75' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'}`}>
            <div className="p-4 flex items-start gap-4">
                <button 
                    onClick={onToggle}
                    className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400 text-transparent'}`}
                >
                    <Check size={14} strokeWidth={3} />
                </button>
                
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
                            <h3 className={`font-semibold text-slate-800 transition-all ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge color={priorityColor}>{task.priority}</Badge>
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    • {task.category}
                                </span>
                                {task.subtasks.length > 0 && (
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                         • {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} sub-tarefas
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             {task.subtasks.length > 0 && (
                                <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                             )}
                            <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtasks Section */}
            {expanded && task.subtasks.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 p-4 rounded-b-xl space-y-2 animate-in slide-in-from-top-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Checklist gerada por IA</p>
                    {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 pl-2">
                            <button 
                                onClick={() => onToggleSubtask(task.id, sub.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-slate-400 border-slate-400 text-white' : 'bg-white border-slate-300'}`}
                            >
                                {sub.completed && <Check size={10} />}
                            </button>
                            <span className={`text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {sub.title}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};