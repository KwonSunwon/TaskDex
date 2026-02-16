// src/components/ResizeHandle.tsx
'use client';

type Props = {
  onMouseDown: (e: React.MouseEvent) => void;
};

export default function ResizeHandle({ onMouseDown }: Props) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="hidden md:block w-2 shrink-0 cursor-col-resize group bg-gray-50 hover:bg-gray-100"
    >
      <div className="h-full w-px mx-auto bg-gray-200 group-hover:bg-gray-300" />
    </div>
  );
}
