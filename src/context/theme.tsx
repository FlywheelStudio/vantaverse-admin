'use client';

import {
  ThemeProvider as NextThemeProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from 'next-themes';
import { createContext, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | undefined;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: undefined,
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeContextProviderProps {
  children: ReactNode;
}

function ThemeContextProvider({
  children,
}: ThemeContextProviderProps): React.ReactElement {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  const handleSetTheme = (newTheme: Theme): void => {
    setNextTheme(newTheme);
  };

  const handleToggleTheme = (): void => {
    const currentResolved: 'light' | 'dark' =
      resolvedTheme === 'dark' ? 'dark' : 'light';
    const nextTheme: Theme = currentResolved === 'light' ? 'dark' : 'light';
    setNextTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: (theme as Theme) || 'system',
        resolvedTheme: resolvedTheme as 'light' | 'dark' | undefined,
        setTheme: handleSetTheme,
        toggleTheme: handleToggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({
  children,
  ...props
}: {
  children: ReactNode;
} & Omit<ThemeProviderProps, 'children'>): React.ReactElement {
  return (
    <NextThemeProvider {...props}>
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </NextThemeProvider>
  );
}
