export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
}

export enum Category {
  WORK = 'Trabalho',
  PERSONAL = 'Pessoal',
  HEALTH = 'Saúde',
  STUDY = 'Estudos',
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  priority: Priority;
  completed: boolean;
  date: string; // ISO Date string
  subtasks: Subtask[];
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // ISO Date strings
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

export type ViewState = 'dashboard' | 'tasks' | 'habits' | 'goals';
