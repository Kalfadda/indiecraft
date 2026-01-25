import { useState } from "react";
import { useAssets } from "@/features/assets/hooks/useAssets";
import {
  GitCompare,
  ChevronDown,
  TrendingUp,
  Star,
  BarChart3,
} from "lucide-react";
import {
  ASSET_CATEGORIES,
  type AssetCategory,
} from "@/types/database";

interface ComparisonStat {
  label: string;
  categoryA: number;
  categoryB: number;
  categoryC: number | null;
  higherIsBetter: boolean;
}

export function Compare() {
  const [categoryAId, setCategoryAId] = useState<AssetCategory | null>(null);
  const [categoryBId, setCategoryBId] = useState<AssetCategory | null>(null);
  const [categoryCId, setCategoryCId] = useState<AssetCategory | null>(null);
  const [dropdownA, setDropdownA] = useState(false);
  const [dropdownB, setDropdownB] = useState(false);
  const [dropdownC, setDropdownC] = useState(false);

  // Fetch assets for each selected category
  const { data: assetsA } = useAssets({ category: categoryAId });
  const { data: assetsB } = useAssets({ category: categoryBId });
  const { data: assetsC } = useAssets({ category: categoryCId });

  const categoryA = categoryAId ? { id: categoryAId, ...ASSET_CATEGORIES[categoryAId] } : null;
  const categoryB = categoryBId ? { id: categoryBId, ...ASSET_CATEGORIES[categoryBId] } : null;
  const categoryC = categoryCId ? { id: categoryCId, ...ASSET_CATEGORIES[categoryCId] } : null;

  // Calculate stats for a category
  function getCategoryStats(assets: typeof assetsA) {
    if (!assets) return { total: 0, pending: 0, completed: 0, completionRate: 0 };
    const total = assets.length;
    const pending = assets.filter(a => a.status === "pending").length;
    const completed = assets.filter(a => a.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, completed, completionRate };
  }

  const statsA = getCategoryStats(assetsA);
  const statsB = getCategoryStats(assetsB);
  const statsC = getCategoryStats(assetsC);

  const comparisonStats: ComparisonStat[] = [
    {
      label: "Total Tasks",
      categoryA: statsA.total,
      categoryB: statsB.total,
      categoryC: categoryC ? statsC.total : null,
      higherIsBetter: true,
    },
    {
      label: "Pending",
      categoryA: statsA.pending,
      categoryB: statsB.pending,
      categoryC: categoryC ? statsC.pending : null,
      higherIsBetter: false,
    },
    {
      label: "Completed",
      categoryA: statsA.completed,
      categoryB: statsB.completed,
      categoryC: categoryC ? statsC.completed : null,
      higherIsBetter: true,
    },
    {
      label: "Completion Rate",
      categoryA: statsA.completionRate,
      categoryB: statsB.completionRate,
      categoryC: categoryC ? statsC.completionRate : null,
      higherIsBetter: true,
    },
  ];

  function getWinner(stat: ComparisonStat): { name: string; value: number } | null {
    const values = [
      { name: categoryA?.label || "Category A", value: stat.categoryA },
      { name: categoryB?.label || "Category B", value: stat.categoryB },
      ...(categoryC ? [{ name: categoryC.label, value: stat.categoryC ?? 0 }] : []),
    ].filter((v) => v.value !== null && v.value !== undefined) as { name: string; value: number }[];

    if (values.length < 2) return null;
    if (values.every(v => v.value === 0)) return null;

    if (stat.higherIsBetter) {
      return values.reduce((max, v) => (v.value > max.value ? v : max));
    } else {
      const nonZeroValues = values.filter(v => v.value > 0);
      if (nonZeroValues.length === 0) return null;
      return nonZeroValues.reduce((min, v) => (v.value < min.value ? v : min));
    }
  }

  function getBarWidths(
    a: number,
    b: number,
    c: number | null
  ): { widthA: number; widthB: number; widthC: number } {
    const values = [a, b, c ?? 0];
    const total = values.reduce((sum, v) => sum + v, 0);

    if (total === 0) {
      if (c === null) return { widthA: 50, widthB: 50, widthC: 0 };
      return { widthA: 33.33, widthB: 33.33, widthC: 33.33 };
    }

    return {
      widthA: (a / total) * 100,
      widthB: (b / total) * 100,
      widthC: ((c ?? 0) / total) * 100,
    };
  }

  function formatValue(value: number, isPercent: boolean): string {
    if (isPercent) return `${value}%`;
    return value.toLocaleString();
  }

  const availableCategories = Object.entries(ASSET_CATEGORIES).map(([key, val]) => ({
    id: key as AssetCategory,
    ...val,
  }));

  // Not enough categories available
  if (availableCategories.length < 2) {
    return (
      <div style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400
      }}>
        <div style={{ textAlign: 'center' }}>
          <GitCompare style={{ width: 48, height: 48, color: '#9ca3af', margin: '0 auto' }} />
          <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 500, color: '#1e1e2e' }}>
            Not Enough Categories
          </h3>
          <p style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
            Add tasks to at least 2 categories to use the comparison feature
          </p>
        </div>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e5eb',
  };

  const cardStyleWithOverflow: React.CSSProperties = {
    ...cardStyle,
    overflow: 'hidden',
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: '16px 20px 12px',
  };

  const cardContentStyle: React.CSSProperties = {
    padding: '0 20px 20px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Category Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Category A Selector */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#6b7280' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              Category A
            </div>
          </div>
          <div style={cardContentStyle}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setDropdownA(!dropdownA); setDropdownB(false); setDropdownC(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {categoryA ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: categoryA.color }} />
                    <span>{categoryA.label}</span>
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Select a category...</span>
                )}
                <ChevronDown style={{ width: 16, height: 16, color: '#6b7280' }} />
              </button>
              {dropdownA && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  zIndex: 10,
                  marginTop: 4,
                  maxHeight: 256,
                  overflow: 'auto',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {availableCategories
                    .filter((c) => c.id !== categoryBId && c.id !== categoryCId)
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryAId(cat.id); setDropdownA(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 14px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }} />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category B Selector */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#6b7280' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f97316' }} />
              Category B
            </div>
          </div>
          <div style={cardContentStyle}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setDropdownB(!dropdownB); setDropdownA(false); setDropdownC(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {categoryB ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: categoryB.color }} />
                    <span>{categoryB.label}</span>
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Select a category...</span>
                )}
                <ChevronDown style={{ width: 16, height: 16, color: '#6b7280' }} />
              </button>
              {dropdownB && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  zIndex: 10,
                  marginTop: 4,
                  maxHeight: 256,
                  overflow: 'auto',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {availableCategories
                    .filter((c) => c.id !== categoryAId && c.id !== categoryCId)
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryBId(cat.id); setDropdownB(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 14px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }} />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category C Selector (Optional) */}
        <div style={{ ...cardStyle, borderStyle: !categoryC ? 'dashed' : 'solid' }}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#6b7280' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
              Category C <span style={{ fontSize: 12 }}>(Optional)</span>
            </div>
          </div>
          <div style={cardContentStyle}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setDropdownC(!dropdownC); setDropdownA(false); setDropdownB(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {categoryC ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: categoryC.color }} />
                    <span>{categoryC.label}</span>
                  </div>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Add a 3rd category...</span>
                )}
                <ChevronDown style={{ width: 16, height: 16, color: '#6b7280' }} />
              </button>
              {dropdownC && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  zIndex: 10,
                  marginTop: 4,
                  maxHeight: 256,
                  overflow: 'auto',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {categoryC && (
                    <button
                      onClick={() => { setCategoryCId(null); setDropdownC(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                        textAlign: 'left',
                        color: '#6b7280',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Clear selection
                    </button>
                  )}
                  {availableCategories
                    .filter((c) => c.id !== categoryAId && c.id !== categoryBId)
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryCId(cat.id); setDropdownC(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 14px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          fontSize: 14,
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }} />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Stats */}
      {categoryA && categoryB ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: categoryC ? 'repeat(3, 1fr)' : '1fr auto 1fr',
            alignItems: 'center',
            gap: 16,
            padding: '0 16px',
          }}>
            <div style={{ textAlign: categoryC ? 'center' : 'right' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: categoryC ? 'center' : 'flex-end',
              }}>
                {!categoryC && <p style={{ fontWeight: 600, margin: 0 }}>{categoryA.label}</p>}
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }} />
                {categoryC && <p style={{ fontWeight: 600, margin: 0 }}>{categoryA.label}</p>}
              </div>
            </div>
            {!categoryC && (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BarChart3 style={{ width: 20, height: 20, color: '#06b6d4' }} />
              </div>
            )}
            <div style={{ textAlign: categoryC ? 'center' : 'left' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: categoryC ? 'center' : 'flex-start',
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f97316', flexShrink: 0 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>{categoryB.label}</p>
              </div>
            </div>
            {categoryC && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                  <p style={{ fontWeight: 600, margin: 0 }}>{categoryC.label}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {comparisonStats.map((stat) => {
            const winner = getWinner(stat);
            const { widthA, widthB, widthC } = getBarWidths(stat.categoryA, stat.categoryB, stat.categoryC);
            const isPercent = stat.label === "Completion Rate";

            return (
              <div key={stat.label} style={cardStyleWithOverflow}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>{stat.label}</span>
                    {winner && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#06b6d4' }}>
                        <TrendingUp style={{ width: 12, height: 12 }} />
                        {winner.name}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: categoryC ? 'repeat(3, 1fr)' : '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 16,
                  }}>
                    {/* Category A Value */}
                    <div style={{ textAlign: categoryC ? 'center' : 'right' }}>
                      <span style={{ fontSize: 24, fontWeight: 700 }}>
                        {formatValue(stat.categoryA, isPercent)}
                      </span>
                    </div>

                    {/* VS (only show when no Category C) */}
                    {!categoryC && (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>vs</span>
                    )}

                    {/* Category B Value */}
                    <div style={{ textAlign: categoryC ? 'center' : 'left' }}>
                      <span style={{ fontSize: 24, fontWeight: 700 }}>
                        {formatValue(stat.categoryB, isPercent)}
                      </span>
                    </div>

                    {/* Category C Value */}
                    {categoryC && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 700 }}>
                          {formatValue(stat.categoryC ?? 0, isPercent)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Comparison Bar */}
                  <div style={{
                    marginTop: 12,
                    display: 'flex',
                    height: 8,
                    overflow: 'hidden',
                    borderRadius: 999,
                    backgroundColor: '#e5e5eb',
                  }}>
                    <div
                      style={{
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.5s ease',
                        width: `${widthA}%`,
                      }}
                    />
                    <div
                      style={{
                        backgroundColor: '#f97316',
                        transition: 'width 0.5s ease',
                        width: `${widthB}%`,
                      }}
                    />
                    {categoryC && (
                      <div
                        style={{
                          backgroundColor: '#10b981',
                          transition: 'width 0.5s ease',
                          width: `${widthC}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Summary */}
          <div style={cardStyleWithOverflow}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Star style={{ width: 20, height: 20, color: '#06b6d4' }} />
                Summary
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                }}>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Most Active</p>
                  {(() => {
                    const tasks = [
                      { name: categoryA.label, count: statsA.total },
                      { name: categoryB.label, count: statsB.total },
                      ...(categoryC ? [{ name: categoryC.label, count: statsC.total }] : []),
                    ];
                    const winner = tasks.reduce((max, t) => (t.count > max.count ? t : max));
                    return (
                      <>
                        <p style={{ marginTop: 4, fontWeight: 600, margin: '4px 0 0' }}>{winner.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                          {winner.count} total tasks
                        </p>
                      </>
                    );
                  })()}
                </div>
                <div style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                }}>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Best Completion Rate</p>
                  {(() => {
                    const rates = [
                      { name: categoryA.label, rate: statsA.completionRate },
                      { name: categoryB.label, rate: statsB.completionRate },
                      ...(categoryC ? [{ name: categoryC.label, rate: statsC.completionRate }] : []),
                    ];
                    const winner = rates.reduce((max, r) => (r.rate > max.rate ? r : max));
                    return (
                      <>
                        <p style={{ marginTop: 4, fontWeight: 600, margin: '4px 0 0' }}>{winner.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                          {winner.rate}% completion
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={cardStyleWithOverflow}>
          <div style={{
            display: 'flex',
            height: 256,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <GitCompare style={{ width: 40, height: 40, margin: '0 auto', opacity: 0.5 }} />
              <p style={{ marginTop: 12 }}>Select two categories above to compare</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
