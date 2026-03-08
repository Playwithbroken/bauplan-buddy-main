import Fuse from 'fuse.js';

export interface SearchResultItem {
  id: string;
  type: 'project' | 'invoice' | 'contact' | 'document' | 'action';
  title: string;
  subtitle: string;
  url?: string;
  tags?: string[];
  metadata?: any;
}

// Mock data for search demo
const MOCK_DATA: SearchResultItem[] = [
  { id: 'p1', type: 'project', title: 'Office Renovation Berlin', subtitle: 'Active • Due Oct 25', url: '/projects/1' },
  { id: 'p2', type: 'project', title: 'Villa Schmidt Construction', subtitle: 'Planning • Budget €1.2M', url: '/projects/2' },
  { id: 'i1', type: 'invoice', title: 'INV-2023-001', subtitle: '€4,500.00 • Overdue', url: '/invoices/1' },
  { id: 'i2', type: 'invoice', title: 'INV-2023-002', subtitle: '€12,000.00 • Paid', url: '/invoices/2' },
  { id: 'c1', type: 'contact', title: 'Hans Müller', subtitle: 'Architect • Berlin', url: '/contacts/1' },
  { id: 'c2', type: 'contact', title: 'Schmidt Bau GmbH', subtitle: 'Contractor • Munich', url: '/contacts/2' },
  { id: 'd1', type: 'document', title: 'Floor_Plan_v2.pdf', subtitle: 'Blueprint • 2.4MB', url: '/docs/1' },
  { id: 'a1', type: 'action', title: 'Create New Invoice', subtitle: 'Action', url: '/invoices/new' },
  { id: 'a2', type: 'action', title: 'Add New Project', subtitle: 'Action', url: '/projects/new' },
];

class SearchService {
  private fuse: Fuse<SearchResultItem>;

  constructor() {
    const options = {
      keys: ['title', 'subtitle', 'type', 'tags'],
      threshold: 0.3, // Fuzzy match threshold
      distance: 100,
    };
    this.fuse = new Fuse(MOCK_DATA, options);
  }

  search(query: string): SearchResultItem[] {
    if (!query) return [];
    return this.fuse.search(query).map(result => result.item);
  }

  // In a real app, this would index data from API
  async indexData(data: SearchResultItem[]) {
    this.fuse.setCollection(data);
  }
}

export const searchService = new SearchService();
export default searchService;