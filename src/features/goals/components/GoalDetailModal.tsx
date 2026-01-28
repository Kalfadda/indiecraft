import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, Plus, Trash2, CheckCircle2, AlertCircle, Edit2, Link2, MessageCircle, Send, PlusCircle, Calendar, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GoalWithDetails } from "../hooks/useGoals";
import { useGoalMutations } from "../hooks/useGoalMutations";
import { useGoalDependencies, useTaskDependencyMutations } from "../hooks/useTaskDependencies";
import { useGoalComments } from "../hooks/useGoalComments";
import { useGoalCommentMutations } from "../hooks/useGoalCommentMutations";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { useAssetMutations } from "@/features/assets/hooks/useAssetMutations";
import { useAuthStore } from "@/stores/authStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useTheme } from "@/stores/themeStore";
import { GOAL_STATUSES, ASSET_CATEGORIES, ASSET_PRIORITIES, type Asset, type AssetCategory, type AssetPriority } from "@/types/database";

interface GoalDetailModalProps {
  goal: GoalWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GoalDetailModal({ goal, isOpen, onClose }: GoalDetailModalProps) {
  const theme = useTheme();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddDependency, setShowAddDependency] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [newComment, setNewComment] = useState("");

  // New task creation state
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskBlurb, setNewTaskBlurb] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<AssetCategory | "">("");

  const user = useAuthStore((state) => state.user);
  const setPendingTaskId = useNavigationStore((state) => state.setPendingTaskId);
  const { updateGoal, deleteGoal, removeTaskFromGoal, addTaskToGoal, reorderGoalTasks } = useGoalMutations();
  const { createAsset } = useAssetMutations();
  const { data: dependencies = [] } = useGoalDependencies(goal?.id);
  const { addDependency, removeDependencyById } = useTaskDependencyMutations();

  // Comments
  const { data: comments = [], isLoading: commentsLoading } = useGoalComments(goal?.id);
  const { createComment, deleteComment } = useGoalCommentMutations();

  // Get all tasks for adding to goal
  const { data: allTasks = [] } = useAssets();

  // Drag and drop sensors (must be before any conditional returns)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  if (!goal) return null;

  const status = GOAL_STATUSES[goal.status];
  const priority = goal.priority ? ASSET_PRIORITIES[goal.priority as keyof typeof ASSET_PRIORITIES] : null;
  // Progress is based on completed tasks only
  const progress = goal.task_count > 0
    ? Math.round((goal.completed_task_count / goal.task_count) * 100)
    : 0;

  const tasksInGoal = new Set(goal.tasks.map(t => t.id));
  const availableTasks = allTasks.filter(t => !tasksInGoal.has(t.id));

  const handleSave = () => {
    if (!editName.trim()) return;
    updateGoal.mutate({
      id: goal.id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority || undefined,
      target_date: editTargetDate || undefined,
    });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditName(goal.name);
    setEditDescription(goal.description || "");
    setEditPriority(goal.priority || "");
    setEditTargetDate(goal.target_date || "");
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this goal? Tasks will be moved to your Inbox.")) {
      deleteGoal.mutate(goal.id);
      onClose();
    }
  };

  const handleAddTask = (assetId: string) => {
    addTaskToGoal.mutate({
      goalId: goal.id,
      assetId,
    });
    setShowAddTask(false);
  };

  const handleRemoveTask = (assetId: string) => {
    removeTaskFromGoal.mutate({
      goalId: goal.id,
      assetId,
    });
  };

  const handleAddDependency = (dependentTaskId: string, dependencyTaskId: string) => {
    addDependency.mutate({
      dependentTaskId,
      dependencyTaskId,
      goalId: goal.id,
    });
    setShowAddDependency(null);
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim() || !goal) return;

    try {
      const newAsset = await createAsset.mutateAsync({
        name: newTaskName.trim(),
        blurb: newTaskBlurb.trim(),
        category: newTaskCategory || null,
        goal_id: goal.id,
      });

      // Add the newly created task to this goal
      if (newAsset?.id) {
        addTaskToGoal.mutate({
          goalId: goal.id,
          assetId: newAsset.id,
        });
      }

      // Reset form
      setNewTaskName("");
      setNewTaskBlurb("");
      setNewTaskCategory("");
      setShowCreateTask(false);
      setShowAddTask(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !goal) return;
    createComment.mutate({
      goal_id: goal.id,
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleNavigateToTask = (taskId: string) => {
    setPendingTaskId(taskId);
    onClose();
  };

  const handleDeleteComment = (commentId: string) => {
    if (!goal) return;
    deleteComment.mutate({ commentId, goalId: goal.id });
  };

  // Get dependencies for a specific task
  const getTaskDependencies = (taskId: string) => {
    return dependencies.filter(d => d.dependent_task_id === taskId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = goal.tasks.findIndex(t => t.id === active.id);
    const newIndex = goal.tasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(goal.tasks, oldIndex, newIndex);
    const taskOrders = reordered.map((task, index) => ({
      assetId: task.id,
      orderIndex: index,
    }));

    reorderGoalTasks.mutate({ goalId: goal.id, taskOrders });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              padding: 24,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: 700,
                maxHeight: 'calc(100vh - 48px)',
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: `${status.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Target style={{ width: 18, height: 18, color: status.color }} />
                    </div>
                    {priority && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: `${priority.color}15`,
                        color: priority.color,
                      }}>
                        {priority.label}
                      </span>
                    )}
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
                    {progress === 100 && goal.status === "active" && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: `${theme.colors.success}15`,
                        color: theme.colors.success,
                      }}>
                        All tasks complete!
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: theme.colors.text,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.inputBg,
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border}
                      autoFocus
                    />
                  ) : (
                    <h2 style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: theme.colors.text,
                      margin: 0,
                      transition: 'all 0.3s ease',
                    }}>
                      {goal.name}
                    </h2>
                  )}
                  {goal.target_date && !isEditing && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 8,
                      color: theme.colors.textMuted,
                      fontSize: 13,
                    }}>
                      <Calendar style={{ width: 14, height: 14 }} />
                      Target: {new Date(goal.target_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {!isEditing && goal.status === "active" && (
                    <button
                      onClick={handleStartEdit}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: theme.colors.textMuted,
                        cursor: 'pointer',
                      }}
                      title="Edit goal"
                    >
                      <Edit2 style={{ width: 18, height: 18 }} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: theme.colors.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {/* Description & Edit Fields */}
                {isEditing ? (
                  <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        borderRadius: 10,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.inputBg,
                        color: theme.colors.text,
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                        fontFamily: 'inherit',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border}
                    />
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, marginBottom: 4, display: 'block' }}>
                          Priority
                        </label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: 14,
                            borderRadius: 8,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.inputBg,
                            color: theme.colors.text,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">No priority</option>
                          {Object.entries(ASSET_PRIORITIES).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, marginBottom: 4, display: 'block' }}>
                          Target Date
                        </label>
                        <input
                          type="date"
                          value={editTargetDate}
                          onChange={(e) => setEditTargetDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: 14,
                            borderRadius: 8,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.inputBg,
                            color: theme.colors.text,
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : goal.description ? (
                  <p style={{
                    fontSize: 14,
                    color: theme.colors.textMuted,
                    lineHeight: 1.6,
                    margin: '0 0 20px 0',
                    transition: 'all 0.3s ease',
                  }}>
                    {goal.description}
                  </p>
                ) : null}

                {/* Progress */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
                      Progress (Completed Tasks)
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text, transition: 'all 0.3s ease' }}>
                      {goal.completed_task_count}/{goal.task_count} tasks ({progress}%)
                    </span>
                  </div>
                  <div style={{
                    height: 8,
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderRadius: 999,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      style={{
                        height: '100%',
                        backgroundColor: progress === 100 ? theme.colors.success : theme.colors.primary,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                      transition: 'all 0.3s ease',
                    }}>
                      Tasks in Goal
                    </h3>
                    {goal.status === "active" && (
                      <button
                        onClick={() => setShowAddTask(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.colors.primary,
                          backgroundColor: `${theme.colors.primary}15`,
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus style={{ width: 14, height: 14 }} />
                        Add Task
                      </button>
                    )}
                  </div>

                  {goal.tasks.length === 0 ? (
                    <div style={{
                      padding: 32,
                      textAlign: 'center',
                      color: theme.colors.textMuted,
                      backgroundColor: theme.colors.inputBg,
                      borderRadius: 10,
                      border: `1px dashed ${theme.colors.border}`,
                      transition: 'all 0.3s ease',
                    }}>
                      No tasks yet. Add tasks to build your goal.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={goal.tasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {goal.tasks.map((task, index) => (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              index={index}
                              isLast={index === goal.tasks.length - 1}
                              goalActive={goal.status === "active"}
                              taskDeps={getTaskDependencies(task.id)}
                              showAddDependency={showAddDependency}
                              goalTasks={goal.tasks}
                              theme={theme}
                              onNavigate={handleNavigateToTask}
                              onRemove={handleRemoveTask}
                              onAddDependencyClick={setShowAddDependency}
                              onAddDependency={handleAddDependency}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Add task dropdown */}
                  {showAddTask && !showCreateTask && (
                    <div style={{
                      marginTop: 12,
                      padding: 16,
                      backgroundColor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 10,
                    }}>
                      {/* Create new task button */}
                      <button
                        onClick={() => setShowCreateTask(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.colors.primary,
                          backgroundColor: `${theme.colors.primary}08`,
                          border: `1px dashed ${theme.colors.primary}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          marginBottom: 12,
                        }}
                      >
                        <PlusCircle style={{ width: 16, height: 16 }} />
                        Create New Task
                      </button>

                      <p style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textMuted, margin: '0 0 12px 0' }}>
                        Or select an existing task:
                      </p>
                      {availableTasks.length === 0 ? (
                        <p style={{ fontSize: 13, color: theme.colors.textMuted, margin: 0 }}>
                          All existing tasks are already in this goal.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'auto' }}>
                          {availableTasks.slice(0, 20).map(task => {
                            const category = task.category ? ASSET_CATEGORIES[task.category] : null;
                            return (
                              <button
                                key={task.id}
                                onClick={() => handleAddTask(task.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 12px',
                                  fontSize: 13,
                                  textAlign: 'left',
                                  backgroundColor: theme.colors.inputBg,
                                  border: `1px solid ${theme.colors.border}`,
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  color: theme.colors.text,
                                }}
                              >
                                <span>{task.name}</span>
                                {category && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    fontSize: 10,
                                    backgroundColor: `${category.color}20`,
                                    color: category.color,
                                  }}>
                                    {category.label}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button
                        onClick={() => setShowAddTask(false)}
                        style={{
                          marginTop: 12,
                          padding: '8px 16px',
                          fontSize: 13,
                          color: theme.colors.textMuted,
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Create new task form */}
                  {showAddTask && showCreateTask && (
                    <div style={{
                      marginTop: 12,
                      padding: 16,
                      backgroundColor: theme.colors.card,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 10,
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text, margin: '0 0 16px 0' }}>
                        Create New Task
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Task name */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, display: 'block', marginBottom: 4 }}>
                            Task Name *
                          </label>
                          <input
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            placeholder="Enter task name"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 14,
                              borderRadius: 8,
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.inputBg,
                              color: theme.colors.text,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                            onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border}
                            autoFocus
                          />
                        </div>

                        {/* Task description */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, display: 'block', marginBottom: 4 }}>
                            Description
                          </label>
                          <textarea
                            value={newTaskBlurb}
                            onChange={(e) => setNewTaskBlurb(e.target.value)}
                            placeholder="Enter task description (optional)"
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 14,
                              borderRadius: 8,
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.inputBg,
                              color: theme.colors.text,
                              outline: 'none',
                              boxSizing: 'border-box',
                              resize: 'none',
                              fontFamily: 'inherit',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                            onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border}
                          />
                        </div>

                        {/* Category selector */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textMuted, display: 'block', marginBottom: 4 }}>
                            Category
                          </label>
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value as AssetCategory | "")}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 14,
                              borderRadius: 8,
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.inputBg,
                              color: theme.colors.text,
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="">No category</option>
                            {Object.entries(ASSET_CATEGORIES).map(([key, cat]) => (
                              <option key={key} value={key}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                          onClick={() => {
                            setShowCreateTask(false);
                            setNewTaskName("");
                            setNewTaskBlurb("");
                            setNewTaskCategory("");
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            color: theme.colors.textMuted,
                            backgroundColor: theme.colors.card,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateTask}
                          disabled={!newTaskName.trim() || createAsset.isPending}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: newTaskName.trim() ? '#fff' : theme.colors.textMuted,
                            backgroundColor: newTaskName.trim() ? theme.colors.primary : theme.colors.border,
                            border: 'none',
                            borderRadius: 8,
                            cursor: newTaskName.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {createAsset.isPending ? 'Creating...' : 'Create & Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div style={{ marginTop: 24 }}>
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s ease',
                  }}>
                    <MessageCircle style={{ width: 14, height: 14 }} />
                    Comments ({comments.length})
                  </h3>

                  {/* Comments list */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 16,
                  }}>
                    {commentsLoading ? (
                      <div style={{
                        padding: 16,
                        textAlign: 'center',
                        color: theme.colors.textMuted,
                        fontSize: 14,
                      }}>
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div style={{
                        padding: 20,
                        textAlign: 'center',
                        color: theme.colors.textMuted,
                        fontSize: 14,
                        backgroundColor: theme.colors.inputBg,
                        borderRadius: 10,
                        border: `1px dashed ${theme.colors.border}`,
                      }}>
                        No comments yet. Add one to discuss this goal.
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isOwner = user?.id === comment.created_by;
                        const authorName = comment.author?.display_name || comment.author?.email?.split('@')[0] || 'Unknown';
                        return (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              backgroundColor: theme.colors.inputBg,
                              borderRadius: 10,
                              padding: 14,
                              border: `1px solid ${theme.colors.border}`,
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: 8,
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: theme.colors.primary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}>
                                  {authorName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: theme.colors.text,
                                  }}>
                                    {authorName}
                                  </span>
                                  <span style={{
                                    fontSize: 12,
                                    color: theme.colors.textMuted,
                                    marginLeft: 8,
                                  }}>
                                    {formatCommentDate(comment.created_at)}
                                  </span>
                                </div>
                              </div>
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: theme.colors.textMuted,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.error}15`;
                                    e.currentTarget.style.color = theme.colors.error;
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = theme.colors.textMuted;
                                  }}
                                  title="Delete comment"
                                >
                                  <Trash2 style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                            </div>
                            <p style={{
                              fontSize: 14,
                              color: theme.colors.textMuted,
                              lineHeight: 1.5,
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                            }}>
                              {comment.content}
                            </p>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Add comment form */}
                  <div style={{
                    display: 'flex',
                    gap: 10,
                  }}>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.card,
                        color: theme.colors.text,
                        fontSize: 14,
                        outline: 'none',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || createComment.isPending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.border,
                        color: newComment.trim() ? '#fff' : theme.colors.textMuted,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s ease',
                        gap: 6,
                      }}
                    >
                      <Send style={{ width: 14, height: 14 }} />
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.inputBg,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 500,
                        color: theme.colors.textMuted,
                        backgroundColor: theme.colors.card,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!editName.trim()}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: editName.trim() ? theme.colors.primary : theme.colors.border,
                        border: 'none',
                        borderRadius: 10,
                        cursor: editName.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleDelete}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 500,
                        color: theme.colors.error,
                        backgroundColor: 'transparent',
                        border: `1px solid ${theme.colors.error}50`,
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14, marginRight: 6, display: 'inline' }} />
                      Delete
                    </button>

                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* No manual completion button - goals auto-complete */}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sortable task item for drag-and-drop reordering
interface SortableTaskItemProps {
  task: GoalWithDetails["tasks"][number];
  index: number;
  isLast: boolean;
  goalActive: boolean;
  taskDeps: ReturnType<typeof Array.prototype.filter>;
  showAddDependency: string | null;
  goalTasks: GoalWithDetails["tasks"];
  theme: ReturnType<typeof useTheme>;
  onNavigate: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  onAddDependencyClick: (taskId: string | null) => void;
  onAddDependency: (dependentTaskId: string, dependencyTaskId: string) => void;
}

function SortableTaskItem({
  task,
  index,
  isLast,
  goalActive,
  taskDeps,
  showAddDependency,
  goalTasks,
  theme,
  onNavigate,
  onRemove,
  onAddDependencyClick,
  onAddDependency,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };

  const isCompleted = task.status === "completed";
  const category = task.category ? ASSET_CATEGORIES[task.category] : null;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          backgroundColor: isDragging
            ? theme.colors.backgroundSecondary
            : isCompleted ? `${theme.colors.success}08` : theme.colors.inputBg,
          borderRadius: 10,
          border: `1px solid ${isDragging ? theme.colors.primary : isCompleted ? `${theme.colors.success}30` : theme.colors.border}`,
          transition: isDragging ? 'none' : 'all 0.3s ease',
        }}
      >
        {/* Drag handle */}
        {goalActive && (
          <div
            {...attributes}
            {...listeners}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              color: theme.colors.textMuted,
              flexShrink: 0,
              padding: 2,
              borderRadius: 4,
              touchAction: 'none',
            }}
            title="Drag to reorder"
          >
            <GripVertical style={{ width: 16, height: 16 }} />
          </div>
        )}

        {/* Step number */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: isCompleted ? theme.colors.success : theme.colors.border,
          color: isCompleted ? '#fff' : theme.colors.textMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {isCompleted ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : index + 1}
        </div>

        {/* Task info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onNavigate(task.id)}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: theme.colors.text,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = theme.colors.primary}
              onMouseOut={(e) => e.currentTarget.style.color = theme.colors.text}
            >
              {task.name}
            </button>
            {category && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 500,
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}>
                {category.label}
              </span>
            )}
            <span style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 500,
              backgroundColor: isCompleted ? `${theme.colors.success}15` : theme.colors.backgroundSecondary,
              color: isCompleted ? theme.colors.success : theme.colors.textMuted,
            }}>
              {task.status}
            </span>
          </div>
          {taskDeps.length > 0 && (
            <div style={{
              fontSize: 11,
              color: theme.colors.textMuted,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <AlertCircle style={{ width: 12, height: 12 }} />
              Depends on: {taskDeps.map((d: any) => d.dependency_task?.name).join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        {goalActive && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onAddDependencyClick(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                cursor: 'pointer',
              }}
              title="Add dependency"
            >
              <Link2 style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={() => onRemove(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                cursor: 'pointer',
              }}
              title="Remove from goal"
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}
      </div>

      {/* Dependency selector dropdown */}
      {showAddDependency === task.id && (
        <div style={{
          marginTop: 8,
          padding: 12,
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: '0 0 8px 0' }}>
            Select a task this depends on:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {goalTasks
              .filter(t => t.id !== task.id && !taskDeps.some((d: any) => d.dependency_task_id === t.id))
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => onAddDependency(task.id, t.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    textAlign: 'left',
                    backgroundColor: theme.colors.inputBg,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: theme.colors.text,
                  }}
                >
                  {t.name}
                </button>
              ))}
            <button
              onClick={() => onAddDependencyClick(null)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: theme.colors.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connector line */}
      {!isLast && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 0',
        }}>
          <div style={{
            width: 2,
            height: 16,
            backgroundColor: theme.colors.border,
          }} />
        </div>
      )}
    </div>
  );
}

function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
