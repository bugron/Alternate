import { create } from "zustand";
import createSelectors from "./selectors";

type State = {
  overlayVisible: boolean;
};

type Action = {
  showOverlay: () => void;
  hideOverlay: () => void;
};

const useLockOverlayStoreBase = create<State & Action>()((set) => ({
  overlayVisible: false,
  showOverlay: () => set({ overlayVisible: true }),
  hideOverlay: () => set({ overlayVisible: false }),
}));

const useLockOverlayStore = createSelectors(useLockOverlayStoreBase);

export default useLockOverlayStore;
