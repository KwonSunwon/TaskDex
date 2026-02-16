// src/app/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, Todo, MobileView } from '@/types';
import { useResizable } from '@/hooks/useResizable';
import FolderList from '@/components/FolderList';
import TodoList from '@/components/TodoList';
import TodoDetail from '@/components/TodoDetail';
import ResizeHandle from '@/components/ResizeHandle';

export default function Home() {
  // 리사이즈 훅
  const { isDesktop, leftWidth, midWidth, containerRef, startDrag } = useResizable();

  // 폴더 목록 (일단 고정)
  const [folders] = useState<Folder[]>([
    { id: 1, name: '개인', icon: '👤' },
    { id: 2, name: '업무', icon: '💼' },
    { id: 3, name: '쇼핑목록', icon: '🛒' },
    { id: 4, name: '프로젝트', icon: '📁' },
  ]);

  // 할 일 목록
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 선택 상태
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [lastRealFolderId, setLastRealFolderId] = useState<number>(1);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('folders');

  // 입력 상태
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  // ===== Supabase 데이터 가져오기 =====
  const fetchTodos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('DB Error:', error);
    } else if (data) {
      const formattedTodos: Todo[] = data.map((item: any) => ({
        id: item.id,
        folderId: item.folder_id,
        title: item.title,
        content: item.content,
        date: item.date,
        isDone: item.is_done,
      }));
      setTodos(formattedTodos);
    }
    setIsLoading(false);
  };

  // 앱 시작 시 데이터 로딩
  useEffect(() => {
    fetchTodos();
  }, []);

  // ===== 필터링 =====
  const currentFolderTodos = selectedFolderId === 0
    ? todos
    : todos.filter(todo => todo.folderId === selectedFolderId);

  const selectedFolderName = selectedFolderId === 0
    ? '전체'
    : (folders.find(f => f.id === selectedFolderId)?.name ?? '');

  const folderNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const f of folders) map[f.id] = f.name;
    return map;
  }, [folders]);

  const selectedTodo = todos.find(todo => todo.id === selectedTodoId);

  // ===== 할 일 토글 =====
  const toggleTodo = async (id: number) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;

    const newStatus = !target.isDone;
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, isDone: newStatus } : todo
    ));

    const { error } = await supabase
      .from('todos')
      .update({ is_done: newStatus })
      .eq('id', id);
      
    if (error) console.error('Toggle Error:', error);
  };

  // ===== 새 할 일 추가 =====
  const addTodo = async () => {
    if (newTitle.trim() === '') return;
    
    const targetFolderId = selectedFolderId === 0 ? lastRealFolderId : selectedFolderId;
    
    const { data, error } = await supabase
      .from('todos')
      .insert({
        folder_id: targetFolderId,
        title: newTitle,
        content: '',
        date: newDate || null,
        is_done: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert Error:', error);
    } else if (data) {
      const newTodo: Todo = {
        id: data.id,
        folderId: data.folder_id,
        title: data.title,
        content: data.content,
        date: data.date,
        isDone: data.is_done,
      };
      setTodos([...todos, newTodo]);
      setNewTitle('');
      setNewDate('');
      setSelectedTodoId(newTodo.id);
    }
  };

  // ===== 네비게이션 =====
  const selectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
    if (folderId !== 0) {
      setLastRealFolderId(folderId);
    }
    setSelectedTodoId(null);
    setMobileView('items');
  };

  const selectTodo = (todoId: number) => {
    setSelectedTodoId(todoId);
    setMobileView('detail');
  };

  const goBack = () => {
    if (mobileView === 'detail') setMobileView('items');
    else if (mobileView === 'items') setMobileView('folders');
  };

  // ===== 렌더링 =====
  return (
    <div ref={containerRef} className="h-screen bg-gray-100 flex overflow-hidden">
      
      {/* 폴더 목록 */}
      <FolderList
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={selectFolder}
        mobileView={mobileView}
        width={isDesktop ? leftWidth : undefined}
      />

      {/* 리사이즈 핸들 1 */}
      <ResizeHandle
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('left-mid');
        }}
      />

      {/* 할 일 목록 */}
      <TodoList
        todos={currentFolderTodos}
        selectedTodoId={selectedTodoId}
        selectedFolderId={selectedFolderId}
        folderName={selectedFolderName}
        folderNameById={folderNameById}
        isLoading={isLoading}
        onSelectTodo={selectTodo}
        onAddTodo={addTodo}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newDate={newDate}
        setNewDate={setNewDate}
        mobileView={mobileView}
        onGoBack={goBack}
        width={isDesktop ? midWidth : undefined}
      />

      {/* 리사이즈 핸들 2 */}
      <ResizeHandle
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('mid-right');
        }}
      />

      {/* 상세 내용 */}
      <TodoDetail
        todo={selectedTodo}
        onToggleTodo={toggleTodo}
        mobileView={mobileView}
        onGoBack={goBack}
      />

    </div>
  );
}
