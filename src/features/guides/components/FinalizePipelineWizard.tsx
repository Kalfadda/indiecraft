import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, ChevronRight, ChevronLeft, Plus, Trash2, Check } from "lucide-react";
import { usePipeline } from "@/features/pipelines/hooks/usePipelines";
import { useGuideMutations } from "../hooks/useGuideMutations";
import { ASSET_CATEGORIES, type GuideStep, type GuideContent } from "@/types/database";

interface FinalizePipelineWizardProps {
  pipelineId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type WizardStep = "review" | "steps" | "summary" | "preview";

export function FinalizePipelineWizard({ pipelineId, onClose, onSuccess }: FinalizePipelineWizardProps) {
  const { data: pipeline } = usePipeline(pipelineId);
  const { createGuide } = useGuideMutations();

  const [currentStep, setCurrentStep] = useState<WizardStep>("review");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [learnings, setLearnings] = useState<string[]>([""]);
  const [newLearning, setNewLearning] = useState("");

  // Initialize guide steps from pipeline tasks
  useState(() => {
    if (pipeline?.tasks && guideSteps.length === 0) {
      const initialSteps = pipeline.tasks.map((task, index) => ({
        order: index + 1,
        title: task.name,
        description: task.blurb || "",
        department: task.category || "other",
        tips: [],
        originalTaskId: task.id,
      }));
      setGuideSteps(initialSteps);
      setTitle(pipeline.name);
      setDescription(pipeline.description || "");
    }
  });

  // Update steps when pipeline loads
  if (pipeline?.tasks && guideSteps.length === 0) {
    const initialSteps = pipeline.tasks.map((task, index) => ({
      order: index + 1,
      title: task.name,
      description: task.blurb || "",
      department: task.category || "other",
      tips: [],
      originalTaskId: task.id,
    }));
    setGuideSteps(initialSteps);
    setTitle(pipeline.name);
    setDescription(pipeline.description || "");
  }

  const steps: { id: WizardStep; label: string }[] = [
    { id: "review", label: "Review Tasks" },
    { id: "steps", label: "Edit Steps" },
    { id: "summary", label: "Add Details" },
    { id: "preview", label: "Preview" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleUpdateStep = (index: number, updates: Partial<GuideStep>) => {
    setGuideSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, ...updates } : step
    ));
  };

  const handleAddTip = (stepIndex: number, tip: string) => {
    if (!tip.trim()) return;
    setGuideSteps(prev => prev.map((step, i) =>
      i === stepIndex ? { ...step, tips: [...(step.tips || []), tip.trim()] } : step
    ));
  };

  const handleRemoveTip = (stepIndex: number, tipIndex: number) => {
    setGuideSteps(prev => prev.map((step, i) =>
      i === stepIndex ? { ...step, tips: step.tips?.filter((_, ti) => ti !== tipIndex) } : step
    ));
  };

  const handleAddLearning = () => {
    if (!newLearning.trim()) return;
    setLearnings(prev => [...prev.filter(l => l.trim()), newLearning.trim()]);
    setNewLearning("");
  };

  const handleRemoveLearning = (index: number) => {
    setLearnings(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalize = () => {
    const content: GuideContent = {
      summary: summary.trim(),
      steps: guideSteps,
      learnings: learnings.filter(l => l.trim()),
      resources: [],
      contributors: pipeline?.tasks.map(t => t.creator?.display_name || t.creator?.email || "").filter(Boolean) as string[] || [],
    };

    createGuide.mutate(
      {
        pipelineId,
        title: title.trim(),
        description: description.trim() || undefined,
        content,
        category: category.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  if (!pipeline) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(44, 24, 16, 0.7)',
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
            backgroundColor: '#F5F1E8',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            border: '4px solid #8B7355',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '2px solid #D4C4A8',
            backgroundColor: '#EDE6D6',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: '#8B7355',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BookOpen style={{ width: 20, height: 20, color: '#F5F1E8' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#2C1810',
                    margin: 0,
                    fontFamily: 'Georgia, serif',
                  }}>
                    Finalize Pipeline
                  </h2>
                  <p style={{
                    fontSize: 13,
                    color: '#5D4E37',
                    margin: 0,
                  }}>
                    Create a guide from "{pipeline.name}"
                  </p>
                </div>
              </div>
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
                  color: '#8B7355',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Progress steps */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
            }}>
              {steps.map((step, index) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: currentStepIndex >= index ? '#8B7355' : 'transparent',
                    color: currentStepIndex >= index ? '#F5F1E8' : '#8B7355',
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: currentStepIndex > index ? '#F5F1E8' : 'transparent',
                      border: currentStepIndex >= index ? 'none' : '1px solid #8B7355',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: currentStepIndex > index ? '#8B7355' : 'inherit',
                    }}>
                      {currentStepIndex > index ? <Check style={{ width: 12, height: 12 }} /> : index + 1}
                    </span>
                    {step.label}
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight style={{ width: 16, height: 16, color: '#D4C4A8', margin: '0 4px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {currentStep === "review" && (
              <div>
                <p style={{ fontSize: 14, color: '#5D4E37', marginBottom: 20 }}>
                  Review the tasks that will be included in your guide. These will become the implementation steps.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pipeline.tasks.map((task, index) => {
                    const category = task.category ? ASSET_CATEGORIES[task.category] : null;
                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          backgroundColor: '#fff',
                          borderRadius: 10,
                          border: '1px solid #D4C4A8',
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#8B7355',
                          color: '#F5F1E8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>
                            {task.name}
                          </span>
                        </div>
                        {category && (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                          }}>
                            {category.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === "steps" && (
              <div>
                <p style={{ fontSize: 14, color: '#5D4E37', marginBottom: 20 }}>
                  Edit each step and add tips or clarifications.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {guideSteps.map((step, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 20,
                        border: '1px solid #D4C4A8',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#8B7355',
                          color: '#F5F1E8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStep(index, { title: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: 14,
                            fontWeight: 500,
                            borderRadius: 8,
                            border: '1px solid #D4C4A8',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <textarea
                        value={step.description}
                        onChange={(e) => handleUpdateStep(index, { description: e.target.value })}
                        placeholder="Add a description for this step..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: 13,
                          borderRadius: 8,
                          border: '1px solid #D4C4A8',
                          outline: 'none',
                          resize: 'none',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Tips */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#5D4E37', marginBottom: 8 }}>
                          Tips (optional)
                        </div>
                        {step.tips?.map((tip, tipIndex) => (
                          <div key={tipIndex} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                          }}>
                            <span style={{ fontSize: 13, color: '#5D4E37', flex: 1 }}>
                              - {tip}
                            </span>
                            <button
                              onClick={() => handleRemoveTip(index, tipIndex)}
                              style={{
                                padding: 4,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Add a tip..."
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              fontSize: 12,
                              borderRadius: 6,
                              border: '1px solid #D4C4A8',
                              outline: 'none',
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTip(index, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "summary" && (
              <div>
                <p style={{ fontSize: 14, color: '#5D4E37', marginBottom: 20 }}>
                  Add a summary and key learnings for your guide.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5D4E37', marginBottom: 8 }}>
                    Guide Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      borderRadius: 10,
                      border: '1px solid #D4C4A8',
                      backgroundColor: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5D4E37', marginBottom: 8 }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Animation, Character Design, etc."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      borderRadius: 10,
                      border: '1px solid #D4C4A8',
                      backgroundColor: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5D4E37', marginBottom: 8 }}>
                    Overview Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Describe what this guide covers and when to use it..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      borderRadius: 10,
                      border: '1px solid #D4C4A8',
                      backgroundColor: '#fff',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#5D4E37', marginBottom: 8 }}>
                    Key Learnings
                  </label>
                  {learnings.filter(l => l.trim()).map((learning, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                      padding: '8px 12px',
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      border: '1px solid #D4C4A8',
                    }}>
                      <span style={{ flex: 1, fontSize: 13, color: '#2C1810' }}>{learning}</span>
                      <button
                        onClick={() => handleRemoveLearning(index)}
                        style={{
                          padding: 4,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#9ca3af',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={newLearning}
                      onChange={(e) => setNewLearning(e.target.value)}
                      placeholder="Add a key learning..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        fontSize: 13,
                        borderRadius: 8,
                        border: '1px solid #D4C4A8',
                        backgroundColor: '#fff',
                        outline: 'none',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddLearning();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddLearning}
                      style={{
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#F5F1E8',
                        backgroundColor: '#8B7355',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus style={{ width: 14, height: 14 }} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "preview" && (
              <div>
                <p style={{ fontSize: 14, color: '#5D4E37', marginBottom: 20 }}>
                  Preview your guide before publishing to the library.
                </p>

                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #D4C4A8',
                }}>
                  {category && (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: '#8B7355',
                      color: '#F5F1E8',
                      marginBottom: 12,
                    }}>
                      {category}
                    </span>
                  )}
                  <h3 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2C1810',
                    margin: '0 0 8px 0',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {title || pipeline.name}
                  </h3>
                  {summary && (
                    <p style={{ fontSize: 14, color: '#5D4E37', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                      {summary}
                    </p>
                  )}
                  <div style={{
                    fontSize: 13,
                    color: '#8B7355',
                    fontWeight: 500,
                  }}>
                    {guideSteps.length} steps - {learnings.filter(l => l.trim()).length} key learnings
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '2px solid #D4C4A8',
            backgroundColor: '#EDE6D6',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <button
              onClick={currentStepIndex === 0 ? onClose : handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#5D4E37',
                backgroundColor: 'transparent',
                border: '1px solid #D4C4A8',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </button>

            {currentStep === "preview" ? (
              <button
                onClick={handleFinalize}
                disabled={createGuide.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#F5F1E8',
                  backgroundColor: '#16a34a',
                  border: 'none',
                  borderRadius: 10,
                  cursor: createGuide.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                <BookOpen style={{ width: 16, height: 16 }} />
                {createGuide.isPending ? 'Publishing...' : 'Publish to Library'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#F5F1E8',
                  backgroundColor: '#8B7355',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              >
                Next
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
