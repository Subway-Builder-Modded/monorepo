import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDropdownHoverState } from '@/components/app-shell/navigation/app-navbar/use-dropdown-hover-state';

describe('useDropdownHoverState', () => {
  it('opens on trigger enter and closes after hover leave timeout', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDropdownHoverState());

    act(() => {
      result.current.onTriggerMouseEnter({} as never);
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.onTriggerMouseLeave({} as never);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.open).toBe(false);
    vi.useRealTimers();
  });

  it('stays open while pointer is over content', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDropdownHoverState());

    act(() => {
      result.current.onTriggerPointerEnter({} as never);
      result.current.onTriggerPointerLeave({} as never);
      result.current.onContentPointerEnter({} as never);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.onContentPointerLeave({} as never);
      vi.advanceTimersByTime(100);
    });
    expect(result.current.open).toBe(false);
    vi.useRealTimers();
  });

  it('ignores menu close requests while hovered on trigger', () => {
    const { result } = renderHook(() => useDropdownHoverState());

    act(() => {
      result.current.onTriggerPointerEnter({} as never);
      result.current.setOpenFromMenu(false);
    });

    expect(result.current.open).toBe(true);
  });

  it('allows menu close requests when not hovered', () => {
    const { result } = renderHook(() => useDropdownHoverState());

    act(() => {
      result.current.setOpenFromMenu(true);
      result.current.onTriggerPointerLeave({} as never);
      result.current.onContentPointerLeave({} as never);
      result.current.setOpenFromMenu(false);
    });

    expect(result.current.open).toBe(false);
  });
});
