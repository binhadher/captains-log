'use client';

import { useState, useCallback } from 'react';

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
  }, []);

  const onComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, trigger, onComplete };
}
