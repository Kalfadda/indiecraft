import { useState } from "react";
import { Target, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { useTheme } from "@/stores/themeStore";
import { useGoals, useGoal } from "../hooks/useGoals";
import { GoalCard } from "./GoalCard";
import { GoalDetailModal } from "./GoalDetailModal";
import { GoalForm } from "./GoalForm";
import type { GoalStatus, Goal } from "@/types/database";

type GoalTab = "active" | "completed";

export function GoalsView() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<GoalTab>("active");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Get goals by status
  const { data: activeGoals, isLoading: loadingActive } = useGoals({ status: "active" });
  const { data: completedGoals } = useGoals({ status: "completed" });

  // Get selected goal details
  const { data: selectedGoal } = useGoal(selectedGoalId || undefined);

  const tabs: { id: GoalTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "active",
      label: "Active",
      icon: <Target style={{ width: 16, height: 16 }} />,
      count: activeGoals?.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CheckCircle2 style={{ width: 16, height: 16 }} />,
      count: completedGoals?.length,
    },
  ];

  const getCurrentGoals = () => {
    switch (activeTab) {
      case "active":
        return activeGoals || [];
      case "completed":
        return completedGoals || [];
      default:
        return [];
    }
  };

  const goals = getCurrentGoals();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, transition: 'all 0.3s ease' }}>
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
            color: theme.colors.text,
            marginBottom: 6,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Goals
          </h2>
          <p style={{
            fontSize: 14,
            color: theme.colors.textMuted,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Organize tasks into focused goals
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
            backgroundColor: theme.colors.primary,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          New Goal
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: `1px solid ${theme.colors.border}`,
        paddingBottom: 0,
        transition: 'all 0.3s ease',
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
                color: isActive ? theme.colors.primary : theme.colors.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: -1,
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = theme.colors.text;
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = theme.colors.textMuted;
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
                  color: isActive ? theme.colors.primary : theme.colors.textMuted,
                  backgroundColor: isActive ? `${theme.colors.primary}1a` : theme.colors.card,
                  borderRadius: 999,
                  transition: 'all 0.3s ease',
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
          color: theme.colors.textMuted,
          transition: 'all 0.3s ease',
        }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : goals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: theme.colors.textMuted,
          transition: 'all 0.3s ease',
        }}>
          <Target style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 16, margin: 0 }}>
            {activeTab === "active"
              ? "No active goals. Create one to get started."
              : "No completed goals yet."}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}>
          {goals.map((goal) => (
            <GoalCardWrapper
              key={goal.id}
              goal={goal}
              onClick={() => setSelectedGoalId(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Goal Detail Modal */}
      <GoalDetailModal
        goal={selectedGoal || null}
        isOpen={!!selectedGoalId}
        onClose={() => setSelectedGoalId(null)}
      />

      {/* Create Goal Form Modal */}
      {showForm && (
        <GoalForm
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// Wrapper to fetch task counts for each goal
function GoalCardWrapper({
  goal,
  onClick,
}: {
  goal: Goal & { creator: { display_name: string | null; email: string } | null };
  onClick: () => void;
}) {
  const { data: details } = useGoal(goal.id);

  return (
    <GoalCard
      goal={goal}
      taskCount={details?.task_count || 0}
      completedCount={details?.completed_task_count || 0}
      onClick={onClick}
    />
  );
}
