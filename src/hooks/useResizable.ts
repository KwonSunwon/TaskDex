// src/hooks/useResizable.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LEFT_PANEL_EXPANDED = 240;
const LEFT_PANEL_COLLAPSED = 60;
const HANDLE_WIDTH = 8;

export function useResizable() {
  const [isDesktop, setIsDesktop] = useState(false);

  // FolderList 접힘 여부 (토글)
  const [isLeftCollapsed, _setIsLeftCollapsed] = useState(false);
  const isLeftCollapsedRef = useRef(false); // 이벤트 핸들러 stale closure 방지

  // TodoList / TodoDetail 비율 (0.0 ~ 1.0)
  const [midRatio, setMidRatio] = useState<number>(0.4);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'mid-right'>(null);

  const clamp = useCallback((v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
  }, []);

  const readStoredNumber = useCallback((key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  }, []);

  const readStoredBool = useCallback((key: string, fallback: boolean) => {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  }, []);

  // 초기화 및 미디어 쿼리
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();

    const collapsed = readStoredBool('todoapp-leftCollapsed', false);
    isLeftCollapsedRef.current = collapsed;
    _setIsLeftCollapsed(collapsed);
    setMidRatio(readStoredNumber('todoapp-midRatio', 0.4));

    const onChange = () => apply();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, [readStoredBool, readStoredNumber]);

  // localStorage 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-leftCollapsed', String(isLeftCollapsed));
  }, [isLeftCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-midRatio', String(midRatio));
  }, [midRatio]);

  // FolderList 접힘 토글
  const toggleLeft = useCallback(() => {
    const next = !isLeftCollapsedRef.current;
    isLeftCollapsedRef.current = next;
    _setIsLeftCollapsed(next);
  }, []);

  const startDrag = useCallback((kind: 'mid-right') => {
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

      if (draggingRef.current === 'mid-right') {
        const leftW = isLeftCollapsedRef.current ? LEFT_PANEL_COLLAPSED : LEFT_PANEL_EXPANDED;
        const available = rect.width - leftW - HANDLE_WIDTH;
        if (available > 0) {
          const listWidth = x - leftW;
          const newRatio = listWidth / available;
          setMidRatio(clamp(newRatio, 0.15, 0.80));
        }
      }
    };

    const onUp = () => {
      if (draggingRef.current) endDrag();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [clamp, endDrag]);

  return {
    isDesktop,
    isLeftCollapsed,
    toggleLeft,
    midRatio,
    containerRef,
    startDrag,
  };
}
