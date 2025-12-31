'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isExpanded: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  isExpanded: true,
  toggle: () => {},
  open: () => {},
  close: () => {},
  expand: () => {},
  collapse: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const toggle = () => setIsOpen((prev) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return (
    <SidebarContext.Provider
      value={{ isOpen, isExpanded, toggle, open, close, expand, collapse }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
