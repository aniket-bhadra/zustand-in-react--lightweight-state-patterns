import { Habit } from "./store";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
export interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  completedDates: string[];
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  yes: boolean;
  addHabit: (name: string, frequency: "weekly" | "daily") => void;
  toggleHabit: (id: string, date: string) => void;
  removeHabit: (id: string) => void;
}

const useHabitStore = create<HabitState>()(
  devtools(
    persist(
      (set) => {
        return {
          habits: [],
          yes: true,
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
          toggleHabit: (id, date) => {
            set((state) => {
              return {
                habits: state.habits.map((habit) => {
                  if (habit.id === id) {
                    return {
                      ...habit,
                      completedDates: habit.completedDates.includes(date)
                        ? habit.completedDates.filter(
                            (Habitdate) => Habitdate !== date
                          )
                        : [...habit.completedDates, date],
                    };
                  } else {
                    return habit;
                  }
                }),
              };
            });
          },
        };
      },
      {
        name: "habits",
        // storage: createJSONStorage(() => sessionStorage)
      }
    )
  )
);

export default useHabitStore;

// //here only the keys associated with data, like habits,yes,are persisted locally,not the key associated with methods like removeHabit,..
// createJSONStorage converts the data into JSON before storing it using the given storage API (like localStorage or sessionStorage). When retrieving data, it converts it back to its original format.

// Only state properties (like habits, yes) are saved, but functions (like removeHabit, addHabit) are not stored because they can't be serialized.

// If you don’t specify a storage key, Zustand will use localStorage by default, meaning all this process (conversion and storage) happens in localStorage.

// Functions are not stored but are reinitialized when Zustand runs the store setup again. functions remain in the store's logic, and only state (like habits) is stored and retrieved.

// const { habits, removeHabit, toggleHabit } = useHabitStore();   --here After reload:  
// - `habits` is **taken from `localStorage`/`sessionStorage`**.  
// - `removeHabit` and `toggleHabit` are **taken from the store's code** (not storage).