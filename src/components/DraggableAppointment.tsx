// DraggableAppointment Component with drag handles and visual feedback

import React, { useState, useRef } from 'react';
import { StoredAppointment } from '@/services/appointmentService';
import { DragItem, DropTarget, DragPreviewPosition } from '@/types/dragAndDrop';
import * as dragDropModule from '@/services/dragDropService';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  GripVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface DraggableAppointmentProps {
  appointment: StoredAppointment;
  onEdit: (appointment: StoredAppointment) => void;
  onDelete: (appointmentId: string) => void;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, target?: DropTarget) => void;
  className?: string;
  isDragging?: boolean;
  dragPreviewPosition?: DragPreviewPosition | null;
}

const DraggableAppointment: React.FC<DraggableAppointmentProps> = ({
  appointment,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  className,
  isDragging = false,
  dragPreviewPosition = null
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragItemRef = useRef<DragItem | null>(null);

  const resolveDragItem = (appointmentData: StoredAppointment): DragItem => {
    const moduleAny = dragDropModule as unknown as {
      dragDropService?: { startDrag?: (appointment: StoredAppointment) => DragItem };
      startDrag?: (appointment: StoredAppointment) => DragItem;
    };

    if (moduleAny?.dragDropService?.startDrag) {
      return moduleAny.dragDropService.startDrag(appointmentData);
    }

    if (moduleAny?.startDrag) {
      return moduleAny.startDrag(appointmentData);
    }

    throw new Error('dragDropService.startDrag is not available');
  };
  
  // Handle mouse down on drag handle
  const handleDragStart = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    setIsDragActive(true);
    
    // Calculate offset from mouse to element top-left
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Build drag item from service
    const dragItem: DragItem = resolveDragItem(appointment);
    dragItemRef.current = dragItem;
    
    // Call parent handler
    if (onDragStart) {
      onDragStart(dragItem);
    }
    
    // Add global event listeners
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Prevent default to avoid text selection
    e.preventDefault();
  };
  
  // Handle dragging
  const handleDrag = (e: MouseEvent) => {
    if (!isDragActive || !dragRef.current) return;
    
    // Update position based on mouse position and offset
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    
    // Update element position
    dragRef.current.style.position = 'fixed';
    dragRef.current.style.left = `${x}px`;
    dragRef.current.style.top = `${y}px`;
    dragRef.current.style.zIndex = '1000';
    dragRef.current.style.opacity = '0.8';
    dragRef.current.style.transform = 'rotate(5deg)';
  };
  
  // Handle drag end
  const handleDragEnd = async (e: MouseEvent) => {
    if (!isDragActive) return;
    
    setIsDragActive(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Reset element styles
    if (dragRef.current) {
      dragRef.current.style.position = '';
      dragRef.current.style.left = '';
      dragRef.current.style.top = '';
      dragRef.current.style.zIndex = '';
      dragRef.current.style.opacity = '';
      dragRef.current.style.transform = '';
    }
    
    // Call parent handler
    if (onDragEnd) {
      // In a real implementation, determine drop target from mouse position
      const dragItem = dragItemRef.current ?? resolveDragItem(appointment);
      onDragEnd(dragItem, undefined);
    }

    dragItemRef.current = null;
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    return time.replace(':', ':');
  };
  
  // Get appointment type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 border-blue-300';
      case 'site-visit': return 'bg-green-100 border-green-300';
      case 'inspection': return 'bg-yellow-100 border-yellow-300';
      case 'deadline': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };
  
  // Handle edit button click
  const handleEdit = () => {
    onEdit(appointment);
  };
  
  // Handle delete button click
  const handleDelete = () => {
    onDelete(appointment.id);
  };

  return (
    <div
      ref={dragRef}
      className={cn(
        "relative border rounded-lg p-3 mb-2 shadow-sm transition-all duration-200",
        getTypeColor(appointment.type),
        isDragging ? "opacity-50 scale-95" : "hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <GripVertical 
                    className="h-4 w-4 text-gray-400 cursor-move flex-shrink-0" 
                    onMouseDown={handleDragStart}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Drag to move appointment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <h3 className="font-medium text-sm truncate">{appointment.title}</h3>
          </div>
          
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
            </div>
            
            {appointment.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{appointment.location}</span>
              </div>
            )}
            
            {appointment.attendees && appointment.attendees.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span>{appointment.attendees.length} attendee(s)</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {appointment.priority === 'high' && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
      )}
    </div>
  );
};

export default DraggableAppointment;

