import useLockOverlayStore from "@/store/lockOverlayStore";
import usePasscodeStore from "@/store/passcodeStore";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

const DEFAULT_KEYPAD_LAYOUT = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["#", "0", "spacer"],
];

export default function BiometricLockScreen() {
  const theme = useTheme();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const verifyPin = usePasscodeStore.use.verifyPin();
  const biometricEnabled = usePasscodeStore.use.biometricEnabled();
  const recordUnlock = usePasscodeStore.use.recordUnlock();
  const biometricSupported = usePasscodeStore.use.biometricSupported();
  const isLockedOut = usePasscodeStore.use.isLockedOut();
  const incrementFailedAttempts =
    usePasscodeStore.use.incrementFailedAttempts();
  const resetFailedAttempts = usePasscodeStore.use.resetFailedAttempts();
  const visible = useLockOverlayStore.use.overlayVisible();
  const onUnlock = useLockOverlayStore.use.hideOverlay();

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      setBiometricAvailable(false);
    }
  };

  const triggerBiometric = async () => {
    if (!biometricAvailable || !biometricEnabled) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
      });

      if (result.success) {
        resetFailedAttempts();
        recordUnlock();
        onUnlock();
      } else if (
        result.error === "user_cancel" ||
        result.error === "app_cancel"
      ) {
      } else {
        setError("Biometric authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Biometric error:", error);
      setError("Biometric error. Please use PIN instead.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin]);

  useEffect(() => {
    if (visible) {
      setPin("");
      setError("");
      resetFailedAttempts();
      checkBiometricAvailability();
    }
  }, [visible, biometricEnabled]);

  useEffect(() => {
    if (visible && biometricEnabled && biometricAvailable) {
      const timer = setTimeout(async () => {
        if (!biometricAvailable || !biometricEnabled) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const result = await LocalAuthentication.authenticateAsync({
            disableDeviceFallback: false,
          });

          if (result.success) {
            resetFailedAttempts();
            recordUnlock();
            onUnlock();
          } else if (
            result.error === "user_cancel" ||
            result.error === "app_cancel"
          ) {
          } else {
            setError("Biometric authentication failed. Please try again.");
          }
        } catch (error) {
          console.error("Biometric error:", error);
          setError("Biometric error. Please use PIN instead.");
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, biometricEnabled, biometricAvailable]);

  const handlePinDigitPress = (digit: string) => {
    if (digit === "#") {
      // Delete last digit
      setPin(pin.slice(0, -1));
      return;
    }
    if (pin.length < 4) {
      setPin(pin + digit);
      if (error) setError("");
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError("Please enter your PIN");
      return;
    }

    if (isLockedOut()) {
      setError("Too many failed attempts. Please try again later.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const isValid = await verifyPin(pin);
      if (isValid) {
        resetFailedAttempts();
        recordUnlock();
        onUnlock();
        setPin("");
      } else {
        incrementFailedAttempts();
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      setError("Error verifying PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const keypadLayout = React.useMemo(() => {
    if (biometricEnabled) {
      const rightSlot =
        biometricAvailable && biometricSupported ? "finger" : "spacer";
      // When biometrics are enabled, remove trash (*) and move backspace (#) to the left slot
      return [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["#", "0", rightSlot],
      ];
    }
    return DEFAULT_KEYPAD_LAYOUT;
  }, [biometricEnabled, biometricAvailable, biometricSupported]);

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      width: "100%",
      paddingHorizontal: 24,
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onBackground,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      marginBottom: 32,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    lockIcon: {
      fontSize: 60,
      marginBottom: 24,
    },
    pinDisplay: {
      fontSize: 48,
      letterSpacing: 16,
      marginVertical: 32,
      fontWeight: "300",
      color: theme.colors.primary,
      minHeight: 60,
      textAlign: "center",
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginVertical: 8,
      textAlign: "center",
    },
    keypadContainer: {
      width: "100%",
      paddingHorizontal: 16,
      marginVertical: 24,
    },
    keypadRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 12,
    },
    keypadButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
      alignItems: "center",
    },
    keypadButtonPressed: {
      backgroundColor: theme.colors.primaryContainer,
    },
    keypadButtonSurface: {
      backgroundColor: theme.colors.surface,
    },
    keypadButtonText: {
      fontSize: 28,
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    buttonContainer: {
      width: "100%",
      marginTop: 24,
      gap: 12,
    },
    unlockButton: {
      width: "100%",
    },
    alternativeButton: {
      width: "100%",
      marginTop: 12,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (loading) {
    return (
      <Modal visible={visible} transparent={false}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={[styles.contentContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.subtitle, { marginTop: 24 }]}>
              Authenticating...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
          }}
          scrollEnabled={false}
        >
          <View
            style={[
              styles.container,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.contentContainer}>
              <Text style={styles.lockIcon}>🔒</Text>

              <Text style={styles.title}>App Locked</Text>
              <Text style={styles.subtitle}>"Enter your PIN to unlock"</Text>

              <>
                {/* PIN Display */}
                <View>
                  <Text style={styles.pinDisplay}>
                    {pin
                      .split("")
                      .map(() => "●")
                      .join("")}
                  </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Numeric Keypad */}
                <View style={styles.keypadContainer}>
                  {keypadLayout.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keypadRow}>
                      {row.map((key) => {
                        if (key === "spacer") {
                          return (
                            <View
                              key={`spacer-${rowIndex}`}
                              style={{ width: 70, height: 70 }}
                            />
                          );
                        }
                        // Special handling for 0 key (with biometric option)
                        if (key === "0") {
                          return (
                            <View
                              key={key}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Pressable
                                onPress={() => handlePinDigitPress(key)}
                                disabled={loading}
                                style={({ pressed }) => [
                                  styles.keypadButton,
                                  pressed && styles.keypadButtonPressed,
                                ]}
                              >
                                <Text style={styles.keypadButtonText}>
                                  {key}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }
                        if (key === "finger") {
                          return (
                            <Pressable
                              key={key}
                              onPress={triggerBiometric}
                              disabled={loading}
                              style={({ pressed }) => [
                                styles.keypadButton,
                                styles.keypadButtonSurface,
                                pressed && styles.keypadButtonPressed,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="fingerprint"
                                size={32}
                              />
                            </Pressable>
                          );
                        }

                        // Regular keys
                        if (key === "#") {
                          return (
                            <Pressable
                              key={key}
                              onPress={() => handlePinDigitPress(key)}
                              disabled={loading}
                              style={({ pressed }) => [
                                styles.keypadButton,
                                styles.keypadButtonSurface,
                                pressed && styles.keypadButtonPressed,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="backspace-outline"
                                size={28}
                              />
                            </Pressable>
                          );
                        }

                        return (
                          <Pressable
                            key={key}
                            onPress={() => handlePinDigitPress(key)}
                            disabled={loading}
                            style={({ pressed }) => [
                              styles.keypadButton,
                              pressed && styles.keypadButtonPressed,
                            ]}
                          >
                            <Text style={styles.keypadButtonText}>{key}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
