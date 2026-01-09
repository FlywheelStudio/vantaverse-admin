'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { getProgramAssignmentByTemplateId } from '@/app/(authenticated)/builder/actions';

interface BuilderContextValue {
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  clearSelectedTemplate: () => void;
  schedule: SelectedItem[][][]; // [week][day][items]
  currentWeek: number;
  programAssignmentId: string | null;
  programStartDate: string | null;
  setProgramStartDate: (date: string | null) => void;
  resetProgramAssignmentId: () => void;
  setScheduleItem: (week: number, day: number, items: SelectedItem[]) => void;
  setCurrentWeek: (week: number) => void;
  getDayItems: (week: number, day: number) => SelectedItem[];
  hasChanges: (week: number, day: number) => boolean;
  initializeSchedule: (weeks: number) => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

const STORAGE_KEY = 'builder-selected-template-id';
const SCHEDULE_STORAGE_KEY = 'builder-schedule';
const CURRENT_WEEK_STORAGE_KEY = 'builder-current-week';
const PROGRAM_ASSIGNMENT_STORAGE_KEY = 'builder-program-assignment-id';
const PROGRAM_START_DATE_STORAGE_KEY = 'builder-program-start-date';

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

  const [schedule, setScheduleState] = useState<SelectedItem[][][]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [currentWeek, setCurrentWeekState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(CURRENT_WEEK_STORAGE_KEY);
      if (stored) {
        const week = parseInt(stored, 10);
        return isNaN(week) ? 0 : week;
      }
    }
    return 0;
  });

  const [programAssignmentId, setProgramAssignmentIdState] = useState<
    string | null
  >(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
    }
    return null;
  });

  const [programStartDate, setProgramStartDateState] = useState<string | null>(
    () => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(PROGRAM_START_DATE_STORAGE_KEY);
      }
      return null;
    },
  );

  // Initialize as hydrated if on client, false on server
  const [isHydrated] = useState(() => typeof window !== 'undefined');

  // Fetch program assignment when template ID changes
  useEffect(() => {
    if (selectedTemplateId && typeof window !== 'undefined') {
      getProgramAssignmentByTemplateId(selectedTemplateId)
        .then((result) => {
          if (result.success && result.data) {
            setProgramAssignmentIdState(result.data.id);
            sessionStorage.setItem(
              PROGRAM_ASSIGNMENT_STORAGE_KEY,
              result.data.id,
            );
          } else {
            setProgramAssignmentIdState(null);
            sessionStorage.removeItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
          }
        })
        .catch(() => {
          setProgramAssignmentIdState(null);
          sessionStorage.removeItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
        });
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
      }
      setTimeout(() => {
        setProgramAssignmentIdState(null);
      }, 0);
    }
  }, [selectedTemplateId]);

  const setSelectedTemplateId = (id: string | null) => {
    setSelectedTemplateIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem(STORAGE_KEY, id);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
        sessionStorage.removeItem(CURRENT_WEEK_STORAGE_KEY);
        sessionStorage.removeItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
        sessionStorage.removeItem(PROGRAM_START_DATE_STORAGE_KEY);
        setScheduleState([]);
        setCurrentWeekState(0);
        setProgramAssignmentIdState(null);
        setProgramStartDateState(null);
      }
    }
  };

  const clearSelectedTemplate = () => {
    setSelectedTemplateId(null);
  };

  const initializeSchedule = useCallback((weeks: number) => {
    if (weeks <= 0) return;

    const newSchedule: SelectedItem[][][] = Array.from({ length: weeks }, () =>
      Array.from({ length: 7 }, () => []),
    );

    setScheduleState(newSchedule);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(newSchedule));
    }
  }, []);

  const setScheduleItem = useCallback(
    (week: number, day: number, items: SelectedItem[]) => {
      setScheduleState((prev) => {
        // Ensure schedule has enough weeks
        const updated = [...prev];
        while (updated.length <= week) {
          updated.push(Array.from({ length: 7 }, () => []));
        }

        // Ensure week has enough days
        while (updated[week].length <= day) {
          updated[week].push([]);
        }

        // Update the specific day
        updated[week] = [...updated[week]];
        updated[week][day] = items;

        // Persist to sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
        }

        return updated;
      });
    },
    [],
  );

  const getDayItems = useCallback(
    (week: number, day: number): SelectedItem[] => {
      if (week < 0 || day < 0 || day >= 7) return [];
      if (week >= schedule.length) return [];
      if (day >= schedule[week].length) return [];
      return schedule[week][day] || [];
    },
    [schedule],
  );

  const hasChanges = useCallback(
    (week: number, day: number): boolean => {
      const currentItems = getDayItems(week, day);
      return currentItems.length > 0;
    },
    [getDayItems],
  );

  const setCurrentWeek = useCallback((week: number) => {
    setCurrentWeekState(week);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CURRENT_WEEK_STORAGE_KEY, week.toString());
    }
  }, []);

  const setProgramStartDate = useCallback((date: string | null) => {
    setProgramStartDateState(date);
    if (typeof window !== 'undefined') {
      if (date) {
        sessionStorage.setItem(PROGRAM_START_DATE_STORAGE_KEY, date);
      } else {
        sessionStorage.removeItem(PROGRAM_START_DATE_STORAGE_KEY);
      }
    }
  }, []);

  const resetProgramAssignmentId = useCallback(() => {
    setProgramAssignmentIdState(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PROGRAM_ASSIGNMENT_STORAGE_KEY);
    }
  }, []);

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
        schedule,
        currentWeek,
        programAssignmentId,
        programStartDate,
        setProgramStartDate,
        resetProgramAssignmentId,
        setScheduleItem,
        setCurrentWeek,
        getDayItems,
        hasChanges,
        initializeSchedule,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
