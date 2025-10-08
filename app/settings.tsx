import { MaterialSwitchListItem } from "@/components/material-switch-list-item";
import Material3Avatar from "@/components/material3-avatar";
import CallerIdModule from "@/modules/caller-id";
import useContactStore from "@/store/contactStore";
import useThemeStore from "@/store/themeStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
	Button,
	Dialog,
	List,
	Portal,
	SegmentedButtons,
	Text,
	useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	const themeMode = useThemeStore.use.themeMode();
	const setThemeMode = useThemeStore.use.setThemeMode();
	const [open, setOpen] = React.useState(false);
	const [openDialog, setOpenDialog] = React.useState(false);
	const [dialogState, setDialogState] = React.useState({
		title: "",
		content: "",
	});

	const [incomingPopupState, setIncomingPopupState] = React.useState(
		CallerIdModule.getIncomingPopup(),
	);
	const [outgoingPopupState, setOutgoingPopupState] = React.useState(
		CallerIdModule.getOutgoingPopup(),
	);

	// VCF import/export functionality
	const importContacts = useContactStore.use.importContacts();
	const exportContacts = useContactStore.use.exportContacts();
	const isImporting = useContactStore.use.isImporting();
	const isExporting = useContactStore.use.isExporting();
	const importError = useContactStore.use.importError();
	const exportError = useContactStore.use.exportError();
	const clearImportError = useContactStore.use.clearImportError();
	const clearExportError = useContactStore.use.clearExportError();
	const contacts = useContactStore.use.contacts();

	const showDialog = (title: string, content: string) => {
		setOpenDialog(true);
		setDialogState({ title, content });
	};

	const hideDialog = () => {
		setOpenDialog(false);
		setDialogState({ title: "", content: "" });
	};

	const handleIncomingPopupToggle = (value: boolean) => {
		const success = CallerIdModule.setIncomingPopup(value);
		if (!success) {
			showDialog(
				"Error",
				"Failed to update incoming popup setting. Please try again",
			);
			// Alert.alert("Error", "Failed to update incoming popup setting");
		}
		setIncomingPopupState(value);
	};

	const handleOutgoingPopupToggle = (value: boolean) => {
		const success = CallerIdModule.setOutgoingPopup(value);
		if (!success) {
			showDialog(
				"Error",
				"Failed to update outgoing popup setting. Please try again",
			);
			// Alert.alert("Error", "Failed to update outgoing popup setting");
		}
		setOutgoingPopupState(value);
	};

	const handleImportContacts = async () => {
		clearImportError();
		const success = await importContacts();
		if (success) {
			showDialog(
				"Import Successful",
				`${success} Contacts have been imported successfully from the VCF file`,
			);
			// Alert.alert(
			//   "Import Successful",
			//   `${success} Contacts have been imported successfully from the VCF file.`
			// );
		} else if (importError) {
			// Alert.alert("Import Failed", importError);
			showDialog("Import Failed", importError);
		}
	};

	const handleExportContacts = async () => {
		clearExportError();
		if (contacts.length === 0) {
			// Alert.alert("No Contacts", "You don't have any contacts to export.");
			showDialog("No Contacts", "You don't have any contacts to export.");
			return;
		}

		const success = await exportContacts();
		if (success) {
			// Alert.alert(
			//   "Export Successful",
			//   `${contacts.length} contacts have been exported to a VCF file.`
			// );
			showDialog(
				"Export Successful",
				`${contacts.length} contacts have been exported to a VCF file.`,
			);
		} else if (exportError) {
			// Alert.alert("Export Failed", exportError);
			showDialog("Export Failed", exportError);
		}
	};

	return (
		<ScrollView
			style={[styles.container, { paddingBottom: insets.bottom + 16 }]}
			contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
		>
			<View
				style={{
					backgroundColor: theme.colors.inverseOnSurface,
					borderRadius: 16,
					borderBottomLeftRadius: 5,
					borderBottomRightRadius: 5,
					padding: 16,
					marginBottom: 2,
				}}
			>
				<Text
					variant="titleMedium"
					style={[styles.title, { color: theme.colors.onSurface }]}
				>
					General
				</Text>
			</View>
			<MaterialSwitchListItem
				title={"Show Incoming Popup"}
				titleStyle={{ fontSize: 18 }}
				listStyle={[
					styles.listItem,
					{
						backgroundColor: theme.colors.inverseOnSurface,
						marginBottom: 2,
						borderRadius: 5,
					},
				]}
				switchOnIcon={"check"}
				selected={incomingPopupState}
				onPress={() => handleIncomingPopupToggle(!incomingPopupState)}
			/>
			<MaterialSwitchListItem
				title={"Show Outgoing Popup"}
				titleStyle={{ fontSize: 18 }}
				listStyle={[
					styles.listItem,
					{
						backgroundColor: theme.colors.inverseOnSurface,
						marginBottom: 2,
						borderRadius: 5,
					},
				]}
				switchOnIcon={"check"}
				selected={outgoingPopupState}
				onPress={() => handleOutgoingPopupToggle(!outgoingPopupState)}
			/>
			{/* <MaterialSwitchListItem
        fluid={false}
        titleStyle={{ fontSize: 18 }}
        switchOnIcon={() => (
          <Ionicons
            name="moon"
            size={14}
            color={theme.colors.onPrimaryContainer}
          />
        )}
        selected={theme.dark}
        onPress={() => setThemeMode(theme.dark ? "light" : "dark")}
        listStyle={[
          styles.listItem,
          {
            backgroundColor: theme.colors.inverseOnSurface,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
          },
        ]}
        title={"Dark mode"}
      /> */}
			<View
				style={[
					styles.listItem,
					{
						backgroundColor: theme.colors.inverseOnSurface,
						paddingVertical: 5,
						borderTopLeftRadius: 5,
						borderTopRightRadius: 5,
					},
				]}
			>
				<List.Accordion
					title="Theme"
					titleStyle={{ fontSize: 18 }}
					expanded={open}
					onPress={() => setOpen((state) => !state)}
					background={{ color: "transparent" }}
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
					}}
				>
					<View
						style={[
							styles.themeContainer,
							{ backgroundColor: theme.colors.inverseOnSurface },
						]}
					>
						<SegmentedButtons
							value={themeMode}
							onValueChange={setThemeMode}
							buttons={[
								{
									value: "light",
									label: "Light",
									icon: "white-balance-sunny",
									showSelectedCheck: true,
									uncheckedColor: theme.colors.onBackground,
									checkedColor: theme.colors.onPrimaryContainer,
									style: [
										styles.segmentedButton,
										styles.segmentedButtonLeft,
										{
											backgroundColor:
												themeMode === "light"
													? theme.colors.primaryContainer
													: theme.colors.surfaceVariant,
										},
									],
								},
								{
									value: "dark",
									label: "Dark",
									icon: "moon-waning-crescent",
									showSelectedCheck: true,
									uncheckedColor: theme.colors.onBackground,
									checkedColor: theme.colors.onPrimaryContainer,
									style: [
										styles.segmentedButton,
										styles.segmentedButtonMiddle,
										{
											backgroundColor:
												themeMode === "dark"
													? theme.colors.primaryContainer
													: theme.colors.surfaceVariant,
										},
									],
								},
								{
									value: "system",
									label: "System",
									icon: "laptop",
									showSelectedCheck: true,
									uncheckedColor: theme.colors.onBackground,
									checkedColor: theme.colors.onPrimaryContainer,
									style: [
										styles.segmentedButton,
										styles.segmentedButtonRight,
										{
											backgroundColor:
												themeMode === "system"
													? theme.colors.primaryContainer
													: theme.colors.surfaceVariant,
										},
									],
								},
							]}
						/>
					</View>
				</List.Accordion>
			</View>

			{/* VCF Import/Export Section */}
			<View style={styles.vcfCard}>
				<View
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 16,
						borderBottomLeftRadius: 5,
						borderBottomRightRadius: 5,
						padding: 16,
					}}
				>
					<Text
						variant="titleMedium"
						style={[styles.vcfTitle, { color: theme.colors.onSurface }]}
					>
						Contacts Backup
					</Text>
				</View>

				<View
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 16,
						borderTopLeftRadius: 5,
						borderTopRightRadius: 5,
						padding: 16,
					}}
				>
					<View style={styles.vcfButtonContainer}>
						<Button
							mode="outlined"
							onPress={handleImportContacts}
							loading={isImporting}
							disabled={isImporting || isExporting}
							icon="download"
							style={styles.vcfButton}
						>
							Import VCF
						</Button>

						<Button
							mode="contained"
							onPress={handleExportContacts}
							loading={isExporting}
							disabled={isImporting || isExporting || contacts.length === 0}
							icon="upload"
							style={styles.vcfButton}
						>
							Export VCF
						</Button>
					</View>

					{contacts.length > 0 && (
						<Text variant="bodySmall" style={styles.contactCount}>
							{contacts.length} contact{contacts.length !== 1 ? "s" : ""}{" "}
							available
						</Text>
					)}
				</View>
			</View>

			{/* Developer and Repo Information */}
			<View style={{ gap: 2, marginTop: 24 }}>
				<View
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 16,
						borderBottomLeftRadius: 5,
						borderBottomRightRadius: 5,
						padding: 16,
					}}
				>
					<Text
						variant="titleMedium"
						style={[styles.vcfTitle, { color: theme.colors.onSurface }]}
					>
						Useful Links
					</Text>
				</View>
				<List.Item
					title="README"
					description="Checkout app's README on Github"
					left={(props) => <FontAwesome6 {...props} name="readme" size={24} />}
					right={(props) => <List.Icon {...props} icon="chevron-right" />}
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 5,
					}}
					borderless
					titleStyle={{ fontSize: 18 }}
					descriptionStyle={{ opacity: 0.7 }}
					onPress={() => {
						Linking.openURL(
							"https://github.com/BioHazard786/Alternate?tab=readme-ov-file",
						);
					}}
				/>
				<List.Item
					title="Github Issues"
					description="Create an issue on Github"
					left={(props) => <FontAwesome6 {...props} name="github" size={24} />}
					right={(props) => <List.Icon {...props} icon="chevron-right" />}
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 5,
					}}
					borderless
					titleStyle={{ fontSize: 18 }}
					descriptionStyle={{ opacity: 0.7 }}
					onPress={() => {
						Linking.openURL("https://github.com/BioHazard786/Alternate/issues");
					}}
				/>
				<List.Item
					title="Support Development"
					description="Think I deserve a coffee? Click here!"
					left={(props) => (
						<FontAwesome6 {...props} name="hand-holding-heart" size={24} />
					)}
					right={(props) => <List.Icon {...props} icon="chevron-right" />}
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderTopLeftRadius: 5,
						borderTopRightRadius: 5,
						borderRadius: 16,
					}}
					borderless
					titleStyle={{ fontSize: 18 }}
					descriptionStyle={{ opacity: 0.7 }}
					onPress={() => {
						Linking.openURL("https://github.com/sponsors/BioHazard786");
					}}
				/>
			</View>
			<View style={{ gap: 2, marginTop: 24 }}>
				<View
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 16,
						borderBottomLeftRadius: 5,
						borderBottomRightRadius: 5,
						padding: 16,
					}}
				>
					<Text
						variant="titleMedium"
						style={[styles.vcfTitle, { color: theme.colors.onSurface }]}
					>
						Developed by
					</Text>
				</View>
				<View
					style={{
						backgroundColor: theme.colors.inverseOnSurface,
						borderRadius: 16,
						borderTopLeftRadius: 5,
						borderTopRightRadius: 5,
						padding: 16,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 16,
							flex: 1,
						}}
					>
						<Material3Avatar
							letter="Z"
							backgroundColor={undefined}
							textColor={undefined}
							size={120}
							photo={require("../assets/dev-profile-photo/Snake.jpg")}
						/>
						<View
							style={{
								flexDirection: "column",
								justifyContent: "space-evenly",
								alignItems: "flex-start",
								flex: 1,
								gap: 10,
							}}
						>
							<Text
								variant="titleMedium"
								style={{ fontSize: 18, fontWeight: "600" }}
							>
								Mohd Zaid
							</Text>
							<Pressable
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 5,
									backgroundColor: theme.colors.surfaceVariant,
									padding: 6,
									paddingHorizontal: 8,
									borderRadius: 50,
								}}
								onPress={() => {
									Linking.openURL("mailto:message@zaid.qzz.io");
								}}
							>
								<FontAwesome6
									name="at"
									size={20}
									color={theme.colors.onSurfaceVariant}
								/>
								<Text variant="titleSmall">message@zaid.qzz.io</Text>
							</Pressable>
							<View
								style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
							>
								<Pressable
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 5,
										backgroundColor: theme.colors.surfaceVariant,
										padding: 6,
										paddingHorizontal: 8,
										borderRadius: 50,
									}}
									onPress={() => {
										Linking.openURL("https://github.com/BioHazard786");
									}}
								>
									<FontAwesome6
										name="github"
										size={20}
										color={theme.colors.onSurfaceVariant}
									/>
									<Text variant="titleSmall">Github</Text>
								</Pressable>
								<Pressable
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 5,
										backgroundColor: theme.colors.surfaceVariant,
										padding: 6,
										paddingHorizontal: 8,
										borderRadius: 50,
									}}
									onPress={() => {
										Linking.openURL("https://t.me/lulu786");
									}}
								>
									<FontAwesome6
										name="telegram"
										size={20}
										color={theme.colors.onSurfaceVariant}
									/>
									<Text variant="titleSmall">Telegram</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</View>
			</View>

			{/* Alert Dialog */}
			<Portal>
				<Dialog visible={openDialog} onDismiss={hideDialog}>
					<Dialog.Title>{dialogState.title}</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium">{dialogState.content}</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={hideDialog}>Cancel</Button>
						<Button onPress={hideDialog}>Ok</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	listItem: {
		width: "100%",
		padding: 16,
		borderRadius: 16,
		paddingVertical: 15,
	},
	touchableContainer: {
		marginTop: 24,
		paddingHorizontal: 20,
		borderRadius: 16,
	},
	textContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 10,
	},
	title: {
		fontWeight: "600",
		fontSize: 18,
	},
	vcfCard: {
		marginTop: 24,
		gap: 2,
	},
	vcfTitle: {
		fontWeight: "600",
		fontSize: 18,
	},
	vcfDescription: {
		marginBottom: 16,
		opacity: 0.8,
	},
	vcfButtonContainer: {
		flexDirection: "row",
		gap: 12,
		marginVertical: 12,
	},
	vcfButton: {
		flex: 1,
	},
	contactCount: {
		textAlign: "center",
		opacity: 0.7,
	},
	themeContainer: {
		padding: 20,
		borderRadius: 16,
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
	},
	segmentedButton: {
		borderStyle: undefined,
		borderWidth: 0,
	},
	segmentedButtonLeft: {
		borderTopRightRadius: 3,
		borderBottomRightRadius: 3,
		borderRadius: 50,
	},
	segmentedButtonMiddle: {
		marginHorizontal: 2,
		borderRadius: 3,
	},
	segmentedButtonRight: {
		borderTopLeftRadius: 3,
		borderBottomLeftRadius: 3,
		borderRadius: 50,
	},
});
