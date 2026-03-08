import { TextDecoder, TextEncoder } from "util"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Projects from "@/pages/Projects"
import type { ProjectListFilters } from "@/hooks/api/useProjects"
import type { Project } from "@/services/api/projects.api"

if (!(global as unknown as Record<string, unknown>).TextEncoder) {
  ;(global as unknown as Record<string, unknown>).TextEncoder = TextEncoder
}
if (!(global as unknown as Record<string, unknown>).TextDecoder) {
  ;(global as unknown as Record<string, unknown>).TextDecoder = TextDecoder as unknown as typeof TextDecoder
}

const mockUseProjects = jest.fn()
const mockUsePageLoading = jest.fn()
const mockUseAppointments = jest.fn()
const mockUseCreateAppointment = jest.fn()
const mockUseToast = jest.fn()

jest.mock("@/utils/sampleDataInit", () => ({
  initializeSampleData: jest.fn(),
}))

jest.mock("@/hooks/api/useProjects", () => ({
  useProjects: (...args: [ProjectListFilters?]) => mockUseProjects(...args),
  useProjectStats: jest.fn(),
  useCreateProject: jest.fn(),
  projectKeys: {
    lists: () => ["projects", "list"] as const,
  },
}))

jest.mock("@/hooks/usePageLoading", () => ({
  usePageLoading: (...args: unknown[]) => mockUsePageLoading(...args),
}))

jest.mock("@/hooks/useAppointments", () => ({
  useAppointments: (...args: unknown[]) => mockUseAppointments(...args),
  useCreateAppointment: () => mockUseCreateAppointment(),
}))

jest.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => mockUseToast(...args),
}))

jest.mock("@/components/dialogs/InvoiceGenerationDialog", () => ({
  __esModule: true,
  InvoiceGenerationDialog: () => null,
}))

jest.mock("@/components/project/NachkalkulationView", () => ({
  __esModule: true,
  NachkalkulationView: () => null,
}))

jest.mock("@/components/project/DocumentDownloadList", () => ({
  __esModule: true,
  default: () => null,
  DocumentDownloadItem: () => null,
}))

jest.mock("@/components/project/ExcelSyncPanel", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/OfflineIndicator", () => ({
  __esModule: true,
  default: () => null,
  OfflineIndicator: () => null,
}))

jest.mock("@/components/SyncStatusIndicator", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/AppointmentDialog", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/charts/GanttChart", () => ({
  __esModule: true,
  GanttChart: () => null,
}))

jest.mock("@/components/dialogs/AdvancedDocumentManager", () => ({
  __esModule: true,
  AdvancedDocumentManager: () => null,
}))

const renderProjects = () => {
  mockUsePageLoading.mockReturnValue({ loading: false })
  mockUseAppointments.mockReturnValue({ data: [], isLoading: false, error: null })
  mockUseCreateAppointment.mockReturnValue({ mutateAsync: jest.fn() })

  return render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>,
  )
}

describe("Projects page (API integration)", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("renders projects returned by the API", async () => {
    const apiProjects: Project[] = [
      {
        id: "api-1",
        name: "API Project",
        customerId: "cust-1",
        customerName: "Gateway GmbH",
        status: "active",
        progress: 55,
        budget: 120000,
        spent: 45000,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        description: "Project pulled from the backend",
        address: "Berlin",
      },
    ]

    mockUseProjects.mockReturnValue({
      data: apiProjects,
      isLoading: false,
      error: null,
    })

    renderProjects()

    expect(screen.getByText("API Project")).toBeInTheDocument()

  })

  it("falls back to demo data when no API data is available", () => {
    mockUseProjects.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })

    renderProjects()

    expect(screen.getByText("Steel Production Hall")).toBeInTheDocument()
  })

  it("shows an error card when the query fails", () => {
    mockUseProjects.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Backend unreachable"),
    })

    renderProjects()

    expect(screen.getByText("Fehler beim Laden der Projekte")).toBeInTheDocument()
    expect(screen.getByText("Backend unreachable")).toBeInTheDocument()
  })
})
