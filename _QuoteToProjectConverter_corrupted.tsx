

};
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);



  const [conversionJob, setConversionJob] = useState<QuoteConversionJob | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const useBackendConversion = (import.meta.env.VITE_USE_API ?? 'false') === 'true';

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

const mapBackendProjectStatus = (status?: string): ConvertedProject[''status''] => {
  if (!status) return 'planning';
  switch (status.toLowerCase()) {
    case 'active':
      return 'active';
    case 'paused':
    case 'on_hold':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'planning';
  }
};

const normalizeDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value.split('T')[0];
};

const buildConvertedProjectFromBackend = (
  quote: QuoteData,
  template: ProjectTemplate | null,
  selectedStartDate: string,
  job: QuoteConversionJob,
  projectSummary?: ProjectSummary | null
): ConvertedProject => {
  const estimatedDuration = template
    ? Math.ceil((quote.estimatedDuration || 60) * template.estimatedDurationMultiplier)
    : Math.ceil(quote.estimatedDuration || 60);

  const phases = template
    ? template.phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.map(task => ({ ...task }))
      }))
    : [];

  const milestones = template
    ? template.defaultMilestones.map(milestone => ({ ...milestone }))
    : [];

  const documents = template
    ? template.requiredDocuments.map((doc, index) => ({
        id: `${job.projectId ?? uuidv4()}-doc-${index}`,
        name: doc,
        type: 'other' as const,
        status: 'required' as const,
        category: 'general'
      }))
    : [];

  return {
    id: projectSummary?.id ?? job.projectId ?? uuidv4(),
    name: projectSummary?.name ?? quote.project,
    customer: quote.customer,
    customerId: quote.customerId,
    status: mapBackendProjectStatus(projectSummary?.status),
    budget: projectSummary?.budget ?? quote.amount,
    estimatedDuration,
    startDate: normalizeDate(projectSummary?.startDate) ?? selectedStartDate,
    endDate: normalizeDate(projectSummary?.endDate),
    phases,
    milestones,
    team: [],
    documents,
    risks: [],
    quoteReference: quote.id,
    createdAt: projectSummary?.createdAt ?? new Date().toISOString(),
    createdBy: 'system'
  };
};

