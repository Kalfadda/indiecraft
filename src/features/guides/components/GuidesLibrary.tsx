import { useState } from "react";
import { BookOpen, Search, Filter, Loader2 } from "lucide-react";
import { useGuides, useGuideCategories } from "../hooks/useGuides";
import { GuideCard } from "./GuideCard";
import { GuideDetailView } from "./GuideDetailView";

export function GuidesLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  const { data: guides = [], isLoading } = useGuides({
    category: selectedCategory,
    searchQuery: searchQuery || undefined,
  });
  const { data: categories = [] } = useGuideCategories();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with library theme */}
      <div style={{
        background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DFD0 100%)',
        borderRadius: 16,
        padding: 32,
        border: '1px solid #D4C4A8',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#8B7355',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BookOpen style={{ width: 24, height: 24, color: '#F5F1E8' }} />
              </div>
              <h2 style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#2C1810',
                margin: 0,
                fontFamily: 'Georgia, serif',
              }}>
                Knowledge Library
              </h2>
            </div>
            <p style={{
              fontSize: 14,
              color: '#5D4E37',
              margin: 0,
              marginLeft: 60,
            }}>
              Step-by-step guides from completed pipelines
            </p>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: '10px 16px',
            border: '1px solid #D4C4A8',
            minWidth: 280,
          }}>
            <Search style={{ width: 18, height: 18, color: '#8B7355' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                backgroundColor: 'transparent',
                color: '#2C1810',
              }}
            />
          </div>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 20,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setSelectedCategory(undefined)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: !selectedCategory ? '#F5F1E8' : '#5D4E37',
                backgroundColor: !selectedCategory ? '#8B7355' : 'transparent',
                border: `1px solid ${!selectedCategory ? '#8B7355' : '#D4C4A8'}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Guides
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: selectedCategory === category ? '#F5F1E8' : '#5D4E37',
                  backgroundColor: selectedCategory === category ? '#8B7355' : 'transparent',
                  border: `1px solid ${selectedCategory === category ? '#8B7355' : '#D4C4A8'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize',
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 64,
          color: '#8B7355',
        }}>
          <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : guides.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 64,
          backgroundColor: '#F5F1E8',
          borderRadius: 16,
          border: '1px dashed #D4C4A8',
        }}>
          <BookOpen style={{ width: 56, height: 56, color: '#D4C4A8', marginBottom: 16 }} />
          <p style={{
            fontSize: 16,
            color: '#8B7355',
            margin: 0,
            fontFamily: 'Georgia, serif',
          }}>
            {searchQuery
              ? "No guides match your search."
              : "The library is empty. Complete a pipeline to create your first guide."}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {guides.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              onClick={() => setSelectedGuideId(guide.id)}
            />
          ))}
        </div>
      )}

      {/* Guide Detail Modal */}
      {selectedGuideId && (
        <GuideDetailView
          guideId={selectedGuideId}
          onClose={() => setSelectedGuideId(null)}
        />
      )}
    </div>
  );
}
