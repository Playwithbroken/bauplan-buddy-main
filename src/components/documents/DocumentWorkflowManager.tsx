import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  Upload, Download, Eye, GitBranch, History, 
  Users, MessageSquare, Calendar, ArrowRight,
  ThumbsUp, ThumbsDown, MoreHorizontal, Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DocumentVersioningService, {
  DocumentVersion,
  ApprovalWorkflow,
  WorkflowTemplate,
  DocumentTemplate
} from '@/services/documentVersioningService';

interface DocumentWorkflowManagerProps {
  documentId?: string;
  onVersionSelect?: (version: DocumentVersion) => void;
  onWorkflowComplete?: (workflow: ApprovalWorkflow) => void;
}

const DocumentWorkflowManager: React.FC<DocumentWorkflowManagerProps> = ({
  documentId,
  onVersionSelect,
  onWorkflowComplete
}) => {
  const { toast } = useToast();
  const [versioningService] = useState(() => DocumentVersioningService);
  const [activeTab, setActiveTab] = useState('versions');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalWorkflow[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  const loadData = React.useCallback(() => {
    if (documentId) {
      const docVersions = versioningService.getVersionHistory(documentId);
      const docWorkflows = versioningService.getWorkflowHistory(documentId);
      setVersions(docVersions);
      setWorkflows(docWorkflows);
    }
    
    setWorkflowTemplates(versioningService.getWorkflowTemplates());
    setPendingApprovals(versioningService.getPendingApprovals('current_user'));
  }, [documentId, versioningService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async () => {
    if (!newVersionFile || !documentId) return;

    setIsUploading(true);
    try {
      const newVersion = versioningService.createVersion(
        documentId,
        newVersionFile,
        changeDescription || 'Document updated',
        'current_user',
        [],
        {}
      );

      setVersions(prev => [...prev, newVersion]);
      setNewVersionFile(null);
      setChangeDescription('');
      
      toast({
        title: "Version Created",
        description: `Version ${newVersion.versionNumber} has been created successfully.`,
      });

      onVersionSelect?.(newVersion);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to create new version. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const initiateWorkflow = (templateId: string) => {
    if (!documentId || !selectedVersion) return;

    try {
      const workflow = versioningService.initiateApprovalWorkflow(
        documentId,
        selectedVersion.id,
        templateId,
        'current_user'
      );

      setWorkflows(prev => [...prev, workflow]);
      
      toast({
        title: "Workflow Initiated",
        description: `${workflow.workflowName} has been started for version ${selectedVersion.versionNumber}.`,
      });

      onWorkflowComplete?.(workflow);
    } catch (error) {
      toast({
        title: "Workflow Failed",
        description: "Failed to initiate approval workflow.",
        variant: "destructive"
      });
    }
  };

  const submitApproval = (workflow: ApprovalWorkflow, decision: 'approved' | 'rejected') => {
    const currentStep = workflow.steps[workflow.currentStepIndex];
    if (!currentStep) return;

    const success = versioningService.submitApproval(
      workflow.id,
      currentStep.id,
      'current_user',
      decision,
      approvalComment
    );

    if (success) {
      loadData();
      setApprovalComment('');
      
      toast({
        title: decision === 'approved' ? "Approved" : "Rejected",
        description: `Workflow step has been ${decision}.`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      in_progress: 'outline',
      expired: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Workflow Manager</h2>
          <p className="text-muted-foreground">
            Manage document versions and approval workflows
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="upload">Upload New Version</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                All versions of this document with change tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No versions found for this document.
                  </p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">v{version.versionNumber}</span>
                            {version.isCurrentVersion && (
                              <Badge variant="default">Current</Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(version.fileSize)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {version.changeDescription}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By {version.uploadedBy}</span>
                            <span>{version.uploadedAt.toLocaleDateString()}</span>
                            <span>{version.uploadedAt.toLocaleTimeString()}</span>
                          </div>
                          {version.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {version.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            {!version.isCurrentVersion && (
                              <DropdownMenuItem>
                                <History className="h-4 w-4 mr-2" />
                                Revert to this version
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedVersion && (
            <Card>
              <CardHeader>
                <CardTitle>Start Approval Workflow</CardTitle>
                <CardDescription>
                  Initiate an approval process for version {selectedVersion.versionNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {workflowTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => initiateWorkflow(template.id)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{template.steps.length} steps</span>
                          <span>{template.sla.totalDays} days SLA</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workflow History
              </CardTitle>
              <CardDescription>
                All approval workflows for this document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No workflows found for this document.
                  </p>
                ) : (
                  workflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{workflow.workflowName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Version {versions.find(v => v.id === workflow.versionId)?.versionNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(workflow.status)}
                            {getStatusBadge(workflow.status)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span>Started by {workflow.initiatedBy}</span>
                          <span>{workflow.initiatedAt.toLocaleDateString()}</span>
                          {workflow.deadline && (
                            <span>Due: {workflow.deadline.toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {workflow.steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(step.status)}
                                <span className="text-xs">{step.name}</span>
                              </div>
                              {index < workflow.steps.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {selectedWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>
                  {selectedWorkflow.workflowName} - {selectedWorkflow.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{step.name}</h4>
                        {getStatusBadge(step.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Approvers:</strong> {step.approvers.join(', ')}
                        </div>
                        <div className="text-sm">
                          <strong>Required approvals:</strong> {step.requiredApprovals}
                        </div>
                        
                        {step.approvals.length > 0 && (
                          <div className="mt-3">
                            <strong className="text-sm">Approvals:</strong>
                            <div className="mt-2 space-y-2">
                              {step.approvals.map((approval) => (
                                <div key={approval.id} className="flex items-center gap-2 text-sm">
                                  {approval.decision === 'approved' ? (
                                    <ThumbsUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <ThumbsDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span>{approval.approverName}</span>
                                  <span className="text-muted-foreground">
                                    {approval.approvedAt.toLocaleDateString()}
                                  </span>
                                  {approval.comments && (
                                    <span className="text-muted-foreground">
                                      - {approval.comments}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                Documents waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending approvals found.
                  </p>
                ) : (
                  pendingApprovals.map((workflow) => {
                    const currentStep = workflow.steps[workflow.currentStepIndex];
                    return (
                      <Card key={workflow.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-medium">{workflow.workflowName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Document ID: {workflow.documentId}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Step: {currentStep?.name}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {workflow.priority.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`comment-${workflow.id}`}>
                                Comments (optional)
                              </Label>
                              <Textarea
                                id={`comment-${workflow.id}`}
                                placeholder="Add your comments..."
                                value={approvalComment}
                                onChange={(e) => setApprovalComment(e.target.value)}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => submitApproval(workflow, 'approved')}
                                className="flex-1"
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => submitApproval(workflow, 'rejected')}
                                variant="destructive"
                                className="flex-1"
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Version
              </CardTitle>
              <CardDescription>
                Create a new version of the document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="change-description">Change Description</Label>
                <Textarea
                  id="change-description"
                  placeholder="Describe what has changed in this version..."
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleFileUpload}
                disabled={!newVersionFile || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Create New Version'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentWorkflowManager;
