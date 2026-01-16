import { motion } from "motion/react";
import { GitBranch, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import type { PipelineWithCreator } from "../hooks/usePipelines";
import { PIPELINE_STATUSES } from "@/types/database";

interface PipelineCardProps {
  pipeline: PipelineWithCreator;
  taskCount?: number;
  completedCount?: number;
  onClick: () => void;
}

export function PipelineCard({ pipeline, taskCount = 0, completedCount = 0, onClick }: PipelineCardProps) {
  const status = PIPELINE_STATUSES[pipeline.status];
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const creatorName = pipeline.creator?.display_name || pipeline.creator?.email?.split('@')[0] || "Unknown";

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e5eb',
        padding: 20,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${status.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GitBranch style={{ width: 18, height: 18, color: status.color }} />
          </div>
          <div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#1e1e2e',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {pipeline.name}
            </h3>
            <span style={{
              fontSize: 12,
              color: '#9ca3af',
            }}>
              by {creatorName}
            </span>
          </div>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: `${status.color}15`,
          color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      {/* Description */}
      {pipeline.description && (
        <p style={{
          fontSize: 13,
          color: '#6b7280',
          margin: '0 0 16px 0',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {pipeline.description}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
            Progress
          </span>
          <span style={{ fontSize: 12, color: '#1e1e2e', fontWeight: 600 }}>
            {progress}%
          </span>
        </div>
        <div style={{
          height: 6,
          backgroundColor: '#f3f4f6',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: '100%',
              backgroundColor: progress === 100 ? '#16a34a' : '#7c3aed',
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280' }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12 }}>
              {completedCount}/{taskCount} tasks
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af' }}>
            <Clock style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12 }}>
              {formatDate(pipeline.created_at)}
            </span>
          </div>
        </div>
        <ChevronRight style={{ width: 16, height: 16, color: '#9ca3af' }} />
      </div>
    </motion.div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
