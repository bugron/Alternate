import {
	type CountryCode,
	formatIncompletePhoneNumber,
} from "libphonenumber-js";
import { getCountryByCode } from "./countries";
import type { Contact } from "./types";

export function trimDialCode(phoneNumber: string, countryCode: string): string {
	// Get the country by code
	const country = getCountryByCode(countryCode);

	if (!country) {
		return phoneNumber; // If no country found, return original number
	}

	// Remove the dial code from the phone number
	const dialCode = country.dialCode;

	// Check if the phone number starts with the dial code
	if (phoneNumber.startsWith(dialCode)) {
		return phoneNumber.slice(dialCode.length).trim(); // Return number without dial code
	}

	return phoneNumber; // Return original number if it doesn't start with dial code
}

export function getFormattedPhoneNumber(contact: Contact): string {
	try {
		return formatIncompletePhoneNumber(
			contact.fullPhoneNumber,
			contact.countryCode as CountryCode,
		);
	} catch {
		return contact.fullPhoneNumber;
	}
}

export function getFormattedName(contact: Contact): string {
	let formattedName = contact.name.trim();

	if (contact.prefix?.trim()) {
		formattedName = `${contact.prefix.trim()} ${formattedName}`;
	}

	if (contact.suffix?.trim()) {
		formattedName = `${formattedName}, ${contact.suffix.trim()}`;
	}

	return formattedName;
}

export function getFormattedDate(date: string): string {
	const isMonthDay = date?.startsWith("--");
	const parsedDate = new Date(
		isMonthDay ? `2000-${date.slice(2)}` : date || new Date(),
	);

	return parsedDate.toLocaleDateString("en-US", {
		...(isMonthDay
			? { month: "long", day: "numeric" }
			: { year: "numeric", month: "long", day: "numeric" }),
	});
}

export function getVisibleFields(contact: Contact | null): Set<string> {
	if (!contact) return new Set<string>();

	const fields = [
		"suffix",
		"prefix",
		"email",
		"notes",
		"website",
		"birthday",
		"nickname",
	] as const;
	return new Set(fields.filter((field) => contact[field] !== ""));
}
