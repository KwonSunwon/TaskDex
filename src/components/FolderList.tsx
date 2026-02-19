// src/components/FolderList.tsx
'use client';

import { Folder } from '@/types';

export type SmartView = 'today' | 'week' | 'all';

type Props = {
  folders: Folder[];
  selectedFolderId: number;
  selectedSmartView: SmartView | null;
  onSelectFolder: (id: number) => void;
  onSelectSmartView: (view: SmartView) => void;
  mobileView: string;
};

const SMART_VIEWS: { key: SmartView; icon: string; label: string }[] = [
  { key: 'today', icon: '☀️', label: '오늘' },
  { key: 'week',  icon: '📅', label: '이번 주' },
  { key: 'all',   icon: '📂', label: '전체' },
];

export default function FolderList({
  folders,
  selectedFolderId,
  selectedSmartView,
  onSelectFolder,
  onSelectSmartView,
  mobileView,
}: Props) {
  return (
    <div
      className={`
        w-full md:w-[240px] md:min-w-[240px] md:max-w-[240px]
        bg-white border-r flex-shrink-0 flex flex-col
        ${mobileView !== 'folders' ? 'hidden md:flex' : 'flex'}
      `}
    >
      {/* 헤더 */}
      <div className="p-4 border-b bg-blue-600 text-white">
        <h1 className="text-xl font-bold">📝 TaskDex</h1>
      </div>

      {/* 스마트 뷰 */}
      <div className="p-4 border-b">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">일정</h2>
        <ul className="space-y-1">
          {SMART_VIEWS.map(({ key, icon, label }) => (
            <li key={key}>
              <button
                onClick={() => onSelectSmartView(key)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer
                  ${selectedSmartView === key
                    ? 'bg-blue-100 text-blue-700 font-medium hover:bg-blue-200'
                    : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 폴더 목록 */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">폴더</h2>
        <ul className="space-y-1">
          {folders.map(folder => (
            <li key={folder.id}>
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer
                  ${selectedSmartView === null && selectedFolderId === folder.id
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
  );
}
