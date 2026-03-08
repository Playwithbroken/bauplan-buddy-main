// ResizableAppointment Component with resize handles

import React, { useState, useRef, useEffect } from 'react';
import { StoredAppointment } from '@/services/appointmentService';
import { 
  DragItem, 
  DropTarget
} from '@/types/dragAndDrop';
import { dragDropService } from '@/services/dragDropService';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  GripVertical,
  Pencil,
  Trash2,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import DraggableAppointment from '@/components/DraggableAppointment';

interface ResizableAppointmentProps {
  appointment: StoredAppointment;
  onEdit: (appointment: StoredAppointment) => void;
  onDelete: (appointmentId: string) => void;
  onResizeStart?: (item: DragItem) => void;
  onResizeEnd?: (item: DragItem, target?: DropTarget) => void;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, target?: DropTarget) => void;
  className?: string;
  isDragging?: boolean;
  isResizing?: boolean;
}

const ResizableAppointment: React.FC<ResizableAppointmentProps> = ({
  appointment,
  onEdit,
  onDelete,
  onResizeStart,
  onResizeEnd,
  onDragStart,
  onDragEnd,
  className,
  isDragging = false,
  isResizing = false
}) => {
  const [isResizingState, setIsResizingState] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse down on resize handle
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizeRef.current || !resizeHandleRef.current) return;
    
    setIsResizingState(true);
    
    // Create drag item for resizing
    const dragItem: DragItem = dragDropService.startDrag(appointment);
    
    // Call parent handler
    if (onResizeStart) {
      onResizeStart(dragItem);
    }
    
    // Add global event listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Prevent default to avoid text selection
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle resizing
  const handleResize = (e: MouseEvent) => {
    if (!isResizingState || !resizeRef.current) return;
    
    // In a real implementation, we would calculate the new end time based on mouse position
    // For now, we'll just update the visual state
    resizeRef.current.style.opacity = '0.8';
  };
  
  // Handle resize end
  const handleResizeEnd = async (e: MouseEvent) => {
    if (!isResizingState) return;
    
    setIsResizingState(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // Reset element styles
    if (resizeRef.current) {
      resizeRef.current.style.opacity = '';
    }
    
    // Call parent handler
    if (onResizeEnd) {
      // In a real implementation, we would determine the new end time based on mouse position
      // For now, we'll pass null to indicate the resize was cancelled
      onResizeEnd(dragDropService.startDrag(appointment), undefined);
    }
  };
  
  return (
    <div
      ref={resizeRef}
      className={cn(
        "relative border rounded-lg p-3 mb-2 shadow-sm transition-all duration-200",
        "bg-white border-gray-200 hover:shadow-md",
        isDragging ? "opacity-50 scale-95" : "",
        isResizing ? "opacity-75" : "",
        className
      )}
    >
      <DraggableAppointment
        appointment={appointment}
        onEdit={onEdit}
        onDelete={onDelete}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className=""
        isDragging={isDragging}
      />
      
      {/* Resize handle at the bottom */}
      <div
        ref={resizeHandleRef}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-6 h-2 bg-gray-400 rounded-full cursor-ns-resize hover:bg-gray-600 flex items-center justify-center"
        onMouseDown={handleResizeStart}
      >
        <Minus className="h-3 w-3 text-white" />
      </div>
    </div>
  );
};

export default ResizableAppointment;