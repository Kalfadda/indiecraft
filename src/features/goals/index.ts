// Components
export { GoalsDashboard } from "./components/GoalsDashboard";
export { GoalsView } from "./components/GoalsView";
export { GoalCard } from "./components/GoalCard";
export { GoalDetailModal } from "./components/GoalDetailModal";
export { GoalForm } from "./components/GoalForm";
export { InboxView } from "./components/InboxView";

// Hooks
export { useGoals, useGoal, useGoalsForTask, useInboxCount } from "./hooks/useGoals";
export type { GoalWithCreator, GoalWithDetails, UseGoalsOptions } from "./hooks/useGoals";
export { useGoalMutations } from "./hooks/useGoalMutations";
export { useGoalComments } from "./hooks/useGoalComments";
export type { GoalCommentWithAuthor } from "./hooks/useGoalComments";
export { useGoalCommentMutations } from "./hooks/useGoalCommentMutations";
export {
  useTaskDependencies,
  useTaskDependents,
  useGoalDependencies,
  useCanStartTask,
  useTaskDependencyMutations,
} from "./hooks/useTaskDependencies";
export type { DependencyWithTask } from "./hooks/useTaskDependencies";
