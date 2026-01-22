import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import type { BulletinWithCreator } from "../hooks/useBulletins";
import { useBulletinMutations } from "../hooks/useBulletinMutations";
import { useTheme } from "@/stores/themeStore";

interface BulletinNoteProps {
  bulletin: BulletinWithCreator;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function BulletinNote({ bulletin, onDelete, isDeleting }: BulletinNoteProps) {
  const theme = useTheme();
  const { updateBulletinPosition } = useBulletinMutations();
  const [isDragging, setIsDragging] = useState(false);
  const [isNearEdge, setIsNearEdge] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    containerRect: DOMRect | null;
  }>({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, containerRect: null });

  const creatorName = bulletin.creator?.display_name || bulletin.creator?.email?.split('@')[0] || 'Unknown';

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!noteRef.current || !dragDataRef.current.containerRect) return;

    const { containerRect, offsetX, offsetY } = dragDataRef.current;

    const newX = ((clientX - containerRect.left - offsetX) / containerRect.width) * 100;
    const newY = ((clientY - containerRect.top - offsetY) / containerRect.height) * 100;

    noteRef.current.style.left = `${newX}%`;
    noteRef.current.style.top = `${newY}%`;

    // Check if near edge (for delete indicator)
    const nearEdge = newX < 0 || newX > 90 || newY < 0 || newY > 85;
    setIsNearEdge(nearEdge);

    if (nearEdge) {
      noteRef.current.style.opacity = '0.5';
      noteRef.current.style.transform = `rotate(${bulletin.rotation}deg) scale(0.9)`;
    } else {
      noteRef.current.style.opacity = '1';
      noteRef.current.style.transform = `rotate(${bulletin.rotation}deg) scale(1.05)`;
    }
  }, [bulletin.rotation]);

  const handleDragEnd = useCallback((clientX: number, clientY: number) => {
    if (!noteRef.current || !dragDataRef.current.containerRect) return;

    const { containerRect, offsetX, offsetY } = dragDataRef.current;

    const newX = ((clientX - containerRect.left - offsetX) / containerRect.width) * 100;
    const newY = ((clientY - containerRect.top - offsetY) / containerRect.height) * 100;

    // If dragged to edge, delete
    if (newX < 0 || newX > 90 || newY < 0 || newY > 85) {
      onDelete(bulletin.id);
      return;
    }

    // Otherwise, save new position
    const clampedX = Math.max(5, Math.min(85, newX));
    const clampedY = Math.max(5, Math.min(80, newY));

    noteRef.current.style.left = `${clampedX}%`;
    noteRef.current.style.top = `${clampedY}%`;
    noteRef.current.style.opacity = '1';
    noteRef.current.style.transform = `rotate(${bulletin.rotation}deg)`;

    updateBulletinPosition.mutate({
      id: bulletin.id,
      position_x: clampedX,
      position_y: clampedY,
    });
  }, [bulletin.id, bulletin.rotation, onDelete, updateBulletinPosition]);

  // Document-level mouse event handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      setIsNearEdge(false);
      handleDragEnd(e.clientX, e.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Document-level touch event handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setIsDragging(false);
      setIsNearEdge(false);
      const touch = e.changedTouches[0];
      handleDragEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleDragStart = (clientX: number, clientY: number) => {
    const container = noteRef.current?.parentElement;
    if (!container || !noteRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const noteRect = noteRef.current.getBoundingClientRect();

    dragDataRef.current = {
      startX: clientX,
      startY: clientY,
      offsetX: clientX - noteRect.left,
      offsetY: clientY - noteRect.top,
      containerRect,
    };

    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  return (
    <motion.div
      ref={noteRef}
      initial={{ opacity: 0, scale: 0.5, rotate: bulletin.rotation - 20 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        scale: isDeleting ? 0.5 : 1,
        rotate: bulletin.rotation,
        x: isDeleting ? 100 : 0,
      }}
      exit={{ opacity: 0, scale: 0.5, x: 100 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
      style={{
        position: 'absolute',
        left: `${bulletin.position_x}%`,
        top: `${bulletin.position_y}%`,
        width: 160,
        minHeight: 120,
        backgroundColor: bulletin.color,
        borderRadius: 2,
        padding: 12,
        paddingTop: 20,
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.3)'
          : '2px 2px 8px rgba(0,0,0,0.2)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: isDragging ? 100 : 1,
        transform: `rotate(${bulletin.rotation}deg)`,
        border: isNearEdge ? `2px dashed ${theme.colors.error}` : 'none',
        transition: 'box-shadow 0.3s ease, border 0.3s ease',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Pin */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}
        />
      </div>

      {/* Message */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: '#1a1a1a',
          lineHeight: 1.4,
          fontFamily: "'Comic Sans MS', 'Chalkboard', cursive, sans-serif",
          wordBreak: 'break-word',
        }}
      >
        {bulletin.message}
      </p>

      {/* Creator */}
      <p
        style={{
          margin: '12px 0 0 0',
          fontSize: 10,
          color: 'rgba(0, 0, 0, 0.6)',
          fontStyle: 'italic',
          textAlign: 'right',
        }}
      >
        - {creatorName}
      </p>

      {/* Drag hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          fontSize: 9,
          color: isNearEdge ? '#dc2626' : 'rgba(0, 0, 0, 0.5)',
          opacity: isNearEdge ? 1 : 0.5,
          fontWeight: isNearEdge ? 600 : 400,
          transition: 'all 0.2s ease',
        }}
      >
        {isNearEdge ? 'release to delete' : 'drag to edge to remove'}
      </div>
    </motion.div>
  );
}
