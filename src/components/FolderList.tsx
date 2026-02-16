// src/components/FolderList.tsx
'use client';

import { Folder } from '@/types';

type Props = {
  folders: Folder[];
  selectedFolderId: number;
  onSelectFolder: (id: number) => void;
  mobileView: string;
  width?: number;
};

export default function FolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
  mobileView,
  width,
}: Props) {
  return (
    <div 
      style={width ? { width: `${width}px` } : undefined}
      className={`
        w-full md:w-auto bg-white border-r flex-shrink-0
        ${mobileView !== 'folders' ? 'hidden md:block' : 'block'}
      `}
    >
      {/* 헤더 */}
      <div className="p-4 border-b bg-blue-600 text-white">
        <h1 className="text-xl font-bold">📝 TaskDex</h1>
      </div>
      
      {/* 폴더 목록 */}
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">폴더</h2>
        <ul className="space-y-1">
          {/* 전체 폴더 */}
          <li>
            <button
              onClick={() => onSelectFolder(0)}
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
          
          {/* 개별 폴더들 */}
          {folders.map(folder => (
            <li key={folder.id}>
              <button
                onClick={() => onSelectFolder(folder.id)}
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
  );
}
