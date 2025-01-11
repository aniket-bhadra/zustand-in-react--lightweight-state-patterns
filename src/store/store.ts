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
  fetchHabits: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const useHabitStore = create<HabitState>()(
  devtools(
    persist(
      (set, get) => {
        return {
          habits: [],
          yes: true,
          isLoading: false,
          error: null,
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
          fetchHabits: async () => {
            set(() => {
              return {
                isLoading: true,
              };
            });
            try {
              //checking- is habits exist already? if yes then no need to fetch,it automatically gets taken from localstorage,because of  persist middleware localstorage is in sync with the states all the time,no need to fetch if it is exist.

              //get() provides access to the current global state managed by Zustand, not directly from localStorage.
              // When the app reloads, Zustand hydrates (restores) state from localStorage before fetchHabits() runs.
              // So, get().habits checks the global state, which might have been restored from localStorage, but get() itself does not fetch from localStorage directly—it just accesses the Zustand store.

              const existingHabits = get().habits;
              if (existingHabits.length > 0) {
                set(() => {
                  return {
                    isLoading: false,
                  };
                });
                return;
              }

              await new Promise((resolve) => setTimeout(resolve, 1000));
              console.log("first");
              const mockHabits: Habit[] = [
                {
                  id: "1",
                  name: "Reading-books",
                  frequency: "weekly",
                  completedDates: [],
                  createdAt: new Date().toISOString(),
                },
                {
                  id: "2",
                  name: "gaming",
                  frequency: "weekly",
                  completedDates: [],
                  createdAt: new Date().toISOString(),
                },
              ];
              set(() => {
                return {
                  habits: mockHabits,
                  isLoading: false,
                };
              });
            } catch (error) {
              set(() => {
                return {
                  error: "Failed to fetch",
                  isLoading: false,
                };
              });
            }
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






