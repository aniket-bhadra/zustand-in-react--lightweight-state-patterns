# Learning Notes: 

## About This Repository

This repository serves as a personal resource to document my learning journey as I explore Zustand for state management in React.

These notes are primarily created for my own revision and to solidify my understanding of key concepts. However, they are structured in a way that can also help others understand Zustand and its various features, including state persistence, updating mechanisms, and different approaches to structuring stores.

## Installation

```sh
npm install zustand
```

## Setup a Store (`store.js`)

```js
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

export default useStore;
```

## Accessing the State Anywhere

```js
const { count, increment } = useStore();
```

## Storing State in `localStorage` / `sessionStorage`

We can achieve this with the `persist` middleware:

```js
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        name: 'counter-storage',
        storage: createJSONStorage(() => sessionStorage),
      }
    )
  )
);
```

### Notes:
- Only **state properties** (like `habits`, `count`) are saved.
- Functions (like `removeHabit`, `addHabit`) **are not stored** because they can't be serialized.
- `createJSONStorage` converts data into JSON before storing it and back when retrieving it.
- If no storage is specified, Zustand defaults to `localStorage`.
- Functions remain in the store logic and are reinitialized when the store is set up again.

#### Example After Reload:
```js
const { habits, removeHabit, toggleHabit } = useHabitStore();
```
- `habits` is **loaded from `localStorage`/`sessionStorage`**.
- `removeHabit` and `toggleHabit` **come from the store logic**.

Zustand's `persist` middleware keeps `localStorage` in sync with the state.

---

## Updating the State

Use the `set()` method:

```js
set({ habits: [], yes: false }); // Replaces entire state
set(() => ({ isLoading: true })); // Updates only `isLoading`
```

### Updating Arrays in State
- Adding new elements: `[...existingElements, newElement]`
- Updating elements: **Don't use `.push()` directly**
  - Instead, reassign: `set({ habits: [...state.habits, newHabit] })`
  - Use methods that return new arrays: `.filter()`, `.map()`

#### Example - Removing an Item:

```js
const useStore = create((set) => ({
  count: 0,
  removeHabit: (id) => {
    //set used immediately
    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== id),
    }));
  },
}));
```

#### Example - Updating After an Async Operation:

```js
const useStore = create((set, get) => ({
  isLoading: false,
  fetchHabits: async () => {
    set(() => ({ isLoading: true }));

    try {
      const existingHabits = get().habits;
      if (existingHabits.length > 0) {
        set(() => ({ isLoading: false }));
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Fetching habits...");

      const mockHabits = [
        { id: "1", name: "Reading-books", frequency: "weekly", completedDates: [], createdAt: new Date().toISOString() },
        { id: "2", name: "Gaming", frequency: "weekly", completedDates: [], createdAt: new Date().toISOString() }
      ];
    //set used after an operation
      set(() => ({
        habits: mockHabits,
        isLoading: false,
      }));
    } catch (error) {
      set(() => ({ error: "Failed to fetch", isLoading: false }));
    }
  },
}));
```

### Notes:
- Always use `set()` for updates, whether immediate or after an operation.
- `get()` gives access to the current state but does not fetch from storage.
- Use `get()` inside `set()` for accessing the current state.
- Use `get()` outside `set()` to access global state directly.

---

## Managing Multiple States

### Using Slices

There are two ways to create slices in Zustand:

#### 1️⃣ Slices as Objects

```js
const useStore = create((set) => ({
  countSlice: {
    count: 0,
    setCount: (value) => set((state) => ({ countSlice: { ...state.countSlice, count: value } })),
  },
  taskSlice: {
    tasks: [],
    updateTask: (task) => set((state) => ({ taskSlice: { ...state.taskSlice, tasks: [...state.taskSlice.tasks, task] } })),
  },
}));

// Access 
const { count, setCount } = useStore((state) => state.countSlice);
const { tasks, updateTask } = useStore((state) => state.taskSlice);
```

#### 2️⃣ Slices as Functions

```js
const createCountSlice = (set) => ({
  count: 0,
  setCount: (value) => set(() => ({ count: value })),
});

const createTaskSlice = (set) => ({
  tasks: [],
  updateTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
});

const useStore = create((set) => ({
  ...createCountSlice(set),
  ...createTaskSlice(set),
}));

// Access
const { count, setCount } = useStore();
const { tasks, updateTask } = useStore();
```

### Key Differences
- **Object slices:** Stored inside the main store, requiring `(state.countSlice.count)`.
- **Function slices:** Directly merged into the store, allowing `useStore().count`.

---

## Creating Separate Stores

```js
const useCountStore = create((set) => ({
  count: 0,
  setCount: (value) => set({ count: value }),
}));

const useTaskStore = create((set) => ({
  tasks: [],
  updateTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
}));

// Access
const { count, setCount } = useCountStore();
const { tasks, updateTask } = useTaskStore();
```

