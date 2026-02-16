// src/types/index.ts

export type Folder = {
  id: number;
  name: string;
  icon: string;
};

export type Todo = {
  id: number;
  folderId: number;
  title: string;
  content?: string;
  date?: string;
  isDone: boolean;
};

export type MobileView = 'folders' | 'items' | 'detail';
