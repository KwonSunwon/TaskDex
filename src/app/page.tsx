// src/app/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useMemo, type KeyboardEvent } from 'react';
import { supabase } from '@/lib/supabase'; // ⭐ Supabase 클라이언트 임포트

// 타입 정의
type Folder = {
  id: number;
  name: string;
  icon: string;
};

type Todo = {
  id: number;
  folderId: number;
  title: string;
  content?: string;
  date?: string;
  isDone: boolean;
};

type MobileView = 'folders' | 'items' | 'detail';

export default function Home() {

  // ===== 데스크톱(>= md) 3단 리사이즈 상태 =====
  const [isDesktop, setIsDesktop] = useState(false);

  // 로컬 스토리지 읽기
  const readStoredNumber = useCallback((key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  }, []);

  const clamp = useCallback((v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
  }, []);

  // 폭(px)
  const [leftWidth, setLeftWidth] = useState<number>(280);
  const [midWidth, setMidWidth] = useState<number>(360);

  // 드래그 상태
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'left-mid' | 'mid-right'>(null);

  // 리사이즈 및 로컬 스토리지 저장 Effect
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    setLeftWidth(readStoredNumber('todoapp-leftWidth', 280));
    setMidWidth(readStoredNumber('todoapp-midWidth', 360));
    const onChange = () => apply();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, [readStoredNumber]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-leftWidth', String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-midWidth', String(midWidth));
  }, [midWidth]);

  // 드래그 로직
  const startDrag = useCallback((kind: 'left-mid' | 'mid-right') => {
    draggingRef.current = kind;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const LEFT_MIN = 200, LEFT_MAX = 520, MID_MIN = 260, MID_MAX = 720;

      if (draggingRef.current === 'left-mid') {
        setLeftWidth(clamp(x, LEFT_MIN, LEFT_MAX));
      } else if (draggingRef.current === 'mid-right') {
        const next = x - leftWidth - 8;
        setMidWidth(clamp(next, MID_MIN, MID_MAX));
      }
    };
    const onUp = () => { if (draggingRef.current) endDrag(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [clamp, endDrag, leftWidth]);

  const onSeparatorKeyDown = useCallback((kind: 'left-mid' | 'mid-right', e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 30 : 10;
    const LEFT_MIN = 200, LEFT_MAX = 520, MID_MIN = 260, MID_MAX = 720;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (kind === 'left-mid') setLeftWidth(w => clamp(w - step, LEFT_MIN, LEFT_MAX));
      else setMidWidth(w => clamp(w - step, MID_MIN, MID_MAX));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (kind === 'left-mid') setLeftWidth(w => clamp(w + step, LEFT_MIN, LEFT_MAX));
      else setMidWidth(w => clamp(w + step, MID_MIN, MID_MAX));
    }
  }, [clamp]);
  
  // 폴더 목록 (일단 고정)
  const [folders] = useState<Folder[]>([
    { id: 1, name: '개인', icon: '👤' },
    { id: 2, name: '업무', icon: '💼' },
    { id: 3, name: '쇼핑목록', icon: '🛒' },
    { id: 4, name: '프로젝트', icon: '📁' },
  ]);

  // ⭐ 할 일 목록 (DB 연동을 위해 초기값 비움)
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

  // ⭐ 1. Supabase 데이터 가져오기 (Start 함수)
  const fetchTodos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('DB Error:', error);
    } else if (data) {
      // DB 컬럼(snake_case) -> UI 객체(camelCase) 변환
      const formattedTodos: Todo[] = data.map((item: any) => ({
        id: item.id,
        folderId: item.folder_id, // DB: folder_id -> UI: folderId
        title: item.title,
        content: item.content,
        date: item.date,
        isDone: item.is_done,     // DB: is_done -> UI: isDone
      }));
      setTodos(formattedTodos);
    }
    setIsLoading(false);
  };

  // 앱 시작 시 데이터 로딩
  useEffect(() => {
    fetchTodos();
  }, []);

  // 선택된 폴더 필터링
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

  // ⭐ 2. 할 일 토글 (DB Update)
  const toggleTodo = async (id: number) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;

    // 낙관적 업데이트 (UI 먼저 갱신)
    const newStatus = !target.isDone;
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, isDone: newStatus } : todo
    ));

    // DB 업데이트
    const { error } = await supabase
      .from('todos')
      .update({ is_done: newStatus }) // DB 컬럼명 주의
      .eq('id', id);
      
    if (error) console.error('Toggle Error:', error);
  };

  // ⭐ 3. 새 할 일 추가 (DB Insert)
  const addTodo = async () => {
    if (newTitle.trim() === '') return;

    const targetFolderId = selectedFolderId === 0 ? lastRealFolderId : selectedFolderId;
    
    // DB에 넣을 데이터 객체
    const newTodoData = {
      title: newTitle,
      folder_id: targetFolderId,
      date: newDate || null,
      is_done: false,
    };

    // DB Insert
    const { data, error } = await supabase
      .from('todos')
      .insert(newTodoData)
      .select() // 방금 넣은 데이터(ID 포함)를 다시 받아옴
      .single();

    if (error) {
      console.error('Insert Error:', error);
      return;
    }

    if (data) {
      // UI 리스트에 추가 (변환 과정 필요)
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

  // 네비게이션 함수들
  const selectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
    if (folderId !== 0) setLastRealFolderId(folderId);
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

  return (
    <div ref={containerRef} className="h-screen bg-gray-100 flex overflow-hidden">
      
      {/* ========== 1. 폴더 목록 (왼쪽) ========== */}
      <div style={isDesktop ? { width: `${leftWidth}px` } : undefined} className={`
        w-full md:w-auto bg-white border-r flex-shrink-0
        ${mobileView !== 'folders' ? 'hidden md:block' : 'block'}
      `}>
        <div className="p-4 border-b bg-blue-600 text-white">
          <h1 className="text-xl font-bold">📝 TaskDex</h1>
        </div>
        
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">폴더</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => selectFolder(0)}
                className={`
                    w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer
                    ${selectedFolderId === 0
                      ? 'bg-blue-100 text-blue-700 font-medium hover:bg-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'}
                  `}
              >
                <span>📂</span>
                <span>전체</span>
              </button>
            </li>
            {folders.map(folder => (
              <li key={folder.id}>
                <button
                  onClick={() => selectFolder(folder.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer
                    ${selectedFolderId === folder.id 
                      ? 'bg-blue-100 text-blue-700 font-medium hover:bg-blue-200' 
                      : 'hover:bg-gray-100 text-gray-700'}
                  `}
                >
                  <span>{folder.icon}</span>
                  <span>{folder.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 리사이즈 핸들 1 */}
      <div
        onMouseDown={(e) => { e.preventDefault(); startDrag('left-mid'); }}
        className="hidden md:block w-2 shrink-0 cursor-col-resize group bg-gray-50 hover:bg-gray-100"
      >
        <div className="h-full w-px mx-auto bg-gray-200 group-hover:bg-gray-300" />
      </div>

      {/* ========== 2. 항목 목록 (가운데) ========== */}
      <div style={isDesktop ? { width: `${midWidth}px` } : undefined} className={`
        w-full md:w-auto bg-white border-r flex flex-col
        ${mobileView !== 'items' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* 헤더 */}
        <div className="p-4 border-b flex items-center gap-3">
          <button onClick={goBack} className="md:hidden text-gray-600">←</button>
          <div>
            <h2 className="font-bold text-lg">{selectedFolderName}</h2>
            <p className="text-sm text-gray-500">
              {isLoading ? '로딩 중...' : `${currentFolderTodos.length}개 항목`}
            </p>
          </div>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-gray-400">Loading...</div>
          ) : (
            <ul>
              {currentFolderTodos.map(todo => (
                <li key={todo.id}>
                  <button
                    onClick={() => selectTodo(todo.id)}
                    className={`
                      w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition cursor-pointer
                      ${selectedTodoId === todo.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${todo.isDone ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                      `}>
                        {todo.isDone && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${todo.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {todo.title}
                          {selectedFolderId === 0 && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {folderNameById[todo.folderId] ?? '미지정'}
                            </span>
                          )}
                        </p>
                        {todo.date && (
                          <p className="text-xs text-gray-500 mt-1">📅 {todo.date}</p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 입력창 */}
        <div className="p-4 border-t bg-gray-50">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="새 할 일..."
            className="w-full px-3 py-2 mb-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addTodo}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              + 추가
            </button>
          </div>
        </div>
      </div>

      {/* 리사이즈 핸들 2 */}
      <div
        onMouseDown={(e) => { e.preventDefault(); startDrag('mid-right'); }}
        className="hidden md:block w-2 shrink-0 cursor-col-resize group bg-gray-50 hover:bg-gray-100"
      >
        <div className="h-full w-px mx-auto bg-gray-200 group-hover:bg-gray-300" />
      </div>

      {/* ========== 3. 상세 내용 (오른쪽) ========== */}
      <div className={`
        flex-1 bg-white flex flex-col
        ${mobileView !== 'detail' ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedTodo ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 md:hidden">
              <button onClick={goBack} className="text-gray-600">←</button>
              <h2 className="font-bold text-lg">상세</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 mb-6">
                  <div 
                    onClick={() => toggleTodo(selectedTodo.id)}
                    className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 mt-1
                      ${selectedTodo.isDone ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                    `}
                  >
                    {selectedTodo.isDone && <span className="text-white">✓</span>}
                  </div>
                  <h1 className={`text-2xl font-bold ${selectedTodo.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {selectedTodo.title}
                  </h1>
                </div>

                {selectedTodo.date && (
                  <div className="mb-6 flex items-center gap-2 text-gray-600">
                    <span>📅</span>
                    <span>{selectedTodo.date}</span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">메모</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedTodo.content || '내용이 없습니다.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-6xl mb-4">📝</p>
              <p>항목을 선택하세요</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}