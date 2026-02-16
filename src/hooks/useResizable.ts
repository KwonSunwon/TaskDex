// src/hooks/useResizable.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useResizable() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [leftWidth, setLeftWidth] = useState<number>(280);
  const [midWidth, setMidWidth] = useState<number>(360);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'left-mid' | 'mid-right'>(null);

  // 로컬 스토리지 읽기
  const readStoredNumber = useCallback((key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  }, []);

  // 값 제한
  const clamp = useCallback((v: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, v));
  }, []);

  // 데스크톱 감지 및 초기 로드
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();

    setLeftWidth(readStoredNumber('todoapp-leftWidth', 280));
    setMidWidth(readStoredNumber('todoapp-midWidth', 360));

    const onChange = () => apply();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, [readStoredNumber]);

  // 로컬 스토리지 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-leftWidth', String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todoapp-midWidth', String(midWidth));
  }, [midWidth]);

  // 드래그 시작
  const startDrag = useCallback((kind: 'left-mid' | 'mid-right') => {
    draggingRef.current = kind;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 드래그 종료
  const endDrag = useCallback(() => {
    draggingRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 드래그 이벤트
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const LEFT_MIN = 200, LEFT_MAX = 520, MID_MIN = 260, MID_MAX = 720;

      if (draggingRef.current === 'left-mid') {
        setLeftWidth(clamp(x, LEFT_MIN, LEFT_MAX));
      } else if (draggingRef.current === 'mid-right') {
        const next = x - leftWidth - 8;
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
  }, [clamp, endDrag, leftWidth]);

  return {
    isDesktop,
    leftWidth,
    midWidth,
    containerRef,
    startDrag,
  };
}
