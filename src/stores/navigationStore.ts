import { create } from "zustand";

interface NavigationState {
  pendingTaskId: string | null;
  setPendingTaskId: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingTaskId: null,
  setPendingTaskId: (id) => set({ pendingTaskId: id }),
}));
