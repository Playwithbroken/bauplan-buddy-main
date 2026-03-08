import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Clock, MapPin, DollarSign, CheckCircle, 
  XCircle, AlertCircle, Plus, Edit, Trash2, Eye,
  Truck, Building, Wrench, Users, BarChart3,
  Filter, Search, RefreshCw
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
import ResourceBookingService, {
  Resource,
  ResourceBooking,
  ResourceUtilization
} from '@/services/resourceBookingService';

interface ResourceBookingProps {
  className?: string;
}

const ResourceBookingComponent: React.FC<ResourceBookingProps> = ({ className }) => {
  const { toast } = useToast();
  const [bookingService] = useState(() => ResourceBookingService);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ResourceBooking[]>([]);
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, confirmedBookings: 0, totalRevenue: 0 });
  const [isBookingResource, setIsBookingResource] = useState(false);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newBooking, setNewBooking] = useState({
    resourceId: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    userId: 'current_user',
    userName: 'Current User'
  });
  const [newResource, setNewResource] = useState({
    name: '',
    type: 'equipment' as const,
    category: '',
    description: '',
    location: '',
    capacity: '',
    baseRate: '',
    requiresApproval: false
  });

  const loadData = React.useCallback(() => {
    setResources(bookingService.getResources());
    setBookings(bookingService.getBookings());
    setPendingApprovals(bookingService.getPendingApprovals());
    setStats(bookingService.getBookingStats());
  }, [bookingService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBooking = async () => {
    if (!newBooking.resourceId || !newBooking.startTime || !newBooking.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const booking = await bookingService.createBooking({
        resourceId: newBooking.resourceId,
        title: newBooking.title || 'Resource Booking',
        description: newBooking.description,
        startTime: new Date(newBooking.startTime),
        endTime: new Date(newBooking.endTime),
        userId: newBooking.userId,
        userName: newBooking.userName
      });

      loadData();
      setIsBookingResource(false);
      setNewBooking({
        resourceId: '',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        userId: 'current_user',
        userName: 'Current User'
      });

      toast({
        title: "Booking Created",
        description: `Your booking for "${booking.resourceName}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : 'Failed to create booking.',
        variant: "destructive"
      });
    }
  };

  const handleCreateResource = () => {
    if (!newResource.name || !newResource.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in the required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const resource = bookingService.createResource({
        name: newResource.name,
        type: newResource.type,
        category: newResource.category,
        description: newResource.description,
        location: newResource.location,
        capacity: newResource.capacity ? parseInt(newResource.capacity) : undefined,
        pricing: {
          baseRate: parseFloat(newResource.baseRate) || 0,
          rateType: 'hourly',
          currency: 'EUR'
        },
        bookingRules: {
          minimumDuration: 60,
          maximumDuration: 480,
          requiresApproval: newResource.requiresApproval,
          approvers: newResource.requiresApproval ? ['manager@company.com'] : [],
          bufferTime: 15
        }
      });

      loadData();
      setIsCreatingResource(false);
      setNewResource({
        name: '',
        type: 'equipment',
        category: '',
        description: '',
        location: '',
        capacity: '',
        baseRate: '',
        requiresApproval: false
      });

      toast({
        title: "Resource Created",
        description: `"${resource.name}" has been added to your resources.`,
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create resource.",
        variant: "destructive"
      });
    }
  };

  const handleApproveBooking = (bookingId: string) => {
    const success = bookingService.approveBooking(bookingId, 'current_manager');
    if (success) {
      loadData();
      toast({
        title: "Booking Approved",
        description: "The booking has been approved successfully.",
      });
    }
  };

  const handleRejectBooking = (bookingId: string) => {
    const success = bookingService.rejectBooking(bookingId, 'current_manager', 'Not available');
    if (success) {
      loadData();
      toast({
        title: "Booking Rejected",
        description: "The booking has been rejected.",
      });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const success = bookingService.cancelBooking(bookingId);
    if (success) {
      loadData();
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled.",
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <Building className="h-4 w-4" />;
      case 'vehicle':
        return <Truck className="h-4 w-4" />;
      case 'equipment':
      case 'tool':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      pending: 'secondary',
      confirmed: 'default',
      in_progress: 'outline',
      completed: 'default',
      cancelled: 'destructive'
    };
    
    return variants[status] || 'outline';
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      not_required: 'outline',
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };
    
    return variants[status] || 'outline';
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resource Booking</h2>
          <p className="text-muted-foreground">
            Manage equipment, vehicles, and facility bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatingResource} onOpenChange={setIsCreatingResource}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Resource</DialogTitle>
                <DialogDescription>
                  Add a new resource that can be booked
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resource-name">Name *</Label>
                  <Input
                    id="resource-name"
                    value={newResource.name}
                    onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Resource name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-type">Type *</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value: Resource['type']) => setNewResource(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="tool">Tool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resource-category">Category</Label>
                    <Input
                      id="resource-category"
                      value={newResource.category}
                      onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Category"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="resource-description">Description</Label>
                  <Textarea
                    id="resource-description"
                    value={newResource.description}
                    onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Resource description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource-location">Location</Label>
                    <Input
                      id="resource-location"
                      value={newResource.location}
                      onChange={(e) => setNewResource(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resource-capacity">Capacity</Label>
                    <Input
                      id="resource-capacity"
                      type="number"
                      value={newResource.capacity}
                      onChange={(e) => setNewResource(prev => ({ ...prev, capacity: e.target.value }))}
                      placeholder="Max capacity"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="resource-rate">Hourly Rate (EUR)</Label>
                  <Input
                    id="resource-rate"
                    type="number"
                    value={newResource.baseRate}
                    onChange={(e) => setNewResource(prev => ({ ...prev, baseRate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatingResource(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateResource}>
                  Create Resource
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBookingResource} onOpenChange={setIsBookingResource}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Book Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Resource</DialogTitle>
                <DialogDescription>
                  Reserve a resource for your project or task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="booking-resource">Resource *</Label>
                  <Select
                    value={newBooking.resourceId}
                    onValueChange={(value) => setNewBooking(prev => ({ ...prev, resourceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.filter(r => r.status === 'available').map(resource => (
                        <SelectItem key={resource.id} value={resource.id}>
                          <div className="flex items-center gap-2">
                            {getResourceIcon(resource.type)}
                            {resource.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="booking-title">Title</Label>
                  <Input
                    id="booking-title"
                    value={newBooking.title}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Booking title"
                  />
                </div>
                <div>
                  <Label htmlFor="booking-description">Description</Label>
                  <Textarea
                    id="booking-description"
                    value={newBooking.description}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Purpose and details"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="booking-start">Start Time *</Label>
                    <Input
                      id="booking-start"
                      type="datetime-local"
                      value={newBooking.startTime}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="booking-end">End Time *</Label>
                    <Input
                      id="booking-end"
                      type="datetime-local"
                      value={newBooking.endTime}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBookingResource(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBooking}>
                  Create Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Confirmed</span>
            </div>
            <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({pendingApprovals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="room">Rooms</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicles</SelectItem>
                    <SelectItem value="tool">Tools</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={loadData}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.type)}
                      <h3 className="font-medium">{resource.name}</h3>
                    </div>
                    <Badge variant={resource.status === 'available' ? 'default' : 'secondary'}>
                      {resource.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {resource.location}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      €{resource.pricing.baseRate}/{resource.pricing.rateType}
                    </div>
                    {resource.capacity && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Capacity: {resource.capacity}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => {
                        setNewBooking(prev => ({ ...prev, resourceId: resource.id }));
                        setIsBookingResource(true);
                      }}
                      size="sm"
                      className="flex-1"
                      disabled={resource.status !== 'available'}
                    >
                      Book Now
                    </Button>
                    <Button
                      onClick={() => setSelectedResource(resource)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                Manage resource bookings and reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bookings found. Create your first booking to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 10).map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{booking.title}</h4>
                            <Badge variant={getStatusBadge(booking.status)}>
                              {booking.status.toUpperCase()}
                            </Badge>
                            <Badge variant={getApprovalBadge(booking.approvalStatus)}>
                              {booking.approvalStatus.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {booking.resourceName} • {booking.userName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                            </span>
                            <span>{formatDuration(booking.duration)}</span>
                            <span>€{booking.pricing.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.status === 'confirmed' && (
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {booking.description && (
                        <p className="text-sm text-muted-foreground">
                          {booking.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Resource bookings requiring your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {booking.resourceName} • Requested by {booking.userName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}</span>
                            <span>€{booking.pricing.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleApproveBooking(booking.id)}
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectBooking(booking.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      {booking.description && (
                        <p className="text-sm">{booking.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceBookingComponent;

