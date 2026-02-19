// src/app/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, Todo, MobileView } from '@/types';
import { useResizable } from '@/hooks/useResizable';
import FolderList, { SmartView } from '@/components/FolderList';
import TodoList from '@/components/TodoList';
import TodoDetail from '@/components/TodoDetail';
import ResizeHandle from '@/components/ResizeHandle';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function getWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return {
    start: now.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function Home() {
  const { isDesktop, midWidth, containerRef, startDrag } = useResizable();

  const [folders] = useState<Folder[]>([
    { id: 1, name: '개인', icon: '👤' },
    { id: 2, name: '업무', icon: '💼' },
    { id: 3, name: '쇼핑목록', icon: '🛒' },
    { id: 4, name: '프로젝트', icon: '📁' },
  ]);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [lastRealFolderId, setLastRealFolderId] = useState<number>(1);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('folders');

  // 스마트 뷰 상태 (null이면 폴더 모드)
  const [selectedSmartView, setSelectedSmartView] = useState<SmartView | null>(null);

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

  useEffect(() => {
    fetchTodos();
  }, []);

  // ===== 필터링 =====
  const currentFolderTodos = useMemo(() => {
    if (selectedSmartView === 'today') {
      const today = getTodayStr();
      return todos.filter(t => t.date === today);
    }
    if (selectedSmartView === 'week') {
      const { start, end } = getWeekRange();
      return todos.filter(t => t.date && t.date >= start && t.date <= end);
    }
    if (selectedSmartView === 'all') {
      return todos;
    }
    // 폴더 모드
    return todos.filter(todo => todo.folderId === selectedFolderId);
  }, [todos, selectedSmartView, selectedFolderId]);

  const currentViewLabel = useMemo(() => {
    if (selectedSmartView === 'today') return '오늘';
    if (selectedSmartView === 'week') return '이번 주';
    if (selectedSmartView === 'all') return '전체';
    return folders.find(f => f.id === selectedFolderId)?.name ?? '';
  }, [selectedSmartView, selectedFolderId, folders]);

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
    const targetFolderId = selectedFolderId;

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
    setSelectedSmartView(null);
    setSelectedFolderId(folderId);
    setLastRealFolderId(folderId);
    setSelectedTodoId(null);
    setMobileView('items');
  };

  const selectSmartView = (view: SmartView) => {
    setSelectedSmartView(view);
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

  // 스마트 뷰일 때는 폴더 표시 여부(전체 표시)
  const isSmartView = selectedSmartView !== null;

  // ===== 렌더링 =====
  return (
    <div ref={containerRef} className="h-screen bg-gray-100 flex overflow-hidden">

      {/* 폴더 목록 (고정 너비) */}
      <FolderList
        folders={folders}
        selectedFolderId={selectedFolderId}
        selectedSmartView={selectedSmartView}
        onSelectFolder={selectFolder}
        onSelectSmartView={selectSmartView}
        mobileView={mobileView}
      />

      {/* 할 일 목록 */}
      <TodoList
        todos={currentFolderTodos}
        selectedTodoId={selectedTodoId}
        selectedFolderId={isSmartView ? 0 : selectedFolderId}
        folderName={currentViewLabel}
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

      {/* 리사이즈 핸들 */}
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
