'use client';

import { createContext, useContext } from 'react';

interface DragContextValue {
  isDragging: boolean;
}

const DragContext = createContext<DragContextValue>({
  isDragging: false,
});

export function useDragContext() {
  return useContext(DragContext);
}

export const DragContextProvider = DragContext.Provider;
