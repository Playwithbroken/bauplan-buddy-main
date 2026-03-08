import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Quotes from '@/pages/Quotes'
import type { QuoteListFilters } from '@/hooks/api/useQuotes'
import type { Quote } from '@/services/api/quotes.api'

const mockUseQuotes = jest.fn()
const mockUseConvertQuoteToProject = jest.fn()
const mockUsePageLoading = jest.fn()
const mockUseWorkflowDocumentUpload = jest.fn()

jest.mock('@/hooks/api/useQuotes', () => ({
  useQuotes: (...args: [QuoteListFilters?]) => mockUseQuotes(...args),
  useConvertQuoteToProject: () => mockUseConvertQuoteToProject(),
  quoteKeys: {
    lists: () => ['quotes', 'list'] as const,
  },
}))

jest.mock('@/hooks/usePageLoading', () => ({
  usePageLoading: (...args: unknown[]) => mockUsePageLoading(...args),
}))

jest.mock('@/hooks/useWorkflowDocumentUpload', () => ({
  useWorkflowDocumentUpload: () => mockUseWorkflowDocumentUpload(),
}))

jest.mock('@/components/dialogs/QuoteToProjectConverter', () => ({
  __esModule: true,
  QuoteToProjectConverter: () => null,
}))

jest.mock('@/components/dialogs/OrderConfirmationDialog', () => ({
  __esModule: true,
  OrderConfirmationDialog: () => null,
}))

jest.mock('@/components/batch/QuoteBatchOperations', () => ({
  __esModule: true,
  QuoteBatchOperations: () => null,
}))

jest.mock('@/components/forms/EnhancedQuoteCreation', () => ({
  __esModule: true,
  EnhancedQuoteCreation: () => null,
}))

jest.mock('@/components/templates/QuoteTemplatesManager', () => ({
  __esModule: true,
  QuoteTemplatesManager: () => null,
}))

jest.mock('@/components/AdvancedFilterDialog', () => ({
  __esModule: true,
  default: () => null,
}))

const baseSetup = () => {
  mockUsePageLoading.mockReturnValue({ loading: false })
  mockUseConvertQuoteToProject.mockReturnValue({ mutateAsync: jest.fn() })
  mockUseWorkflowDocumentUpload.mockReturnValue({
    inputProps: {},
    startUpload: jest.fn(),
    uploadedDocuments: [],
    isUploadingForKey: () => false,
  })
}

const renderQuotes = () =>
  render(
    <MemoryRouter>
      <Quotes />
    </MemoryRouter>,
  )

describe('Quotes page (API integration)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    baseSetup()
  })

  it('renders quotes returned by the API', () => {
    const apiQuotes: Quote[] = [
      {
        id: 'ANG-API-1',
        number: 'ANG-API-1',
        customerId: 'cust-1',
        customerName: 'Gateway GmbH',
        projectName: 'API Projekt',
        amount: 18000,
        status: 'sent',
        date: '2024-02-01',
        validUntil: '2024-03-01',
        positions: [],
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T12:00:00Z',
      },
    ]

    mockUseQuotes.mockReturnValue({
      data: apiQuotes,
      isLoading: false,
      error: null,
    })

    renderQuotes()

    expect(screen.getByText('Gateway GmbH')).toBeInTheDocument()
    expect(screen.getByText('API Projekt')).toBeInTheDocument()
  })

  it('falls back to demo quotes when API returns no data', () => {
    mockUseQuotes.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    renderQuotes()

    expect(screen.getByText('ANG-2024-001')).toBeInTheDocument()
  })

  it('shows an error banner when the quotes query fails', () => {
    mockUseQuotes.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Quotes service unavailable'),
    })

    renderQuotes()

    expect(screen.getByText('Quotes service unavailable')).toBeInTheDocument()
  })
})
