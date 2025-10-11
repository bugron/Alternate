import { Contact } from "./types";

// Pre-processed contact type for efficient searching
export type SearchableContact = Contact & {
  searchableText: string;
  fullName: string;
  searchTokens: string[];
};

/**
 * Preprocesses contacts for efficient searching
 * This should be called whenever contacts change, not on every search
 */
export function preprocessContactsForSearch(contacts: Contact[]): SearchableContact[] {
  return contacts.map((contact): SearchableContact => {
    // Pre-build full name once
    const fullName = [contact.prefix, contact.name, contact.suffix]
      .filter(Boolean)
      .join(" ");

    // Pre-build searchable text with all relevant fields
    const searchableFields = [
      fullName,
      contact.location || "",
      contact.appointment || "",
      contact.nickname || "",
      contact.email || "",
      `+${contact.fullPhoneNumber}`,
      contact.phoneNumber,
    ];

    const searchableText = searchableFields.join(" ").toLowerCase();
    
    // Tokenize for multi-word searches
    const searchTokens = searchableText
      .split(/\s+/)
      .filter(token => token.length > 0);

    return {
      ...contact,
      fullName,
      searchableText,
      searchTokens,
    };
  });
}

/**
 * Enhanced search function with multiple search strategies
 */
export function searchContacts(
  searchableContacts: SearchableContact[],
  query: string
): Contact[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();
  const queryTokens = lowerQuery.split(/\s+/).filter(token => token.length > 0);

  // Strategy 1: Single token search - fastest for simple queries
  if (queryTokens.length === 1) {
    const token = queryTokens[0];
    return searchableContacts.filter(contact => 
      contact.searchableText.includes(token)
    );
  }

  // Strategy 2: Multi-token search - for complex queries
  return searchableContacts.filter(contact => {
    // All query tokens must be found in the contact's searchable data
    return queryTokens.every(queryToken => 
      contact.searchTokens.some(contactToken => 
        contactToken.includes(queryToken)
      )
    );
  });
}

/**
 * Fuzzy search for better user experience (optional enhancement)
 * This is more CPU intensive but provides better results for typos
 */
export function fuzzySearchContacts(
  searchableContacts: SearchableContact[],
  query: string,
  threshold: number = 0.6
): Contact[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();
  
  return searchableContacts
    .map(contact => ({
      contact,
      score: calculateFuzzyScore(contact.searchableText, lowerQuery)
    }))
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(item => item.contact);
}

/**
 * Simple fuzzy scoring algorithm
 */
function calculateFuzzyScore(text: string, query: string): number {
  if (text.includes(query)) return 1.0;
  
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score++;
      queryIndex++;
    }
  }
  
  return queryIndex === query.length ? score / query.length : 0;
}