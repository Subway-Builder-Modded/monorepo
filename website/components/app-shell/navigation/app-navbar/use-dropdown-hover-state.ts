import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type PointerEventHandler,
} from 'react';

export type DropdownHoverState = {
  open: boolean;
  setOpenFromMenu: (nextOpen: boolean) => void;
  onTriggerPointerEnter: PointerEventHandler;
  onTriggerPointerLeave: PointerEventHandler;
  onTriggerMouseEnter: MouseEventHandler;
  onTriggerMouseLeave: MouseEventHandler;
  onContentPointerEnter: PointerEventHandler;
  onContentPointerLeave: PointerEventHandler;
};

export function useDropdownHoverState(): DropdownHoverState {
  const [open, setOpen] = useState(false);
  const triggerHoveredRef = useRef(false);
  const contentHoveredRef = useRef(false);
  const hoverCloseTimeoutRef = useRef<number | null>(null);

  const clearHoverClose = useCallback(() => {
    if (!hoverCloseTimeoutRef.current) return;
    window.clearTimeout(hoverCloseTimeoutRef.current);
    hoverCloseTimeoutRef.current = null;
  }, []);

  const openMenu = useCallback(() => {
    clearHoverClose();
    setOpen(true);
  }, [clearHoverClose]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const scheduleHoverClose = useCallback(() => {
    clearHoverClose();

    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      if (!triggerHoveredRef.current && !contentHoveredRef.current) {
        closeMenu();
      }
      hoverCloseTimeoutRef.current = null;
    }, 45);
  }, [clearHoverClose, closeMenu]);

  useEffect(() => {
    return () => {
      clearHoverClose();
    };
  }, [clearHoverClose]);

  const onTriggerPointerEnter: PointerEventHandler = useCallback(() => {
    triggerHoveredRef.current = true;
    openMenu();
  }, [openMenu]);

  const onTriggerPointerLeave: PointerEventHandler = useCallback(() => {
    triggerHoveredRef.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  const onTriggerMouseEnter: MouseEventHandler = useCallback(() => {
    triggerHoveredRef.current = true;
    openMenu();
  }, [openMenu]);

  const onTriggerMouseLeave: MouseEventHandler = useCallback(() => {
    triggerHoveredRef.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  const onContentPointerEnter: PointerEventHandler = useCallback(() => {
    contentHoveredRef.current = true;
    openMenu();
  }, [openMenu]);

  const onContentPointerLeave: PointerEventHandler = useCallback(() => {
    contentHoveredRef.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  const setOpenFromMenu = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openMenu();
        return;
      }
      if (triggerHoveredRef.current || contentHoveredRef.current) {
        return;
      }
      closeMenu();
    },
    [closeMenu, openMenu],
  );

  return {
    open,
    setOpenFromMenu,
    onTriggerPointerEnter,
    onTriggerPointerLeave,
    onTriggerMouseEnter,
    onTriggerMouseLeave,
    onContentPointerEnter,
    onContentPointerLeave,
  };
}
