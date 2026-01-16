import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Clock, User, Lightbulb, ExternalLink, CheckCircle2 } from "lucide-react";
import { useGuide } from "../hooks/useGuides";
import { ASSET_CATEGORIES, type AssetCategory } from "@/types/database";

interface GuideDetailViewProps {
  guideId: string;
  onClose: () => void;
}

export function GuideDetailView({ guideId, onClose }: GuideDetailViewProps) {
  const { data: guide, isLoading } = useGuide(guideId);

  if (isLoading || !guide) {
    return (
      <AnimatePresence>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#fff', fontSize: 16 }}>Loading...</div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const creatorName = guide.creator?.display_name || guide.creator?.email?.split('@')[0] || "Unknown";
  const content = guide.content;

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
            maxWidth: 800,
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
            padding: '24px 28px',
            borderBottom: '2px solid #D4C4A8',
            backgroundColor: '#EDE6D6',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1 }}>
                {guide.category && (
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: '#8B7355',
                    color: '#F5F1E8',
                    marginBottom: 12,
                  }}>
                    {guide.category}
                  </span>
                )}
                <h2 style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#2C1810',
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.3,
                }}>
                  {guide.title}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 13,
                  color: '#5D4E37',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User style={{ width: 14, height: 14 }} />
                    {creatorName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen style={{ width: 14, height: 14 }} />
                    {content.steps?.length || 0} steps
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock style={{ width: 14, height: 14 }} />
                    {formatDate(guide.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#8B7355',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 28,
          }}>
            {/* Summary */}
            {content.summary && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: '1px solid #D4C4A8',
              }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#8B7355',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px 0',
                }}>
                  Overview
                </h3>
                <p style={{
                  fontSize: 15,
                  color: '#2C1810',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {content.summary}
                </p>
              </div>
            )}

            {/* Steps */}
            {content.steps && content.steps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#8B7355',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0',
                }}>
                  Implementation Steps
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {content.steps.map((step, index) => {
                    const deptCategory = step.department as AssetCategory;
                    const category = ASSET_CATEGORIES[deptCategory];

                    return (
                      <div
                        key={index}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          padding: 20,
                          border: '1px solid #D4C4A8',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 16,
                        }}>
                          {/* Step number */}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#8B7355',
                            color: '#F5F1E8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}>
                            {index + 1}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              marginBottom: 8,
                            }}>
                              <h4 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#2C1810',
                                margin: 0,
                              }}>
                                {step.title}
                              </h4>
                              {category && (
                                <span style={{
                                  padding: '3px 10px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  backgroundColor: `${category.color}20`,
                                  color: category.color,
                                }}>
                                  {category.label}
                                </span>
                              )}
                              {step.estimatedDuration && (
                                <span style={{
                                  fontSize: 12,
                                  color: '#8B7355',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <Clock style={{ width: 12, height: 12 }} />
                                  {step.estimatedDuration}
                                </span>
                              )}
                            </div>
                            <p style={{
                              fontSize: 14,
                              color: '#5D4E37',
                              lineHeight: 1.6,
                              margin: 0,
                            }}>
                              {step.description}
                            </p>

                            {/* Tips */}
                            {step.tips && step.tips.length > 0 && (
                              <div style={{
                                marginTop: 12,
                                padding: 12,
                                backgroundColor: 'rgba(139, 115, 85, 0.08)',
                                borderRadius: 8,
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginBottom: 8,
                                  color: '#8B7355',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}>
                                  <Lightbulb style={{ width: 14, height: 14 }} />
                                  Tips
                                </div>
                                <ul style={{
                                  margin: 0,
                                  paddingLeft: 20,
                                  fontSize: 13,
                                  color: '#5D4E37',
                                }}>
                                  {step.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} style={{ marginBottom: 4 }}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learnings */}
            {content.learnings && content.learnings.length > 0 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: '1px solid #D4C4A8',
              }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#8B7355',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Lightbulb style={{ width: 16, height: 16 }} />
                  Key Learnings
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 14,
                  color: '#2C1810',
                  lineHeight: 1.8,
                }}>
                  {content.learnings.map((learning, index) => (
                    <li key={index}>{learning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {content.resources && content.resources.length > 0 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #D4C4A8',
              }}>
                <h3 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#8B7355',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px 0',
                }}>
                  Resources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {content.resources.map((resource, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        color: resource.url ? '#3b82f6' : '#2C1810',
                      }}
                    >
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: 'inherit',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink style={{ width: 14, height: 14 }} />
                          {resource.title}
                        </a>
                      ) : (
                        <span>{resource.title}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
