import { preprocessContactsForSearch, searchContacts } from "@/lib/search-utils";
import { Contact } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

/**
 * Custom hook for efficient contact searching with memoization and debouncing
 */
export function useContactSearch(contacts: Contact[], query: string, delay: number = 300) {
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Memoize processed contacts to avoid recomputation
  const searchableContacts = useMemo(() => {
    return preprocessContactsForSearch(contacts);
  }, [contacts]);

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
      setIsSearching(false);
    };
  }, [query, delay]);

  // Perform search when debounced query changes
  useEffect(() => {
    const results = searchContacts(searchableContacts, debouncedQuery);
    setSearchResults(results);
  }, [debouncedQuery, searchableContacts]);

  return {
    searchResults,
    isSearching,
    searchableContacts, // Expose for potential external use
  };
}