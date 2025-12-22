import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import usePasscodeStore from "@/store/passcodeStore";

interface PasscodeSetupModalProps {
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

type SetupStep = "initial" | "confirm" | "error";

export default function PasscodeSetupModal({
  visible,
  onComplete,
  onCancel,
}: PasscodeSetupModalProps) {
  const theme = useTheme();
  const [step, setStep] = useState<SetupStep>("initial");
  const [firstPin, setFirstPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setPasscode = usePasscodeStore.use.setPasscode();

  const handleFirstPinSubmit = () => {
    if (firstPin.length !== 4) {
      setError("Passcode must be 4 digits");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirmPinSubmit = async () => {
    if (confirmPin.length !== 4) {
      setError("Passcode must be 4 digits");
      return;
    }

    if (firstPin !== confirmPin) {
      setError("Passcodes do not match. Please try again.");
      setConfirmPin("");
      setStep("initial");
      return;
    }

    try {
      setLoading(true);
      await setPasscode(firstPin);
      setFirstPin("");
      setConfirmPin("");
      setError("");
      setStep("initial");
      onComplete();
    } catch (err) {
      setError("Failed to set passcode. Please try again.");
      console.error("Error setting passcode:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFirstPin("");
    setConfirmPin("");
    setError("");
    setStep("initial");
    onCancel();
  };

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
    pinInput: {
      width: "100%",
      marginVertical: 16,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 8,
      textAlign: "center",
    },
    buttonContainer: {
      width: "100%",
      marginTop: 24,
      gap: 12,
      flexDirection: "row",
    },
    button: {
      flex: 1,
    },
  });

  if (!visible) {
    return null;
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
              <Text style={styles.lockIcon}>🔐</Text>

              {step === "initial" && (
                <>
                  <Text style={styles.title}>Set Passcode</Text>
                  <Text style={styles.subtitle}>
                    Enter a 4-digit passcode to lock your app
                  </Text>

                  <TextInput
                    label="Passcode"
                    value={firstPin}
                    onChangeText={(text) => {
                      setFirstPin(text.replace(/[^0-9]/g, "").slice(0, 4));
                      setError("");
                    }}
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!loading}
                    style={styles.pinInput}
                    autoFocus
                  />

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  <View style={styles.buttonContainer}>
                    <Button
                      mode="contained"
                      onPress={handleFirstPinSubmit}
                      disabled={loading || firstPin.length !== 4}
                      style={styles.button}
                      loading={loading}
                    >
                      Continue
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleCancel}
                      disabled={loading}
                      style={styles.button}
                    >
                      Cancel
                    </Button>
                  </View>
                </>
              )}

              {step === "confirm" && (
                <>
                  <Text style={styles.title}>Confirm Passcode</Text>
                  <Text style={styles.subtitle}>
                    Re-enter your 4-digit passcode
                  </Text>

                  <TextInput
                    label="Confirm Passcode"
                    value={confirmPin}
                    onChangeText={(text) => {
                      setConfirmPin(text.replace(/[^0-9]/g, "").slice(0, 4));
                      setError("");
                    }}
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!loading}
                    style={styles.pinInput}
                    autoFocus
                  />

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  <View style={styles.buttonContainer}>
                    <Button
                      mode="contained"
                      onPress={handleConfirmPinSubmit}
                      disabled={loading || confirmPin.length !== 4}
                      style={styles.button}
                      loading={loading}
                    >
                      Complete
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setFirstPin("");
                        setConfirmPin("");
                        setError("");
                        setStep("initial");
                      }}
                      disabled={loading}
                      style={styles.button}
                    >
                      Back
                    </Button>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
