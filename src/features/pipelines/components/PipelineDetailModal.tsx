import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, GitBranch, Plus, Trash2, ArrowRight, CheckCircle2, Clock, AlertCircle, BookOpen, Edit2, Link2 } from "lucide-react";
import type { PipelineWithDetails } from "../hooks/usePipelines";
import { usePipelineMutations } from "../hooks/usePipelineMutations";
import { usePipelineDependencies, useTaskDependencyMutations } from "../hooks/useTaskDependencies";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { PIPELINE_STATUSES, ASSET_CATEGORIES, type Asset } from "@/types/database";

interface PipelineDetailModalProps {
  pipeline: PipelineWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onFinalize?: (pipelineId: string) => void;
}

export function PipelineDetailModal({ pipeline, isOpen, onClose, onFinalize }: PipelineDetailModalProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddDependency, setShowAddDependency] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { updatePipeline, deletePipeline, removeTaskFromPipeline, addTaskToPipeline } = usePipelineMutations();
  const { data: dependencies = [] } = usePipelineDependencies(pipeline?.id);
  const { addDependency, removeDependencyById } = useTaskDependencyMutations();

  // Get all tasks for adding to pipeline
  const { data: allTasks = [] } = useAssets();

  if (!pipeline) return null;

  const status = PIPELINE_STATUSES[pipeline.status];
  const progress = pipeline.task_count > 0
    ? Math.round((pipeline.completed_task_count / pipeline.task_count) * 100)
    : 0;

  const tasksInPipeline = new Set(pipeline.tasks.map(t => t.id));
  const availableTasks = allTasks.filter(t => !tasksInPipeline.has(t.id));

  const handleSave = () => {
    if (!editName.trim()) return;
    updatePipeline.mutate({
      id: pipeline.id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditName(pipeline.name);
    setEditDescription(pipeline.description || "");
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this pipeline? This won't delete the tasks, only the pipeline grouping.")) {
      deletePipeline.mutate(pipeline.id);
      onClose();
    }
  };

  const handleMarkCompleted = () => {
    updatePipeline.mutate({
      id: pipeline.id,
      status: "completed",
    });
  };

  const handleAddTask = (assetId: string) => {
    addTaskToPipeline.mutate({
      pipelineId: pipeline.id,
      assetId,
    });
    setShowAddTask(false);
  };

  const handleRemoveTask = (assetId: string) => {
    removeTaskFromPipeline.mutate({
      pipelineId: pipeline.id,
      assetId,
    });
  };

  const handleAddDependency = (dependentTaskId: string, dependencyTaskId: string) => {
    addDependency.mutate({
      dependentTaskId,
      dependencyTaskId,
      pipelineId: pipeline.id,
    });
    setShowAddDependency(null);
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
                      <GitBranch style={{ width: 18, height: 18, color: status.color }} />
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
                      {pipeline.name}
                    </h2>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {!isEditing && pipeline.status === "active" && (
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
                      title="Edit pipeline"
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
                ) : pipeline.description ? (
                  <p style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.6,
                    margin: '0 0 20px 0',
                  }}>
                    {pipeline.description}
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
                      Progress
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e1e2e' }}>
                      {pipeline.completed_task_count}/{pipeline.task_count} tasks ({progress}%)
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
                      Tasks in Pipeline
                    </h3>
                    {pipeline.status === "active" && (
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

                  {pipeline.tasks.length === 0 ? (
                    <div style={{
                      padding: 32,
                      textAlign: 'center',
                      color: '#9ca3af',
                      backgroundColor: '#f9fafb',
                      borderRadius: 10,
                      border: '1px dashed #e5e5eb',
                    }}>
                      No tasks yet. Add tasks to build your pipeline.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pipeline.tasks.map((task, index) => {
                        const taskDeps = getTaskDependencies(task.id);
                        const taskDependents = getTaskDependents(task.id);
                        const isCompleted = task.status === "completed" || task.status === "implemented";
                        const category = task.category ? ASSET_CATEGORIES[task.category] : null;

                        return (
                          <div key={task.id}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.05)' : '#f9fafb',
                                borderRadius: 10,
                                border: `1px solid ${isCompleted ? 'rgba(22, 163, 74, 0.2)' : '#e5e5eb'}`,
                              }}
                            >
                              {/* Step number */}
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: isCompleted ? '#16a34a' : '#e5e5eb',
                                color: isCompleted ? '#fff' : '#6b7280',
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
                              {pipeline.status === "active" && (
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
                                    title="Remove from pipeline"
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
                                  {pipeline.tasks
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
                            {index < pipeline.tasks.length - 1 && (
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
                          All tasks are already in this pipeline.
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
                      {pipeline.status === "active" && progress === 100 && (
                        <button
                          onClick={handleMarkCompleted}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle2 style={{ width: 16, height: 16 }} />
                          Mark Completed
                        </button>
                      )}
                      {pipeline.status === "completed" && onFinalize && (
                        <button
                          onClick={() => onFinalize(pipeline.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: '#16a34a',
                            border: 'none',
                            borderRadius: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <BookOpen style={{ width: 16, height: 16 }} />
                          Finalize as Guide
                        </button>
                      )}
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
