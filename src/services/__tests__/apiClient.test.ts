import ApiClient, { ApiError } from '@/services/apiClient'

const originalFetch = global.fetch

describe('ApiClient', () => {
  beforeAll(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  const createJsonResponse = (data: unknown, init?: Partial<Response>): Response =>
    ({
      ok: true,
      status: init?.status ?? 200,
      headers: new Headers({ 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) }),
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn(),
      blob: jest.fn(),
      arrayBuffer: jest.fn(),
    }) as unknown as Response

  const createErrorResponse = (status: number, payload: unknown): Response =>
    ({
      ok: false,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
      json: jest.fn(),
      blob: jest.fn(),
      arrayBuffer: jest.fn(),
    }) as unknown as Response

  it('builds URLs with query parameters and parses JSON', async () => {
    const client = new ApiClient('https://api.example.com/v1')
    const payload = { items: [1, 2, 3] }
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(createJsonResponse(payload))

    const result = await client.get('/projects', { params: { status: 'active', page: 2 } })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/projects?status=active&page=2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
    expect(result).toEqual(payload)
  })

  it('includes bearer token when set', async () => {
    const client = new ApiClient('https://api.example.com')
    const payload = { ok: true }
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(createJsonResponse(payload))

    client.setAccessToken('secret-token')
    await client.get('/status')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
    })
  })

  it('retries once after invoking unauthorized handler on 401', async () => {
    const client = new ApiClient('https://api.example.com')
    const handler = jest.fn().mockResolvedValue(true)
    client.setUnauthorizedHandler(handler)

    const errorPayload = { error: { message: 'Unauthorized', code: '401' } }
    const successPayload = { success: true }

    const fetchMock = global.fetch as jest.Mock
    fetchMock
      .mockResolvedValueOnce(createErrorResponse(401, errorPayload))
      .mockResolvedValueOnce(createJsonResponse(successPayload))

    const result = await client.get('/secure-resource')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual(successPayload)
  })

  it('throws ApiError when unauthorized handler fails to resolve', async () => {
    const client = new ApiClient('https://api.example.com')
    const handler = jest.fn().mockResolvedValue(false)
    client.setUnauthorizedHandler(handler)

    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue(createErrorResponse(401, { error: { message: 'Unauthorized' } }))

    await expect(client.get('/secure-resource')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
