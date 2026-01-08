'use client';

import React, { createContext, useContext, useState } from 'react';

interface BuilderContextValue {
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  clearSelectedTemplate: () => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

const STORAGE_KEY = 'builder-selected-template-id';

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder must be used within BuilderContextProvider');
  }
  return context;
}

interface BuilderContextProviderProps {
  children: React.ReactNode;
}

export function BuilderContextProvider({
  children,
}: BuilderContextProviderProps) {
  // Lazy initialization: read from sessionStorage only on first render
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<
    string | null
  >(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Initialize as hydrated if on client, false on server
  const [isHydrated] = useState(() => typeof window !== 'undefined');

  const setSelectedTemplateId = (id: string | null) => {
    setSelectedTemplateIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem(STORAGE_KEY, id);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const clearSelectedTemplate = () => {
    setSelectedTemplateId(null);
  };

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <BuilderContext.Provider
      value={{
        selectedTemplateId,
        setSelectedTemplateId,
        clearSelectedTemplate,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
