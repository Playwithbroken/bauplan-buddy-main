// Drag and Drop Types for Calendar Interactions

export interface DragItem {
  type: 'appointment';
  id: string;
  data: Record<string, unknown>;
  startTime: string;
  endTime: string;
  date: string;
}

export interface DropTarget {
  date: string;
  startTime?: string;
  endTime?: string;
  resourceId?: string;
}

export interface DragAndDropState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dropTarget: DropTarget | null;
  dragPreview: React.ReactNode | null;
}

export interface DragAndDropContextType {
  state: DragAndDropState;
  startDrag: (item: DragItem) => void;
  updateDrag: (target: DropTarget) => void;
  endDrag: (target?: DropTarget) => void;
  cancelDrag: () => void;
}

export interface DraggableProps {
  item: DragItem;
  children: React.ReactNode;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, target?: DropTarget) => void;
}

export interface DropZoneProps {
  target: DropTarget;
  children: React.ReactNode;
  onDrop?: (item: DragItem, target: DropTarget) => void;
  onDragOver?: (item: DragItem, target: DropTarget) => void;
}

export interface CalendarDragEvent {
  appointmentId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  resourceId?: string;
}

export interface CalendarDropEvent {
  date: string;
  startTime?: string;
  endTime?: string;
  resourceId?: string;
}

export interface DragAndDropOptions {
  enableDrag?: boolean;
  enableDrop?: boolean;
  snapToGrid?: boolean;
  gridSize?: number; // in minutes
  conflictDetection?: boolean;
  showPreview?: boolean;
}

export interface DragPreviewPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingAppointments: string[];
  message: string;
}