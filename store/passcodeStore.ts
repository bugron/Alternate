import * as Crypto from "expo-crypto";
import { MMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import createSelectors from "./selectors";

const storage = new MMKV({ id: "passcode-storage" });

const zustandStorage: StateStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.delete(name);
  },
};

export type AutoLockTimeout =
  | "disabled"
  | "immediately"
  | "1m"
  | "5m"
  | "1h"
  | "5h";

const AUTO_LOCK_MILLISECONDS: Record<AutoLockTimeout, number> = {
  disabled: 0,
  immediately: 0, // special-cased in shouldAutoLock
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "5h": 5 * 60 * 60 * 1000,
};

type State = {
  passcodeEnabled: boolean;
  passcodeHash: string | null;
  passcodeSalt: string | null;
  biometricEnabled: boolean;
  biometricSupported: boolean;
  autoLockTimeout: AutoLockTimeout;
  lastLockTime: number | null;
  failedAttempts: number;
  maxFailedAttempts: number;
  lockoutUntil: number | null;
  forceLocked: boolean;
};

type Action = {
  setPasscodeEnabled: (enabled: boolean) => void;
  setPasscode: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPasscode: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => void;
  setBiometricSupported: (supported: boolean) => void;
  setAutoLockTimeout: (timeout: AutoLockTimeout) => void;
  recordLock: () => void;
  recordUnlock: () => void;
  getAutoLockMs: () => number;
  shouldAutoLock: () => boolean;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  isLockedOut: () => boolean;
  setForceLocked: (locked: boolean) => void;
};

const initialState: State = {
  passcodeEnabled: false,
  passcodeHash: null,
  passcodeSalt: null,
  biometricEnabled: false,
  biometricSupported: false,
  autoLockTimeout: "5m",
  lastLockTime: null,
  failedAttempts: 0,
  maxFailedAttempts: 5,
  lockoutUntil: null,
  forceLocked: false,
};

const usePasscodeStoreBase = create<State & Action>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPasscodeEnabled: (enabled: boolean) =>
        set({ passcodeEnabled: enabled }),

      setBiometricEnabled: (enabled: boolean) =>
        set({ biometricEnabled: enabled }),

      setBiometricSupported: (supported: boolean) =>
        set({ biometricSupported: supported }),

      setAutoLockTimeout: (timeout: AutoLockTimeout) =>
        set({ autoLockTimeout: timeout }),

      recordLock: () => set({ lastLockTime: Date.now() }),

      recordUnlock: () => set({ lastLockTime: Date.now(), forceLocked: false }),

      getAutoLockMs: () => {
        const state = get();
        return AUTO_LOCK_MILLISECONDS[state.autoLockTimeout];
      },

      shouldAutoLock: () => {
        const state = get();
        // If a manual lock has been requested, always lock until user unlocks
        if (state.forceLocked) {
          return true;
        }
        // Immediate: lock on any reopen after background
        if (state.autoLockTimeout === "immediately") {
          return !!state.lastLockTime;
        }
        // Respect auto-lock timeout
        if (state.autoLockTimeout === "disabled" || !state.lastLockTime) {
          return false;
        }
        const autoLockMs = AUTO_LOCK_MILLISECONDS[state.autoLockTimeout];
        return Date.now() - state.lastLockTime > autoLockMs;
      },

      setPasscode: async (pin: string) => {
        try {
          const salt = Crypto.randomUUID();
          const combined = pin + salt;
          const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            combined
          );
          set({
            passcodeHash: hash,
            passcodeSalt: salt,
            passcodeEnabled: true,
            biometricEnabled: false, // Reset biometric when setting new passcode
            failedAttempts: 0,
            lockoutUntil: null,
            lastLockTime: Date.now(), // Start auto-lock timer from now; do not lock immediately
          });
        } catch (error) {
          console.error("Error setting passcode:", error);
          throw error;
        }
      },

      verifyPin: async (pin: string) => {
        try {
          const state = get();

          // Check if locked out due to failed attempts
          if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
            throw new Error(
              "Too many failed attempts. Please try again later."
            );
          }

          if (!state.passcodeHash || !state.passcodeSalt) {
            return false;
          }

          const combined = pin + state.passcodeSalt;
          const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            combined
          );

          if (hash === state.passcodeHash) {
            set({ failedAttempts: 0, lockoutUntil: null });
            return true;
          } else {
            const newFailedAttempts = state.failedAttempts + 1;
            set({ failedAttempts: newFailedAttempts });

            if (newFailedAttempts >= state.maxFailedAttempts) {
              // Lock out for 1 minute after max attempts
              set({ lockoutUntil: Date.now() + 60 * 1000 });
            }

            return false;
          }
        } catch (error) {
          console.error("Error verifying PIN:", error);
          throw error;
        }
      },

      clearPasscode: async () => {
        set({
          passcodeEnabled: false,
          passcodeHash: null,
          passcodeSalt: null,
          biometricEnabled: false,
          failedAttempts: 0,
          lockoutUntil: null,
        });
      },

      incrementFailedAttempts: () => {
        const state = get();
        const newFailedAttempts = state.failedAttempts + 1;
        set({ failedAttempts: newFailedAttempts });

        if (newFailedAttempts >= state.maxFailedAttempts) {
          // Lock out for 1 minute after max attempts
          set({ lockoutUntil: Date.now() + 60 * 1000 });
        }
      },

      resetFailedAttempts: () => {
        set({ failedAttempts: 0, lockoutUntil: null });
      },

      isLockedOut: () => {
        const state = get();
        if (!state.lockoutUntil) return false;
        return Date.now() < state.lockoutUntil;
      },

      setForceLocked: (locked: boolean) => set({ forceLocked: locked }),
    }),
    {
      name: "passcode-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

const usePasscodeStore = createSelectors(usePasscodeStoreBase);

export default usePasscodeStore;
