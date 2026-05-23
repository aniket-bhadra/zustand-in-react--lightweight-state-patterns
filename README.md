# Zustand State Management Guide

## Table of Contents

1. [Installation](#installation)
2. [Setup a Store](#setup-a-store-storejs)
3. [Accessing the State Anywhere](#accessing-the-state-anywhere)
4. [Storing State in localStorage / sessionStorage](#storing-state-in-localstorage--sessionstorage)
   - [How Persist Middleware Works](#how-persist-middleware-works)
   - [What Gets Stored](#what-gets-stored)
   - [Example After Reload](#example-after-reload)
5. [Updating the State](#updating-the-state)
   - [Basic Updates with set()](#basic-updates-with-set)
   - [Updating Arrays in State](#updating-arrays-in-state)
   - [Removing Items from State](#removing-items-from-state)
   - [Updating After Async Operations](#updating-after-async-operations)
6. [Using get() to Access Current State](#using-get-to-access-current-state)
7. [Managing Multiple States](#managing-multiple-states)
   - [Using Slices](#using-slices)
   - [Slices as Objects](#slices-as-objects)
   - [Slices as Functions](#slices-as-functions)
   - [Key Differences Between Slice Approaches](#key-differences-between-slice-approaches)
8. [Creating Separate Stores](#creating-separate-stores)
9. [Zustand vs Redux: Key Differences](#zustand-vs-redux-key-differences)
10. [Best Practices](#best-practices)
11. [Selecting Multiple Values with useShallow](#selecting-multiple-values-with-useshallow)

---

## Installation

```sh
npm install zustand
```

---

## Setup a Store (`store.js`)

```js
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

export default useStore;
```

**How it works:**

- `create()` accepts a function that receives `set` (and optionally `get`) as parameters.
- The function returns an object containing:
  - **State properties** (e.g., `count: 0`)
  - **Actions** (functions that update state, e.g., `increment`)
- The result is a **custom React hook** (`useStore`) that can be used in any component.

---

## Accessing the State Anywhere

```js
import useStore from "./store";

function Counter() {
  const { count, increment } = useStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Key points:**

- Call `useStore()` inside React components (follows React Hooks rules).
- Destructure only the state and actions you need.
- Components automatically re-render when subscribed state changes.

### Selective Subscriptions (Performance Optimization)

Instead of subscribing to the entire store:

```js
// ❌ Subscribes to ALL state changes (will re-render even if only 'tasks' changes)
const { count, increment, tasks } = useStore();

// ✅ Only subscribes to 'count' changes
const count = useStore((state) => state.count);
const increment = useStore((state) => state.increment);
```

**Why this matters:**

- Using a selector function `(state) => state.count` means the component only re-renders when `count` changes.
- Improves performance in apps with large state objects.

---

## Storing State in `localStorage` / `sessionStorage`

We can achieve this with the `persist` middleware:

```js
import { create } from "zustand";
import { persist, devtools, createJSONStorage } from "zustand/middleware";

const useStore = create(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        name: "counter-storage", // Key name in localStorage/sessionStorage
        storage: createJSONStorage(() => sessionStorage), // Choose storage type
      },
    ),
  ),
);

export default useStore;
```

### How Persist Middleware Works

1. **On state change:** The middleware serializes the state to JSON and saves it to storage.
2. **On page load:** The middleware checks if data exists in storage under the specified `name` key.
3. **If found:** Deserializes the JSON and merges it into the store's initial state.
4. **If not found:** Uses the default initial state defined in the store.

### What Gets Stored

By default, the whole state is passed to `JSON.stringify`, so **only state properties end up stored** (functions are dropped during serialization):

```js
{
  count: 0,
  habits: [],
  isLoading: false
}
```

**Functions are NOT stored** because:

- Functions cannot be serialized to JSON.
- They are part of the store logic, not data.
- They are automatically recreated when the store initializes.

**How `createJSONStorage` works:**

- Converts state to JSON string before saving: `JSON.stringify(state)`
- Converts JSON string back to object when loading: `JSON.parse(jsonString)`
- Provides a consistent interface for different storage backends.

**Storage defaults:**

- If you don't specify `storage`, Zustand defaults to `localStorage`.
- To use `sessionStorage`: `storage: createJSONStorage(() => sessionStorage)`
- To use custom storage: Provide an object with `getItem`, `setItem`, and `removeItem` methods.

### Example After Reload

```js
const { habits, removeHabit, toggleHabit } = useHabitStore();
```

**What happens:**

- `habits` is **loaded from `localStorage`/`sessionStorage`** (data persists).
- `removeHabit` and `toggleHabit` **come from the store definition** (functions are recreated).

**Key insight:** Zustand's `persist` middleware automatically keeps storage in sync with state, so you don't need to manually save/load data.

---

## Updating the State

### Basic Updates with set()

Use the `set()` method to update state. **`set()` shallow-merges** what you give it into the existing state, so properties you don't mention are kept:

```js
// Object form - merges with existing state, other properties are preserved
set({ isLoading: true });

// Function form - use it when the new value depends on the previous state
set((state) => ({ count: state.count + 1 }));
```

**Replacing the whole state (rarely needed):**

```js
// Passing `true` as the second argument REPLACES the state instead of merging.
// ⚠️ Use carefully - every property (including actions) must be provided!
set({ count: 0 }, true);
```

**Important notes:**

- Both the object form and the function form **merge** by default.
- Merging is **shallow** - nested objects are replaced, not merged (see [Slices as Objects](#slices-as-objects)).
- Use the function form `set((state) => ({ ... }))` when the update needs the current state; otherwise the object form is fine.

### Updating Arrays in State

**Zustand uses immutability** (like Redux), meaning you should create new arrays instead of mutating existing ones.

**Adding elements:**

```js
// ✅ Correct - creates new array
set((state) => ({ habits: [...state.habits, newHabit] }));

// ❌ Wrong - mutates existing array (can cause React to miss updates)
set((state) => {
  state.habits.push(newHabit);
  return { habits: state.habits };
});
```

**Why immutability matters:**

- React detects state changes by reference comparison.
- If you mutate the array directly, React might not detect the change.
- Creating a new array ensures React always sees the update.

**Array methods that create new arrays (safe to use):**

- `.filter()` - Remove items
- `.map()` - Update items
- `.concat()` or `[...array]` - Add items
- `.slice()` - Get subset

**Array methods that mutate (avoid in set()):**

- `.push()`, `.pop()`, `.shift()`, `.unshift()`
- `.splice()`, `.reverse()`, `.sort()`

### Removing Items from State

```js
const useStore = create((set) => ({
  habits: [],
  removeHabit: (id) => {
    // set() used immediately - synchronous update
    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== id),
    }));
  },
}));
```

**How this works:**

1. `set((state) => ...)` receives the current state.
2. `.filter()` creates a new array without the removed item.
3. State updates immediately.
4. Components subscribed to `habits` re-render.

### Updating After Async Operations

```js
const useStore = create((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,
  fetchHabits: async () => {
    // Set loading state before async operation
    set({ isLoading: true, error: null });

    try {
      // Access current state with get()
      const existingHabits = get().habits;

      if (existingHabits.length > 0) {
        set({ isLoading: false });
        return; // Exit early if data already loaded
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Fetching habits...");

      const mockHabits = [
        {
          id: "1",
          name: "Reading-books",
          frequency: "weekly",
          completedDates: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Gaming",
          frequency: "weekly",
          completedDates: [],
          createdAt: new Date().toISOString(),
        },
      ];

      // set() used after async operation completes
      set({ habits: mockHabits, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch", isLoading: false });
    }
  },
}));
```

**Key points:**

- **Always use `set()`** for updates, whether immediate or after async operations.
- Set loading states before async operations start.
- Handle both success and error cases.
- Clear loading states after operations complete.

---

## Using get() to Access Current State

The `get()` function provides access to the current state:

```js
const useStore = create((set, get) => ({
  count: 0,
  increment: () => {
    const currentCount = get().count; // Access current state
    console.log("Current count:", currentCount);
    set({ count: currentCount + 1 });
  },
}));
```

**Two ways to read the current state:**

### 1. Inside actions (using `get()` in the store definition):

```js
const useStore = create((set, get) => ({
  habits: [],
  addHabit: (habit) => {
    const currentHabits = get().habits; // Access state inside action
    set({ habits: [...currentHabits, habit] });
  },
}));
```

### 2. Outside React components (using `getState()` on the hook):

```js
// Access state outside of React components
const currentState = useStore.getState();
console.log("Current count:", currentState.count);

// Subscribe to changes outside React
const unsubscribe = useStore.subscribe((state) => {
  console.log("State changed:", state);
});
```

**Important notes:**

- **`get()` inside store:** Access current state within actions.
- **`useStore.getState()` outside store:** Access state imperatively (not reactive).
- **`get()` does NOT fetch from storage** - it returns the current in-memory state.
- For reactive updates in components, use the hook: `const count = useStore((state) => state.count);`

---

## Managing Multiple States

### Using Slices

Slices help organize large stores by splitting state into logical sections.

### Slices as Objects

```js
const useStore = create((set) => ({
  countSlice: {
    count: 0,
    setCount: (value) =>
      set((state) => ({
        countSlice: { ...state.countSlice, count: value },
      })),
  },
  taskSlice: {
    tasks: [],
    updateTask: (task) =>
      set((state) => ({
        taskSlice: {
          ...state.taskSlice,
          tasks: [...state.taskSlice.tasks, task],
        },
      })),
  },
}));

// Access with selectors
const { count, setCount } = useStore((state) => state.countSlice);
const { tasks, updateTask } = useStore((state) => state.taskSlice);
```

**Characteristics:**

- State is **nested** under slice names.
- Requires spreading the slice when updating (`set` only merges the top level): `{ ...state.countSlice, ... }`
- Access requires selector: `(state) => state.countSlice`

### Slices as Functions

```js
const createCountSlice = (set) => ({
  count: 0,
  setCount: (value) => set({ count: value }),
});

const createTaskSlice = (set) => ({
  tasks: [],
  updateTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
});

const useStore = create((set) => ({
  ...createCountSlice(set),
  ...createTaskSlice(set),
}));

// Direct access (no selectors needed)
const { count, setCount, tasks, updateTask } = useStore();
```

**Characteristics:**

- State is **flattened** (merged into root level).
- Cleaner updates: just `set({ count: value })`
- Direct access: `useStore()` or `useStore((state) => state.count)`
- Better for TypeScript (easier type inference)

### Key Differences Between Slice Approaches

| Feature             | Object Slices                                       | Function Slices                     |
| ------------------- | --------------------------------------------------- | ----------------------------------- |
| **State Structure** | Nested (`state.countSlice.count`)                   | Flat (`state.count`)                |
| **Access**          | Requires selector: `(state) => state.countSlice`    | Direct: `useStore()`                |
| **Updates**         | Must spread slice: `{ ...state.countSlice, count }` | Direct: `{ count: value }`          |
| **Organization**    | Groups state explicitly                             | Groups via separate files/functions |
| **TypeScript**      | More complex types                                  | Simpler type inference              |
| **Recommended for** | Small apps with clear boundaries                    | Large apps, better scalability      |

**When to use which:**

- **Object slices:** Small apps where you want explicit grouping in the state tree.
- **Function slices:** Medium to large apps where you need better organization and TypeScript support.

---

## Creating Separate Stores

For completely independent state domains, create separate stores:

```js
// stores/countStore.js
const useCountStore = create((set) => ({
  count: 0,
  setCount: (value) => set({ count: value }),
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// stores/taskStore.js
const useTaskStore = create((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
}));

// Usage in components
const { count, increment } = useCountStore();
const { tasks, addTask } = useTaskStore();
```

**Advantages of separate stores:**

- **Better code splitting:** Each store can be in its own file.
- **Independent subscriptions:** Components only re-render when their specific store changes.
- **Clearer separation:** Each store has its own responsibility.
- **Easier testing:** Test stores in isolation.

**When to use separate stores vs. slices:**

- **Separate stores:** Completely independent domains (e.g., user settings vs. shopping cart).
- **Slices:** Related domains that might need to interact (e.g., products and cart).

---

## Zustand vs Redux: Key Differences

| Feature             | Zustand                              | Redux                                    |
| ------------------- | ------------------------------------ | ---------------------------------------- |
| **Boilerplate**     | Minimal (no actions/reducers needed) | Verbose (actions, reducers, constants)   |
| **Setup**           | Single `create()` call               | Store, reducers, actions, middleware     |
| **State Updates**   | Direct with `set()`                  | Dispatch actions → reducers              |
| **Async**           | Built-in (just use async functions)  | Requires middleware (thunk, saga)        |
| **DevTools**        | Optional middleware                  | Built-in with Redux DevTools             |
| **TypeScript**      | Good (type the store once)           | Good (requires typed hooks/manual types) |
| **Learning Curve**  | Easy                                 | Steeper                                  |
| **Bundle Size**     | ~1KB                                 | Larger (Redux Toolkit + React-Redux)     |
| **Middleware**      | Optional                             | Core concept                             |
| **Multiple Stores** | Yes (supported)                      | Typically one store                      |

**When to choose Zustand:**

- Small to medium apps
- Want minimal boilerplate
- Don't need complex middleware
- Prefer simplicity over convention

**When to choose Redux:**

- Large enterprise apps
- Need extensive middleware ecosystem
- Want strict patterns and conventions
- Team already familiar with Redux

---

## Best Practices

### 1. Keep Actions Close to State

```js
// ✅ Good - actions are defined with state
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ⚠️ Also valid, but less tidy - actions defined outside the store
const increment = () =>
  useStore.setState((state) => ({ count: state.count + 1 }));
```

### 2. Use Selectors for Performance

```js
// ✅ Good - only subscribes to 'count'
const count = useStore((state) => state.count);

// ❌ Avoid - subscribes to entire store
const { count } = useStore();
```

### 3. Organize Large Stores with Slices

```js
// ✅ Good - organized with function slices
const useStore = create((set) => ({
  ...createUserSlice(set),
  ...createCartSlice(set),
  ...createProductSlice(set),
}));
```

### 4. Use TypeScript for Type Safety

```ts
interface CountState {
  count: number;
  increment: () => void;
}

const useStore = create<CountState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 5. Don't Mutate State

```js
// ✅ Good - creates new array
set((state) => ({ items: [...state.items, newItem] }));

// ❌ Bad - mutates existing array
set((state) => {
  state.items.push(newItem);
  return { items: state.items };
});
```

### 6. Use Persist Middleware Wisely

```js
// ✅ Good - only persist necessary data
persist(
  (set) => ({
    /* store */
  }),
  {
    name: "app-storage",
    partialize: (state) => ({
      user: state.user, // Only persist user data
      // Don't persist temporary UI state
    }),
  },
);
```

### 7. Handle Async Errors

```js
const useStore = create((set) => ({
  data: null,
  error: null,
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.fetchData();
      set({ data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

---

## Selecting Multiple Values with useShallow

Selectors are great for one value, but what if you want **two or more values** without subscribing to the whole store?

**The problem:** returning a new object from a selector creates a _new reference every time_, so the component re-renders on every store change (and in Zustand v5 it can even cause an infinite-loop error).

```js
// ❌ New object on every call -> unnecessary re-renders / loop error in v5
const { count, tasks } = useStore((state) => ({
  count: state.count,
  tasks: state.tasks,
}));
```

**The fix:** wrap the selector in `useShallow`. It compares the _contents_ of the object (one level deep) instead of the reference.

```js
import { useShallow } from "zustand/react/shallow";

// ✅ Re-renders only when 'count' or 'tasks' actually change
const { count, tasks } = useStore(
  useShallow((state) => ({ count: state.count, tasks: state.tasks })),
);
```

**Quick rule of thumb:**

- One value → `useStore((state) => state.count)`
- Several values → `useStore(useShallow((state) => ({ ... })))`
- Everything → `useStore()` (re-renders on any change)
