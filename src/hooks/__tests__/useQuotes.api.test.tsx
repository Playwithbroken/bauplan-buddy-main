import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuotes, useConvertQuoteToProject, quoteKeys } from '@/hooks/api/useQuotes'
import type { Quote } from '@/services/api/quotes.api'
import { toast } from '@/hooks/use-toast'

const mockGetAll = jest.fn()
const mockConvertToProject = jest.fn()
const mockSend = jest.fn()

jest.mock('@/services/api/quotes.api', () => ({
  quotesApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    convertToProject: (...args: unknown[]) => mockConvertToProject(...args),
    send: (...args: unknown[]) => mockSend(...args),
  },
}))

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { wrapper, queryClient }
}

describe('useQuotes hook integration', () => {
  beforeEach(() => {
    mockGetAll.mockReset()
    mockConvertToProject.mockReset()
    mockSend.mockReset()
    ;(toast as jest.Mock).mockReset()
  })

  it('fetches quotes with filters applied', async () => {
    const quotes: Quote[] = [
      {
        id: 'ANG-1',
        number: 'ANG-1',
        customerId: 'cust-1',
        customerName: 'Acme GmbH',
        projectName: 'Demo Projekt',
        amount: 15000,
        status: 'sent',
        date: '2024-02-10',
        validUntil: '2024-03-10',
        positions: [],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-11T00:00:00Z',
      },
    ]

    mockGetAll.mockResolvedValue(quotes)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useQuotes({ status: 'sent', search: 'acme' }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetAll).toHaveBeenCalledWith({ status: 'sent', search: 'acme' })
    expect(result.current.data).toEqual(quotes)
  })

  it('converts quote to project and invalidates related queries', async () => {
    mockConvertToProject.mockResolvedValue({ projectId: 'PRJ-1' })

    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useConvertQuoteToProject(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('ANG-1')
    })

    expect(mockConvertToProject).toHaveBeenCalledWith('ANG-1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: quoteKeys.lists() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] })
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Projekt erstellt',
      }),
    )
  })

  it('surfaces toast on conversion failure', async () => {
    const error = new Error('Conversion failed')
    mockConvertToProject.mockRejectedValue(error)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useConvertQuoteToProject(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync('ANG-1')).rejects.toEqual(error)
    })

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      }),
    )
  })
})
