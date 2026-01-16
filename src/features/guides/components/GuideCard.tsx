import { motion } from "motion/react";
import { BookOpen, Eye, Clock, User } from "lucide-react";
import type { GuideWithCreator } from "../hooks/useGuides";

interface GuideCardProps {
  guide: GuideWithCreator;
  onClick: () => void;
}

// Library-themed colors
const BOOK_COLORS = [
  '#8B4513', // Saddle brown
  '#654321', // Dark brown
  '#4A3728', // Deep brown
  '#6B4423', // Brown leather
  '#5D3A1A', // Rustic brown
  '#7B3F00', // Chocolate
  '#4E3B31', // Taupe
  '#3D2914', // Dark leather
];

export function GuideCard({ guide, onClick }: GuideCardProps) {
  const creatorName = guide.creator?.display_name || guide.creator?.email?.split('@')[0] || "Unknown";
  const stepCount = guide.content?.steps?.length || 0;

  // Generate consistent color based on guide id
  const colorIndex = guide.id.charCodeAt(0) % BOOK_COLORS.length;
  const bookColor = BOOK_COLORS[colorIndex];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Book spine effect */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 12,
        backgroundColor: bookColor,
        borderRadius: '4px 0 0 4px',
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
      }} />

      {/* Main card - looks like book cover */}
      <div style={{
        marginLeft: 8,
        backgroundColor: '#F5F1E8', // Aged paper
        borderRadius: '4px 12px 12px 4px',
        border: `3px solid ${bookColor}`,
        borderLeft: 'none',
        padding: 20,
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 4px 12px rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.2s ease',
      }}>
        {/* Category tag */}
        {guide.category && (
          <span style={{
            alignSelf: 'flex-start',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: `${bookColor}20`,
            color: bookColor,
            marginBottom: 12,
          }}>
            {guide.category}
          </span>
        )}

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#2C1810', // Dark leather text
          margin: 0,
          marginBottom: 8,
          lineHeight: 1.3,
          fontFamily: 'Georgia, serif',
        }}>
          {guide.title}
        </h3>

        {/* Description */}
        {guide.description && (
          <p style={{
            fontSize: 13,
            color: '#5D4E37',
            lineHeight: 1.5,
            margin: 0,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}>
            {guide.description}
          </p>
        )}

        {/* Decorative line */}
        <div style={{
          height: 2,
          backgroundColor: bookColor,
          opacity: 0.3,
          marginBottom: 12,
          borderRadius: 1,
        }} />

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#8B7355',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen style={{ width: 12, height: 12 }} />
              {stepCount} steps
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye style={{ width: 12, height: 12 }} />
              {guide.view_count}
            </span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <User style={{ width: 12, height: 12 }} />
            {creatorName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
