// src/components/TodoDetail.tsx
'use client';

import { Todo } from '@/types';

type Props = {
  todo: Todo | undefined;
  onToggleTodo: (id: number) => void;
  mobileView: string;
  onGoBack: () => void;
  ratio?: number;
};

export default function TodoDetail({
  todo,
  onToggleTodo,
  mobileView,
  onGoBack,
  ratio,
}: Props) {
  return (
    <div
      style={ratio !== undefined ? { flex: ratio, minWidth: 0 } : undefined}
      className={`
        bg-white flex flex-col
        ${ratio === undefined ? 'flex-1' : ''}
        ${mobileView !== 'detail' ? 'hidden md:flex' : 'flex'}
      `}
    >
      {todo ? (
        <>
          {/* 모바일 헤더 */}
          <div className="p-4 border-b flex items-center gap-3 md:hidden">
            <button onClick={onGoBack} className="text-gray-600">←</button>
            <h2 className="font-bold text-lg">상세</h2>
          </div>

          {/* 상세 내용 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {/* 체크박스 + 제목 */}
              <div className="flex items-start gap-3 mb-6">
                <div 
                  onClick={() => onToggleTodo(todo.id)}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 mt-1
                    ${todo.isDone ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                  `}
                >
                  {todo.isDone && <span className="text-white">✓</span>}
                </div>
                <h1 className={`text-2xl font-bold ${todo.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {todo.title}
                </h1>
              </div>

              {/* 날짜 */}
              {todo.date && (
                <div className="mb-6 flex items-center gap-2 text-gray-600">
                  <span>📅</span>
                  <span>{todo.date}</span>
                </div>
              )}

              {/* 메모 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">메모</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {todo.content || '내용이 없습니다.'}
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
  );
}
