import { ContactSearchIndex } from "@/lib/search-index";
import { preprocessContactsForSearch, searchContacts } from "@/lib/search-utils";
import { Contact } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Advanced search hook that automatically chooses the best search strategy
 * based on the number of contacts
 */
export function useAdvancedContactSearch(
  contacts: Contact[], 
  query: string, 
  delay: number = 300
) {
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use search index for large contact lists (>1000 contacts)
  const useSearchIndex = contacts.length > 1000;
  
  // Create and maintain search index
  const searchIndexRef = useRef<ContactSearchIndex | null>(null);
  
  // Memoize processed contacts for small lists
  const searchableContacts = useMemo(() => {
    if (useSearchIndex) return [];
    return preprocessContactsForSearch(contacts);
  }, [contacts, useSearchIndex]);

  // Update search index when contacts change (for large lists)
  useEffect(() => {
    if (useSearchIndex) {
      if (!searchIndexRef.current) {
        searchIndexRef.current = new ContactSearchIndex(contacts);
      } else {
        searchIndexRef.current.updateIndex(contacts);
      }
    }
  }, [contacts, useSearchIndex]);

  // Debounced search query
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
    let results: Contact[] = [];
    
    if (debouncedQuery.trim()) {
      if (useSearchIndex && searchIndexRef.current) {
        // Use search index for large contact lists
        results = searchIndexRef.current.search(debouncedQuery, 50);
      } else {
        // Use regular search for smaller lists
        results = searchContacts(searchableContacts, debouncedQuery);
      }
    }
    
    setSearchResults(results);
  }, [debouncedQuery, searchableContacts, useSearchIndex]);

  return {
    searchResults,
    isSearching,
    searchStrategy: useSearchIndex ? 'index' : 'linear',
    contactCount: contacts.length,
  };
}