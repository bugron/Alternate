import { Contact } from "./types";

/**
 * Search index for ultra-fast contact searching
 * Useful when you have thousands of contacts
 */
export class ContactSearchIndex {
  private index: Map<string, Set<string>> = new Map();
  private contacts: Map<string, Contact> = new Map();

  constructor(contacts: Contact[]) {
    this.buildIndex(contacts);
  }

  private buildIndex(contacts: Contact[]): void {
    this.index.clear();
    this.contacts.clear();

    for (const contact of contacts) {
      const contactId = contact.fullPhoneNumber;
      this.contacts.set(contactId, contact);

      // Build searchable terms
      const terms = this.extractSearchTerms(contact);
      
      for (const term of terms) {
        // Create n-grams for partial matching
        const nGrams = this.createNGrams(term.toLowerCase(), 2);
        
        for (const nGram of nGrams) {
          if (!this.index.has(nGram)) {
            this.index.set(nGram, new Set());
          }
          this.index.get(nGram)!.add(contactId);
        }
      }
    }
  }

  private extractSearchTerms(contact: Contact): string[] {
    const terms: string[] = [];
    
    // Name components
    if (contact.prefix) terms.push(contact.prefix);
    terms.push(contact.name);
    if (contact.suffix) terms.push(contact.suffix);
    
    // Other fields
    if (contact.email) terms.push(contact.email);
    if (contact.nickname) terms.push(contact.nickname);
    if (contact.location) terms.push(contact.location);
    if (contact.appointment) terms.push(contact.appointment);
    
    // Phone numbers
    terms.push(contact.phoneNumber);
    terms.push(`+${contact.fullPhoneNumber}`);
    
    return terms.filter(term => term.length > 0);
  }

  private createNGrams(text: string, n: number): string[] {
    const nGrams: string[] = [];
    const cleanText = text.replace(/[^\w\d]/g, '').toLowerCase();
    
    // Add full text
    nGrams.push(cleanText);
    
    // Add n-grams
    for (let i = 0; i <= cleanText.length - n; i++) {
      nGrams.push(cleanText.slice(i, i + n));
    }
    
    return nGrams;
  }

  search(query: string, limit: number = 100): Contact[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().replace(/[^\w\d\s]/g, '');
    const queryTerms = lowerQuery.split(/\s+/).filter(term => term.length > 0);
    
    if (queryTerms.length === 0) return [];

    // Find contacts that match all query terms
    let candidateIds: Set<string> | null = null;

    for (const term of queryTerms) {
      const termCandidates = new Set<string>();
      
      // Find all n-grams that contain this term
      for (const [nGram, contactIds] of this.index.entries()) {
        if (nGram.includes(term)) {
          for (const contactId of contactIds) {
            termCandidates.add(contactId);
          }
        }
      }

      if (candidateIds === null) {
        candidateIds = termCandidates;
      } else {
        // Intersection - only keep contacts that match all terms
        const intersection = new Set<string>();
        for (const id of candidateIds) {
          if (termCandidates.has(id)) {
            intersection.add(id);
          }
        }
        candidateIds = intersection;
      }

      // If no candidates left, no point continuing
      if (candidateIds.size === 0) break;
    }

    if (!candidateIds || candidateIds.size === 0) return [];

    // Convert contact IDs back to contacts and apply limit
    const results: Contact[] = [];
    let count = 0;
    
    for (const contactId of candidateIds) {
      if (count >= limit) break;
      const contact = this.contacts.get(contactId);
      if (contact) {
        results.push(contact);
        count++;
      }
    }

    return results;
  }

  /**
   * Update the index with new contacts
   */
  updateIndex(contacts: Contact[]): void {
    this.buildIndex(contacts);
  }

  /**
   * Get index statistics for debugging
   */
  getStats(): { indexSize: number; contactCount: number; averageTermsPerContact: number } {
    return {
      indexSize: this.index.size,
      contactCount: this.contacts.size,
      averageTermsPerContact: this.index.size / Math.max(this.contacts.size, 1)
    };
  }
}