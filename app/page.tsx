// src/app/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useMemo, type KeyboardEvent } from 'react';

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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)'); // Tailwind md
    const apply = () => setIsDesktop(mq.matches);
    apply();

    // 초기 로드: localStorage -> state
    setLeftWidth(readStoredNumber('todoapp-leftWidth', 280));
    setMidWidth(readStoredNumber('todoapp-midWidth', 360));

    const onChange = () => apply();
    // Safari 호환
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
      const x = e.clientX - rect.left; // container 기준 x

      // 최소/최대 (px)
      const LEFT_MIN = 200;
      const LEFT_MAX = 520;
      const MID_MIN = 260;
      const MID_MAX = 720;

      if (draggingRef.current === 'left-mid') {
        setLeftWidth(clamp(x, LEFT_MIN, LEFT_MAX));
      } else if (draggingRef.current === 'mid-right') {
        // midWidth는 leftWidth + 핸들(대략 8px) 이후부터의 폭
        const next = x - leftWidth - 8;
        setMidWidth(clamp(next, MID_MIN, MID_MAX));
      }
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      endDrag();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [clamp, endDrag, leftWidth]);

  const onSeparatorKeyDown = useCallback((kind: 'left-mid' | 'mid-right', e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 30 : 10;

    // 최소/최대 (px)
    const LEFT_MIN = 200;
    const LEFT_MAX = 520;
    const MID_MIN = 260;
    const MID_MAX = 720;

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
  
  // 폴더 목록
  const [folders] = useState<Folder[]>([
    { id: 1, name: '개인', icon: '👤' },
    { id: 2, name: '업무', icon: '💼' },
    { id: 3, name: '쇼핑목록', icon: '🛒' },
    { id: 4, name: '프로젝트', icon: '📁' },
  ]);

  // 할 일 목록
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, folderId: 1, title: 'Unity 에셋 스토어 아이쇼핑', content: '새로운 파티클 이펙트 찾아보기', isDone: true, date: '2026-02-12' },
    { id: 2, folderId: 1, title: 'Next.js로 웹 앱 띄워보기', content: 'TypeScript와 Tailwind CSS 학습하기', isDone: false },
    { id: 3, folderId: 2, title: '프로젝트 기획서 작성', content: '다음 분기 로드맵 정리', isDone: false, date: '2026-02-14' },
    { id: 4, folderId: 2, title: '팀 미팅 준비', isDone: false, date: '2026-02-15' },
    { id: 5, folderId: 3, title: '우유', isDone: false },
    { id: 6, folderId: 3, title: '계란', isDone: true },
  ]);

  // 선택 상태
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [lastRealFolderId, setLastRealFolderId] = useState<number>(1);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(1);
  
  // 모바일 뷰 상태
  const [mobileView, setMobileView] = useState<MobileView>('folders');

  // 입력 상태
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  // 선택된 폴더의 할 일 목록
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
// 선택된 할 일
  const selectedTodo = todos.find(todo => todo.id === selectedTodoId);

  // 할 일 토글
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, isDone: !todo.isDone } : todo
    ));
  };

  // 새 할 일 추가
  const addTodo = () => {
    if (newTitle.trim() === '') return;
    
    const newTodo: Todo = {
      id: Date.now(),
      folderId: selectedFolderId === 0 ? lastRealFolderId : selectedFolderId,
      title: newTitle,
      isDone: false,
      ...(newDate && { date: newDate }),
    };
    
    setTodos([...todos, newTodo]);
    setNewTitle('');
    setNewDate('');
    setSelectedTodoId(newTodo.id);
  };

  // 폴더 선택
  const selectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
    if (folderId !== 0) setLastRealFolderId(folderId);
    setSelectedTodoId(null);
    setMobileView('items');
  };

  // 항목 선택
  const selectTodo = (todoId: number) => {
    setSelectedTodoId(todoId);
    setMobileView('detail');
  };

  // 뒤로가기
  const goBack = () => {
    if (mobileView === 'detail') {
      setMobileView('items');
    } else if (mobileView === 'items') {
      setMobileView('folders');
    }
  };

  return (
    <div ref={containerRef} className="h-screen bg-gray-100 flex overflow-hidden">
      
      {/* ========== 데스크톱: 3단 레이아웃 ========== */}
      {/* 왼쪽: 폴더 목록 */}
      <div style={isDesktop ? { width: `${leftWidth}px` } : undefined} className={`
        w-full md:w-auto bg-white border-r flex-shrink-0
        ${mobileView !== 'folders' ? 'hidden md:block' : 'block'}
      `}>
        <div className="p-4 border-b bg-blue-600 text-white">
          <h1 className="text-xl font-bold">📝 Todo App</h1>
        </div>
        
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">폴더</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => selectFolder(0)}
                className={`
                    w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
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
                    w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
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

      {/* 데스크톱 리사이즈 핸들: 폴더 <-> 항목 */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize left panel"
        tabIndex={0}
        onMouseDown={(e) => { e.preventDefault(); startDrag('left-mid'); }}
        onKeyDown={(e) => onSeparatorKeyDown('left-mid', e)}
        className="hidden md:block w-2 shrink-0 cursor-col-resize group focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="h-full w-px mx-auto bg-gray-200 group-hover:bg-gray-300" />
      </div>

      {/* 가운데: 항목 목록 */}
      <div style={isDesktop ? { width: `${midWidth}px` } : undefined} className={`
        w-full md:w-auto bg-white border-r flex flex-col
        ${mobileView !== 'items' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* 모바일 헤더 (뒤로가기 버튼) */}
        <div className="p-4 border-b flex items-center gap-3 md:hidden">
          <button onClick={goBack} className="text-gray-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
            ← 
          </button>
          <h2 className="font-bold text-lg">
            {selectedFolderName}
          </h2>
        </div>

        {/* 데스크톱 헤더 */}
        <div className="hidden md:block p-4 border-b">
          <h2 className="font-bold text-lg">
            {selectedFolderName}
          </h2>
          <p className="text-sm text-gray-500">{currentFolderTodos.length}개 항목</p>
        </div>

        {/* 항목 목록 */}
        <div className="flex-1 overflow-y-auto">
          <ul>
            {currentFolderTodos.map(todo => (
              <li key={todo.id}>
                <button
                  onClick={() => selectTodo(todo.id)}
                  className={`
                    w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
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
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">📁 {folderNameById[todo.folderId] ?? '미지정'}</span>
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
        </div>

        {/* 새 항목 추가 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="새 할 일..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addTodo}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + 추가
            </button>
          </div>
        </div>
      </div>

      {/* 데스크톱 리사이즈 핸들: 항목 <-> 상세 */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize middle panel"
        tabIndex={0}
        onMouseDown={(e) => { e.preventDefault(); startDrag('mid-right'); }}
        onKeyDown={(e) => onSeparatorKeyDown('mid-right', e)}
        className="hidden md:block w-2 shrink-0 cursor-col-resize group focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="h-full w-px mx-auto bg-gray-200 group-hover:bg-gray-300" />
      </div>

      {/* 오른쪽: 상세 내용 */}
      <div className={`
        flex-1 bg-white flex flex-col
        ${mobileView !== 'detail' ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedTodo ? (
          <>
            {/* 모바일 헤더 */}
            <div className="p-4 border-b flex items-center gap-3 md:hidden">
              <button onClick={goBack} className="text-gray-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500">
                ←
              </button>
              <h2 className="font-bold text-lg">상세</h2>
            </div>

            {/* 상세 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {/* 체크박스 + 제목 */}
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
                  {selectedFolderId === 0 && (
                    <p className="text-sm text-gray-500 mt-1"> 📁 {folderNameById[selectedTodo.folderId] ?? '미지정'}</p>
                  )}
                </div>

                {/* 날짜 */}
                {selectedTodo.date && (
                  <div className="mb-6 flex items-center gap-2 text-gray-600">
                    <span>📅</span>
                    <span>{selectedTodo.date}</span>
                  </div>
                )}

                {/* 내용 */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">메모</h3>
                  {selectedTodo.content ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTodo.content}</p>
                  ) : (
                    <p className="text-gray-400 italic">내용이 없습니다.</p>
                  )}
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