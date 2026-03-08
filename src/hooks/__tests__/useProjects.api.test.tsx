import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProjects, useCreateProject, projectKeys } from '@/hooks/api/useProjects'
import type { Project } from '@/services/api/projects.api'
import { toast } from '@/hooks/use-toast'

const mockGetAll = jest.fn()
const mockCreate = jest.fn()

jest.mock('@/services/api/projects.api', () => ({
  projectsApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getById: jest.fn(),
    getStats: jest.fn(),
    create: (...args: unknown[]) => mockCreate(...args),
    update: jest.fn(),
    delete: jest.fn(),
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

describe('useProjects hook integration', () => {
  beforeEach(() => {
    mockGetAll.mockReset()
    mockCreate.mockReset()
    ;(toast as jest.Mock).mockReset()
  })

  it('fetches projects with provided filters', async () => {
    const projectList: Project[] = [
      {
        id: '1',
        name: 'Test Project',
        customerId: 'cust-1',
        customerName: 'Acme GmbH',
        status: 'active',
        progress: 42,
        budget: 1000,
        spent: 400,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        description: 'Test',
        address: 'Berlin',
      },
    ]

    mockGetAll.mockResolvedValue(projectList)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useProjects({ status: 'active', search: 'acme' }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetAll).toHaveBeenCalledWith({ status: 'active', search: 'acme' })
    expect(result.current.data).toEqual(projectList)
  })

  it('creates project and invalidates queries on success', async () => {
    const newProject = {
      name: 'New Project',
      customerId: 'cust-2',
      customerName: 'Beta GmbH',
      budget: 5000,
      startDate: '2024-02-01',
      endDate: '2024-07-31',
    }

    mockCreate.mockResolvedValue({ id: 'new-id', ...newProject })

    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateProject(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(newProject)
    })

    expect(mockCreate).toHaveBeenCalledWith(newProject)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.lists() })
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Projekt erstellt',
      }),
    )
  })

  it('shows toast on create error', async () => {
    const error = new Error('Cannot create')
    mockCreate.mockRejectedValue(error)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateProject(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({} as never)).rejects.toEqual(error)
    })

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      }),
    )
  })
})
