import { Habit } from "./store";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
export interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  completedDates: string[];
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  addHabit: (name: string, frequency: "weekly" | "daily") => void;
  toggleHabit: (id: string, date: string) => void;
  removeHabit: (id: string) => void;
}

const useHabitStore = create<HabitState>()(
  devtools((set) => {
    return {
      habits: [],
      addHabit: (name, frequency) => {
        set((state) => {
          return {
            habits: [
              ...state.habits,
              {
                id: Date.now().toString(),
                name,
                frequency,
                completedDates: [],
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
      removeHabit: (id) => {
        set((state) => {
          return {
            habits: state.habits.filter((habit) => {
              return habit.id !== id;
            }),
          };
        });
      },
    };
  })
);

export default useHabitStore;
