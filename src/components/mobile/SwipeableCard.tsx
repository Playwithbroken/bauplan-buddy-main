import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Edit, Eye } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
}

/**
 * Swipeable Card for mobile interactions
 * Swipe left to reveal actions
 */
export function SwipeableCard({
  children,
  onEdit,
  onDelete,
  onView,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe
    if (diff < 0) {
      setOffset(Math.max(diff, -120)); // Max 120px swipe
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to open or closed
    if (offset < -60) {
      setOffset(-120);
    } else {
      setOffset(0);
    }
  };

  const actions = [
    onView && { icon: Eye, onClick: onView, color: 'bg-blue-500' },
    onEdit && { icon: Edit, onClick: onEdit, color: 'bg-yellow-500' },
    onDelete && { icon: Trash2, onClick: onDelete, color: 'bg-red-500' },
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons (Hidden behind) */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {actions.map((action, i) => {
          if (!action) return null;
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => {
                action.onClick();
                setOffset(0);
              }}
              className={cn(
                'w-16 flex items-center justify-center text-white transition-opacity',
                action.color,
                offset < -60 ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Card Content */}
      <div
        className={cn('transition-transform bg-background', className)}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
