import { colors } from "../constants/Colors";
import type { Contact } from "./types";
import { getFormattedName } from "./utils";

// Simple hash function for better randomization
const simpleHash = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
};

export const getAvatarColor = (
	letter: string,
	isDark: boolean,
	index?: number,
): [string, string] => {
	const themeColors = isDark ? colors.dark : colors.light;
	const colorKeys = Object.keys(themeColors) as Array<keyof typeof themeColors>;

	let colorIndex: number;

	if (index !== undefined) {
		// Create a more randomized hash using both letter and index
		// This ensures better distribution across the color palette
		const combinedInput = `${letter.toLowerCase()}_${index}`;
		const hash = simpleHash(combinedInput);

		// Use a prime number for better distribution
		colorIndex = (hash * 31) % colorKeys.length;
	} else {
		// More randomized approach for single letter
		// Use multiple character transformations for better distribution
		const letterLower = letter.toLowerCase();
		const letterUpper = letter.toUpperCase();
		const combinedString = letterLower + letterUpper + letter;

		const hash = simpleHash(combinedString);
		colorIndex = (hash * 17) % colorKeys.length; // Use prime for better distribution
	}

	// Get color based on calculated index
	const selectedKey = colorKeys[colorIndex];

	if (themeColors[selectedKey]) {
		return [themeColors[selectedKey].fg, themeColors[selectedKey].bg];
	}

	// Fallback if something goes wrong
	const availableColors = Object.values(themeColors);
	const fallbackIndex = colorIndex % availableColors.length;
	return [availableColors[fallbackIndex].fg, availableColors[fallbackIndex].bg];
};

export const getSectionedContacts = (contacts: Contact[]) => {
	// Group contacts by first letter
	const grouped = contacts.reduce(
		(acc, contact) => {
			const fullName = getFormattedName(contact);
			const letter = fullName.charAt(0).toUpperCase();
			if (!acc[letter]) {
				acc[letter] = [];
			}
			acc[letter].push(contact);
			return acc;
		},
		{} as Record<string, Contact[]>,
	);

	// Convert to sectioned data format for flashlist
	const sections = Object.keys(grouped)
		.sort()
		.map((letter) => ({
			title: letter,
			data: grouped[letter],
		}));

	return sections;
};
