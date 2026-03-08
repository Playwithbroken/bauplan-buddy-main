// DragAndDropContext for managing drag-and-drop state across the application

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  DragAndDropContextType, 
  DragAndDropState, 
  DragItem, 
  DropTarget 
} from '@/types/dragAndDrop';

const DragAndDropContext = createContext<DragAndDropContextType | undefined>(undefined);

export const DragAndDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DragAndDropState>({
    isDragging: false,
    dragItem: null,
    dropTarget: null,
    dragPreview: null
  });

  const startDrag = (item: DragItem) => {
    setState({
      isDragging: true,
      dragItem: item,
      dropTarget: null,
      dragPreview: null
    });
  };

  const updateDrag = (target: DropTarget) => {
    setState(prev => ({
      ...prev,
      dropTarget: target
    }));
  };

  const endDrag = (target?: DropTarget) => {
    setState({
      isDragging: false,
      dragItem: null,
      dropTarget: target || null,
      dragPreview: null
    });
  };

  const cancelDrag = () => {
    setState({
      isDragging: false,
      dragItem: null,
      dropTarget: null,
      dragPreview: null
    });
  };

  const value = {
    state,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag
  };

  return (
    <DragAndDropContext.Provider value={value}>
      {children}
    </DragAndDropContext.Provider>
  );
};

export const useDragAndDropContext = () => {
  const context = useContext(DragAndDropContext);
  if (context === undefined) {
    throw new Error('useDragAndDropContext must be used within a DragAndDropProvider');
  }
  return context;
};