// DropZone Component for calendar date/time slots

import React, { useState, useEffect, useRef } from 'react';
import { 
  DropTarget, 
  DragItem,
  CalendarDropEvent
} from '@/types/dragAndDrop';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface DropZoneProps {
  target: DropTarget;
  onDrop?: (item: DragItem, target: DropTarget) => void;
  onDragOver?: (item: DragItem, target: DropTarget) => void;
  onDragLeave?: (item: DragItem, target: DropTarget) => void;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  isActive?: boolean;
  canDrop?: boolean;
  timeLabel?: string;
  showTimeIndicator?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({
  target,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  className,
  children,
  isActive = false,
  canDrop = true,
  timeLabel,
  showTimeIndicator = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get drag item from data transfer
    try {
      const itemData = e.dataTransfer.getData('text/plain');
      if (itemData) {
        const item: DragItem = JSON.parse(itemData);
        setDragItem(item);
        setIsDragOver(true);
        
        if (onDragOver) {
          onDragOver(item, target);
        }
      }
    } catch (error) {
      console.error('Error parsing drag item data:', error);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    
    try {
      const itemData = e.dataTransfer.getData('text/plain');
      if (itemData) {
        const item: DragItem = JSON.parse(itemData);
        
        if (onDrop && canDrop) {
          onDrop(item, target);
        }
      }
    } catch (error) {
      console.error('Error parsing dropped item data:', error);
    }
    
    setDragItem(null);
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent) => {
    // Check if we're actually leaving the drop zone
    if (!dropRef.current || dropRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsDragOver(false);
    
    if (onDragLeave && dragItem) {
      onDragLeave(dragItem, target);
    }
    
    setDragItem(null);
  };

  // Handle click event (for mobile/touch devices or date selection)
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={dropRef}
            className={cn(
              "relative border border-transparent rounded-sm transition-all duration-200",
              className,
              isDragOver && canDrop && "bg-blue-100 border-blue-300 shadow-sm",
              isDragOver && !canDrop && "bg-red-100 border-red-300",
              isActive && "bg-blue-50",
              showTimeIndicator && "border-dashed border-gray-200"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            {children}
            
            {showTimeIndicator && timeLabel && (
              <div className="absolute top-0 left-0 text-xs text-gray-400 -translate-y-1/2 -translate-x-1/2">
                {timeLabel}
              </div>
            )}
            
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  canDrop ? "bg-blue-500" : "bg-red-500"
                )} />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {canDrop 
              ? `Drop appointment here: ${target.date}${timeLabel ? ` at ${timeLabel}` : ''}` 
              : "Cannot drop appointment here"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DropZone;