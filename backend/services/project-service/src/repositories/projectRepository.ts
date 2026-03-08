import { Prisma, ProjectStatus, Project, getPrismaClient } from '@bauplan/database';

const prisma = getPrismaClient();

export interface CreateProjectPayload {
  quoteId?: string;
  customerId: string;
  name: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

const toDecimal = (value?: number) => {
  if (value === undefined || value === null) return undefined;
  return new Prisma.Decimal(value);
};

export const generateProjectNumber = async (): Promise<string> => {
  const count = await prisma.project.count();
  return `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const projectNumber = await generateProjectNumber();

  return prisma.project.create({
    data: {
      number: projectNumber,
      quoteId: payload.quoteId,
      customerId: payload.customerId,
      name: payload.name,
      budget: toDecimal(payload.budget),
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      status: payload.status ?? ProjectStatus.PLANNING,
      organizationId: (payload as any).organizationId
    } as any
  });
};

export const listProjects = async (): Promise<Project[]> => {
  return prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
};

export const findProjectById = async (id: string): Promise<Project | null> => {
  return prisma.project.findUnique({ where: { id } });
};
