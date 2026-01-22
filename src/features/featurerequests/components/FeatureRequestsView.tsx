import { useState } from "react";
import { FileQuestion, XCircle } from "lucide-react";
import { useFeatureRequests } from "../hooks/useFeatureRequests";
import { useFeatureRequestRealtime } from "../hooks/useFeatureRequestRealtime";
import { FeatureRequestList } from "./FeatureRequestList";
import { FeatureRequestForm } from "./FeatureRequestForm";
import { useTheme } from "@/stores/themeStore";
import type { FeatureRequestStatus } from "@/types/database";

type RequestTab = "open" | "denied";

export function FeatureRequestsView() {
  const [activeTab, setActiveTab] = useState<RequestTab>("open");
  const theme = useTheme();

  // Enable real-time updates
  useFeatureRequestRealtime();

  // Get counts for tabs
  const { data: openRequests } = useFeatureRequests({ status: "open" });
  const { data: deniedRequests } = useFeatureRequests({ status: "denied" });

  const tabs: { id: RequestTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "open",
      label: "Open",
      icon: <FileQuestion style={{ width: 16, height: 16 }} />,
      count: openRequests?.length,
    },
    {
      id: "denied",
      label: "Denied",
      icon: <XCircle style={{ width: 16, height: 16 }} />,
      count: deniedRequests?.length,
    },
  ];

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
            color: theme.colors.text,
            marginBottom: 6,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Feature Requests
          </h2>
          <p style={{
            fontSize: 14,
            color: theme.colors.textMuted,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Great ideas can get lost in the shuffle. This is where they live.
          </p>
        </div>

        <FeatureRequestForm />
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
                  e.currentTarget.style.color = theme.colors.textSecondary;
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
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: isActive ? theme.colors.primaryLight : theme.colors.borderLight,
                  color: isActive ? theme.colors.primary : theme.colors.textMuted,
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
      <FeatureRequestList status={activeTab as FeatureRequestStatus} />
    </div>
  );
}
