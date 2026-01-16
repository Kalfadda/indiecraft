import { useState } from "react";
import { GitBranch, CheckCircle2, BookOpen, Plus, Loader2 } from "lucide-react";
import { usePipelines, usePipeline } from "../hooks/usePipelines";
import { PipelineCard } from "./PipelineCard";
import { PipelineDetailModal } from "./PipelineDetailModal";
import { PipelineForm } from "./PipelineForm";
import { FinalizePipelineWizard } from "@/features/guides/components/FinalizePipelineWizard";
import type { PipelineStatus, Pipeline } from "@/types/database";

type PipelineTab = "active" | "completed" | "finalized";

export function PipelinesView() {
  const [activeTab, setActiveTab] = useState<PipelineTab>("active");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [finalizingPipelineId, setFinalizingPipelineId] = useState<string | null>(null);

  // Get pipelines by status
  const { data: activePipelines, isLoading: loadingActive } = usePipelines({ status: "active" });
  const { data: completedPipelines } = usePipelines({ status: "completed" });
  const { data: finalizedPipelines } = usePipelines({ status: "finalized" });

  // Get selected pipeline details
  const { data: selectedPipeline } = usePipeline(selectedPipelineId || undefined);

  const tabs: { id: PipelineTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "active",
      label: "Active",
      icon: <GitBranch style={{ width: 16, height: 16 }} />,
      count: activePipelines?.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CheckCircle2 style={{ width: 16, height: 16 }} />,
      count: completedPipelines?.length,
    },
    {
      id: "finalized",
      label: "Finalized",
      icon: <BookOpen style={{ width: 16, height: 16 }} />,
      count: finalizedPipelines?.length,
    },
  ];

  const getCurrentPipelines = () => {
    switch (activeTab) {
      case "active":
        return activePipelines || [];
      case "completed":
        return completedPipelines || [];
      case "finalized":
        return finalizedPipelines || [];
      default:
        return [];
    }
  };

  const pipelines = getCurrentPipelines();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#1e1e2e',
            marginBottom: 6,
            margin: 0,
          }}>
            Pipelines
          </h2>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            margin: 0,
          }}>
            Multi-task workflows across departments
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#7c3aed',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#6d28d9';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#7c3aed';
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          New Pipeline
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #e5e5eb',
        paddingBottom: 0,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? '#7c3aed' : '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: -1,
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#4b5563';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: isActive ? '#7c3aed' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(124, 58, 237, 0.1)' : '#f3f4f6',
                  borderRadius: 999,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loadingActive && activeTab === "active" ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
          color: '#9ca3af',
        }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : pipelines.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: '#9ca3af',
        }}>
          <GitBranch style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 16, margin: 0 }}>
            {activeTab === "active"
              ? "No active pipelines. Create one to get started."
              : activeTab === "completed"
              ? "No completed pipelines yet."
              : "No finalized pipelines. Complete a pipeline to finalize it into a guide."}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}>
          {pipelines.map((pipeline) => (
            <PipelineCardWrapper
              key={pipeline.id}
              pipeline={pipeline}
              onClick={() => setSelectedPipelineId(pipeline.id)}
            />
          ))}
        </div>
      )}

      {/* Pipeline Detail Modal */}
      <PipelineDetailModal
        pipeline={selectedPipeline || null}
        isOpen={!!selectedPipelineId}
        onClose={() => setSelectedPipelineId(null)}
        onFinalize={(pipelineId) => {
          setSelectedPipelineId(null);
          setFinalizingPipelineId(pipelineId);
        }}
      />

      {/* Create Pipeline Form Modal */}
      {showForm && (
        <PipelineForm
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Finalize Pipeline Wizard */}
      {finalizingPipelineId && (
        <FinalizePipelineWizard
          pipelineId={finalizingPipelineId}
          onClose={() => setFinalizingPipelineId(null)}
          onSuccess={() => {
            setFinalizingPipelineId(null);
            setActiveTab("finalized");
          }}
        />
      )}
    </div>
  );
}

// Wrapper to fetch task counts for each pipeline
function PipelineCardWrapper({
  pipeline,
  onClick,
}: {
  pipeline: Pipeline & { creator: { display_name: string | null; email: string } | null };
  onClick: () => void;
}) {
  const { data: details } = usePipeline(pipeline.id);

  return (
    <PipelineCard
      pipeline={pipeline}
      taskCount={details?.task_count || 0}
      completedCount={details?.completed_task_count || 0}
      onClick={onClick}
    />
  );
}
