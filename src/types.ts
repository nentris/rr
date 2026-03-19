export interface Task {
  id: string;
  name: string;
  completed: boolean;
  clickCount: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}
