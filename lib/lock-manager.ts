import useLockOverlayStore from "@/store/lockOverlayStore";
import usePasscodeStore from "@/store/passcodeStore";
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Hook that manages app lock/unlock logic based on auto-lock timeout.
 * Should be called in the root layout component.
 */
export function useLockManager() {
  const passcodeEnabled = usePasscodeStore.use.passcodeEnabled();
  const shouldAutoLock = usePasscodeStore.use.shouldAutoLock();
  const recordLock = usePasscodeStore.use.recordLock();
  const showOverlay = useLockOverlayStore.use.showOverlay();

  useEffect(() => {
    if (!passcodeEnabled) return;

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // On mount, if conditions require, show the overlay immediately
    if (shouldAutoLock()) {
      showOverlay();
    }

    return () => {
      subscription.remove();
    };

    function handleAppStateChange(status: AppStateStatus) {
      if (status === "background" || status === "inactive") {
        // App is backgrounded - record the lock time
        recordLock();
      } else if (status === "active") {
        // App is foregrounded - check if we need to show lock overlay
        if (shouldAutoLock()) {
          showOverlay();
        }
      }
    }
  }, [passcodeEnabled, shouldAutoLock, recordLock, showOverlay]);
}

/**
 * Function to immediately lock the app by navigating to the lock screen.
 * This replaces the entire navigation stack.
 */
export function lockAppImmediately() {
  const { recordLock } = usePasscodeStore.getState();
  const { showOverlay } = useLockOverlayStore.getState();
  const { setForceLocked } = usePasscodeStore.getState();
  recordLock();
  setForceLocked(true);
  showOverlay();
}
