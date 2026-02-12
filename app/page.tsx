// src/app/page.tsx

export default function Home() {
  
  // 1. 더미 데이터 (마치 DB에서 가져온 것처럼 흉내내기)
  // C#의 List<TodoItem>과 같습니다.
  const todos = [
    { id: 1, content: 'Unity 에셋 스토어 아이쇼핑', isDone: true },
    { id: 2, content: 'Next.js로 웹 앱 띄워보기', isDone: false },
    { id: 3, content: '맛있는 저녁 먹기', isDone: false },
  ];

  // 2. 화면 그리기 (Renderer)
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* 메인 카드 박스 */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden">
        
        {/* 헤더 영역 */}
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">오늘의 할 일</h1>
          <p className="opacity-80">Supabase 없이 UI만 테스트 중입니다.</p>
        </div>

        {/* 리스트 영역 */}
        <div className="p-6">
          <ul className="space-y-3">
            {/* foreach 문과 똑같습니다. todos 리스트를 돌면서 화면에 찍습니다. */}
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                {/* 체크박스 (모양만) */}
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${todo.isDone ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                `}>
                  {todo.isDone && <span className="text-white text-sm">✓</span>}
                </div>

                {/* 텍스트 */}
                <span className={`flex-1 ${todo.isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {todo.content}
                </span>
              </li>
            ))}
          </ul>

          {/* 추가 버튼 (모양만) */}
          <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            + 새 할 일 추가하기
          </button>
        </div>

      </div>
    </div>
  );
}