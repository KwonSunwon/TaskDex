// src/hooks/useResizable.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useResizable() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [midWidth, setMidWidth] = useState<number>(360);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'mid-right'>(null);

  const readStoredNumber = useCallback((key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  }, []);

  const clamp = useCallback((v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
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
    window.localStorage.setItem('todoapp-midWidth', String(midWidth));
  }, [midWidth]);

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
    const LEFT_PANEL_WIDTH = 240; // 고정 너비
    const HANDLE_WIDTH = 8;

    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const MID_MIN = 260, MID_MAX = 720;

      if (draggingRef.current === 'mid-right') {
        const next = x - LEFT_PANEL_WIDTH - HANDLE_WIDTH;
        setMidWidth(clamp(next, MID_MIN, MID_MAX));
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
    midWidth,
    containerRef,
    startDrag,
  };
}