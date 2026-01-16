import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Plus, Trash2, CheckCircle2, AlertCircle, Edit2, Link2, MessageCircle, Send } from "lucide-react";
import type { SprintWithDetails } from "../hooks/useSprints";
import { useSprintMutations } from "../hooks/useSprintMutations";
import { useSprintDependencies, useTaskDependencyMutations } from "../hooks/useTaskDependencies";
import { useSprintComments } from "../hooks/useSprintComments";
import { useSprintCommentMutations } from "../hooks/useSprintCommentMutations";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { useAuthStore } from "@/stores/authStore";
import { SPRINT_STATUSES, ASSET_CATEGORIES, type Asset } from "@/types/database";

interface SprintDetailModalProps {
  sprint: SprintWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SprintDetailModal({ sprint, isOpen, onClose }: SprintDetailModalProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddDependency, setShowAddDependency] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newComment, setNewComment] = useState("");

  const user = useAuthStore((state) => state.user);
  const { updateSprint, deleteSprint, removeTaskFromSprint, addTaskToSprint } = useSprintMutations();
  const { data: dependencies = [] } = useSprintDependencies(sprint?.id);
  const { addDependency, removeDependencyById } = useTaskDependencyMutations();

  // Comments
  const { data: comments = [], isLoading: commentsLoading } = useSprintComments(sprint?.id);
  const { createComment, deleteComment } = useSprintCommentMutations();

  // Get all tasks for adding to sprint
  const { data: allTasks = [] } = useAssets();

  if (!sprint) return null;

  const status = SPRINT_STATUSES[sprint.status];
  // Progress is based on implemented tasks only
  const progress = sprint.task_count > 0
    ? Math.round((sprint.implemented_task_count / sprint.task_count) * 100)
    : 0;

  const tasksInSprint = new Set(sprint.tasks.map(t => t.id));
  const availableTasks = allTasks.filter(t => !tasksInSprint.has(t.id));

  const handleSave = () => {
    if (!editName.trim()) return;
    updateSprint.mutate({
      id: sprint.id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditName(sprint.name);
    setEditDescription(sprint.description || "");
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this sprint? This won't delete the tasks, only the sprint grouping.")) {
      deleteSprint.mutate(sprint.id);
      onClose();
    }
  };

  const handleAddTask = (assetId: string) => {
    addTaskToSprint.mutate({
      sprintId: sprint.id,
      assetId,
    });
    setShowAddTask(false);
  };

  const handleRemoveTask = (assetId: string) => {
    removeTaskFromSprint.mutate({
      sprintId: sprint.id,
      assetId,
    });
  };

  const handleAddDependency = (dependentTaskId: string, dependencyTaskId: string) => {
    addDependency.mutate({
      dependentTaskId,
      dependencyTaskId,
      sprintId: sprint.id,
    });
    setShowAddDependency(null);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !sprint) return;
    createComment.mutate({
      sprint_id: sprint.id,
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!sprint) return;
    deleteComment.mutate({ commentId, sprintId: sprint.id });
  };

  // Get dependencies for a specific task
  const getTaskDependencies = (taskId: string) => {
    return dependencies.filter(d => d.dependent_task_id === taskId);
  };

  // Get what this task blocks
  const getTaskDependents = (taskId: string) => {
    return dependencies.filter(d => d.dependency_task_id === taskId);
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
                backgroundColor: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e5eb',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
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
                      <Zap style={{ width: 18, height: 18, color: status.color }} />
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
                    {progress === 100 && sprint.status === "active" && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        color: '#16a34a',
                      }}>
                        Auto-completing...
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
                        color: '#1e1e2e',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #e5e5eb',
                        backgroundColor: '#f9fafb',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
                      autoFocus
                    />
                  ) : (
                    <h2 style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: '#1e1e2e',
                      margin: 0,
                    }}>
                      {sprint.name}
                    </h2>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {!isEditing && sprint.status === "active" && (
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
                        color: '#9ca3af',
                        cursor: 'pointer',
                      }}
                      title="Edit sprint"
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
                      color: '#9ca3af',
                      cursor: 'pointer',
                    }}
                  >
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {/* Description */}
                {isEditing ? (
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
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#f9fafb',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                      fontFamily: 'inherit',
                      marginBottom: 20,
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
                  />
                ) : sprint.description ? (
                  <p style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.6,
                    margin: '0 0 20px 0',
                  }}>
                    {sprint.description}
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>
                      Progress (Implemented Tasks)
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e1e2e' }}>
                      {sprint.implemented_task_count}/{sprint.task_count} tasks ({progress}%)
                    </span>
                  </div>
                  <div style={{
                    height: 8,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      style={{
                        height: '100%',
                        backgroundColor: progress === 100 ? '#16a34a' : '#7c3aed',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '8px 0 0 0' }}>
                    Sprint auto-completes when all tasks reach "Implemented" status
                  </p>
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
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}>
                      Tasks in Sprint
                    </h3>
                    {sprint.status === "active" && (
                      <button
                        onClick={() => setShowAddTask(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#7c3aed',
                          backgroundColor: 'rgba(124, 58, 237, 0.1)',
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

                  {sprint.tasks.length === 0 ? (
                    <div style={{
                      padding: 32,
                      textAlign: 'center',
                      color: '#9ca3af',
                      backgroundColor: '#f9fafb',
                      borderRadius: 10,
                      border: '1px dashed #e5e5eb',
                    }}>
                      No tasks yet. Add tasks to build your sprint.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sprint.tasks.map((task, index) => {
                        const taskDeps = getTaskDependencies(task.id);
                        const taskDependents = getTaskDependents(task.id);
                        const isImplemented = task.status === "implemented";
                        const isCompleted = task.status === "completed" || isImplemented;
                        const category = task.category ? ASSET_CATEGORIES[task.category] : null;

                        return (
                          <div key={task.id}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: isImplemented ? 'rgba(22, 163, 74, 0.05)' : isCompleted ? 'rgba(59, 130, 246, 0.05)' : '#f9fafb',
                                borderRadius: 10,
                                border: `1px solid ${isImplemented ? 'rgba(22, 163, 74, 0.2)' : isCompleted ? 'rgba(59, 130, 246, 0.2)' : '#e5e5eb'}`,
                              }}
                            >
                              {/* Step number */}
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: isImplemented ? '#16a34a' : isCompleted ? '#3b82f6' : '#e5e5eb',
                                color: isImplemented || isCompleted ? '#fff' : '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}>
                                {isImplemented ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : index + 1}
                              </div>

                              {/* Task info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#1e1e2e',
                                  }}>
                                    {task.name}
                                  </span>
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
                                    backgroundColor: isImplemented ? 'rgba(22, 163, 74, 0.1)' : isCompleted ? 'rgba(59, 130, 246, 0.1)' : '#f3f4f6',
                                    color: isImplemented ? '#16a34a' : isCompleted ? '#3b82f6' : '#6b7280',
                                  }}>
                                    {task.status}
                                  </span>
                                </div>
                                {taskDeps.length > 0 && (
                                  <div style={{
                                    fontSize: 11,
                                    color: '#9ca3af',
                                    marginTop: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}>
                                    <AlertCircle style={{ width: 12, height: 12 }} />
                                    Depends on: {taskDeps.map(d => d.dependency_task?.name).join(', ')}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {sprint.status === "active" && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => setShowAddDependency(task.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 28,
                                      height: 28,
                                      borderRadius: 6,
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                    }}
                                    title="Add dependency"
                                  >
                                    <Link2 style={{ width: 14, height: 14 }} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveTask(task.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 28,
                                      height: 28,
                                      borderRadius: 6,
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                    }}
                                    title="Remove from sprint"
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
                                backgroundColor: '#fff',
                                border: '1px solid #e5e5eb',
                                borderRadius: 8,
                              }}>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px 0' }}>
                                  Select a task this depends on:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {sprint.tasks
                                    .filter(t => t.id !== task.id && !taskDeps.some(d => d.dependency_task_id === t.id))
                                    .map(t => (
                                      <button
                                        key={t.id}
                                        onClick={() => handleAddDependency(task.id, t.id)}
                                        style={{
                                          padding: '8px 12px',
                                          fontSize: 13,
                                          textAlign: 'left',
                                          backgroundColor: '#f9fafb',
                                          border: '1px solid #e5e5eb',
                                          borderRadius: 6,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {t.name}
                                      </button>
                                    ))}
                                  <button
                                    onClick={() => setShowAddDependency(null)}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: 13,
                                      color: '#6b7280',
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
                            {index < sprint.tasks.length - 1 && (
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '4px 0',
                              }}>
                                <div style={{
                                  width: 2,
                                  height: 16,
                                  backgroundColor: '#e5e5eb',
                                }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add task dropdown */}
                  {showAddTask && (
                    <div style={{
                      marginTop: 12,
                      padding: 16,
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5eb',
                      borderRadius: 10,
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#4b5563', margin: '0 0 12px 0' }}>
                        Select a task to add:
                      </p>
                      {availableTasks.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                          All tasks are already in this sprint.
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
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #e5e5eb',
                                  borderRadius: 8,
                                  cursor: 'pointer',
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
                          color: '#6b7280',
                          backgroundColor: 'transparent',
                          border: '1px solid #e5e5eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div style={{ marginTop: 24 }}>
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
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
                        color: '#9ca3af',
                        fontSize: 14,
                      }}>
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div style={{
                        padding: 20,
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: 14,
                        backgroundColor: '#f9fafb',
                        borderRadius: 10,
                        border: '1px dashed #e5e5eb',
                      }}>
                        No comments yet. Add one to discuss this sprint.
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
                              backgroundColor: '#f9fafb',
                              borderRadius: 10,
                              padding: 14,
                              border: '1px solid #e5e5eb',
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
                                  backgroundColor: '#7c3aed',
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
                                    color: '#1e1e2e',
                                  }}>
                                    {authorName}
                                  </span>
                                  <span style={{
                                    fontSize: 12,
                                    color: '#9ca3af',
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
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#9ca3af';
                                  }}
                                  title="Delete comment"
                                >
                                  <Trash2 style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                            </div>
                            <p style={{
                              fontSize: 14,
                              color: '#4b5563',
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
                        border: '1px solid #e5e5eb',
                        backgroundColor: '#fff',
                        fontSize: 14,
                        outline: 'none',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
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
                        backgroundColor: newComment.trim() ? '#7c3aed' : '#e5e5eb',
                        color: newComment.trim() ? '#fff' : '#9ca3af',
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
                borderTop: '1px solid #e5e5eb',
                backgroundColor: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#6b7280',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5eb',
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
                        backgroundColor: editName.trim() ? '#7c3aed' : '#d1d5db',
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
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: '1px solid #fca5a5',
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14, marginRight: 6, display: 'inline' }} />
                      Delete
                    </button>

                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* No manual completion button - sprints auto-complete */}
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
