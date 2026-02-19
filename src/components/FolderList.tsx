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
  isCollapsed?: boolean;
  onToggle?: () => void;
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
  isCollapsed = false,
  onToggle,
}: Props) {
  return (
    <div
      className={`
        bg-white border-r flex-shrink-0 flex flex-col overflow-hidden
        md:transition-[width] md:duration-200
        ${isCollapsed
          ? 'w-full md:w-[60px] md:min-w-[60px] md:max-w-[60px]'
          : 'w-full md:w-[240px] md:min-w-[240px] md:max-w-[240px]'}
        ${mobileView !== 'folders' ? 'hidden md:flex' : 'flex'}
      `}
    >
      {isCollapsed ? (
        /* ── 아이콘 전용 모드 ── */
        <div className="flex flex-col items-center py-3 gap-1 overflow-y-auto flex-1">
          {/* 앱 아이콘 (클릭 시 확장) */}
          <button
            onClick={onToggle}
            title="TaskDex — 펼치기"
            className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-1 flex-shrink-0 hover:bg-blue-700 transition cursor-pointer"
          >
            <span className="text-base">📝</span>
          </button>

          <div className="w-8 border-t border-gray-200 my-1 flex-shrink-0" />

          {/* 스마트 뷰 */}
          {SMART_VIEWS.map(({ key, icon, label }) => (
            <button
              key={key}
              title={label}
              onClick={() => onSelectSmartView(key)}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-lg transition cursor-pointer flex-shrink-0
                ${selectedSmartView === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              {icon}
            </button>
          ))}

          <div className="w-8 border-t border-gray-200 my-1 flex-shrink-0" />

          {/* 폴더 목록 */}
          {folders.map(folder => (
            <button
              key={folder.id}
              title={folder.name}
              onClick={() => onSelectFolder(folder.id)}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-lg transition cursor-pointer flex-shrink-0
                ${selectedSmartView === null && selectedFolderId === folder.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              {folder.icon}
            </button>
          ))}
        </div>
      ) : (
        /* ── 전체 모드 ── */
        <>
          {/* 헤더 (클릭 시 접기) */}
          <button
            onClick={onToggle}
            className="p-4 border-b bg-blue-600 text-white w-full text-left hover:bg-blue-700 transition cursor-pointer flex-shrink-0 flex items-center justify-between"
          >
            <h1 className="text-xl font-bold truncate">📝 TaskDex</h1>
            <span className="text-sm opacity-70 ml-2 flex-shrink-0">◀</span>
          </button>

          {/* 스마트 뷰 */}
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider truncate">일정</h2>
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
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 폴더 목록 */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider truncate">폴더</h2>
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
                    <span className="truncate">{folder.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
