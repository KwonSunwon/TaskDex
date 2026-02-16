// src/components/TodoList.tsx
'use client';

import { Todo } from '@/types';

type Props = {
  todos: Todo[];
  selectedTodoId: number | null;
  selectedFolderId: number;
  folderName: string;
  folderNameById: Record<number, string>;
  isLoading: boolean;
  onSelectTodo: (id: number) => void;
  onAddTodo: () => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDate: string;
  setNewDate: (value: string) => void;
  mobileView: string;
  onGoBack: () => void;
  width?: number;
};

export default function TodoList({
  todos,
  selectedTodoId,
  selectedFolderId,
  folderName,
  folderNameById,
  isLoading,
  onSelectTodo,
  onAddTodo,
  newTitle,
  setNewTitle,
  newDate,
  setNewDate,
  mobileView,
  onGoBack,
  width,
}: Props) {
  return (
    <div 
      style={width ? { width: `${width}px` } : undefined}
      className={`
        w-full md:w-auto bg-white border-r flex flex-col
        ${mobileView !== 'items' ? 'hidden md:flex' : 'flex'}
      `}
    >
      {/* 헤더 */}
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onGoBack} className="md:hidden text-gray-600">←</button>
        <div>
          <h2 className="font-bold text-lg">{folderName}</h2>
          <p className="text-sm text-gray-500">
            {isLoading ? '로딩 중...' : `${todos.length}개 항목`}
          </p>
        </div>
      </div>

      {/* 항목 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <ul>
            {todos.map(todo => (
              <li key={todo.id}>
                <button
                  onClick={() => onSelectTodo(todo.id)}
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

      {/* 새 항목 추가 */}
      <div className="p-4 border-t bg-gray-50">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddTodo()}
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
            onClick={onAddTodo}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            + 추가
          </button>
        </div>
      </div>
    </div>
  );
}
