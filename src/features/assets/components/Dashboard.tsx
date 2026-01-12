import { useState } from "react";
import { useAuth } from "@/features/auth";
import { useAssets } from "../hooks/useAssets";
import { useAssetRealtime } from "../hooks/useAssetRealtime";
import { AssetList } from "./AssetList";
import { AssetForm } from "./AssetForm";
import { UpdateNotification } from "@/components/UpdateNotification";
import { Box, LogOut, Settings, Clock, CheckCircle2, Wifi, Tag, X } from "lucide-react";
import { ASSET_CATEGORIES, type AssetCategory } from "@/types/database";

type Tab = "pending" | "implemented";

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);

  useAssetRealtime();

  const { data: pendingAssets } = useAssets({ status: "pending", category: selectedCategory });
  const { data: implementedAssets } = useAssets({ status: "implemented", category: selectedCategory });

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "pending",
      label: "Pending",
      icon: <Clock style={{ width: 16, height: 16 }} />,
      count: pendingAssets?.length,
    },
    {
      id: "implemented",
      label: "Implemented",
      icon: <CheckCircle2 style={{ width: 16, height: 16 }} />,
      count: implementedAssets?.length,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f7', color: '#1e1e2e' }}>
      {/* Update Notification */}
      <UpdateNotification />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #e5e5eb',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          maxWidth: 1152,
          margin: '0 auto',
          display: 'flex',
          height: 64,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e1e2e' }}>Scythe Ops</h1>
            <div style={{
              marginLeft: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(22, 163, 74, 0.15)',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              color: '#16a34a'
            }}>
              <Wifi style={{ width: 12, height: 12 }} />
              <span>Live</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {profile?.display_name || profile?.email}
            </span>
            <button
              onClick={() => (window.location.href = "/admin")}
              title="Admin Panel"
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <Settings style={{ width: 20, height: 20 }} />
            </button>
            <button
              onClick={signOut}
              title="Sign Out"
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <LogOut style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
        {/* Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
          gap: 24,
          flexWrap: 'wrap'
        }}>
          <AssetForm />

          {/* Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: '#e8e8ed',
            borderRadius: 8,
            padding: 4
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                  color: activeTab === tab.id ? '#1e1e2e' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    backgroundColor: activeTab === tab.id ? 'rgba(124, 58, 237, 0.15)' : 'rgba(0,0,0,0.08)',
                    color: activeTab === tab.id ? '#7c3aed' : '#6b7280'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#6b7280',
            marginRight: 4
          }}>
            <Tag style={{ width: 14, height: 14 }} />
            Filter:
          </div>

          {/* All button */}
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: selectedCategory === null ? '#7c3aed' : '#e8e8ed',
              color: selectedCategory === null ? '#fff' : '#6b7280',
              transition: 'all 0.15s ease'
            }}
          >
            All
          </button>

          {/* Category buttons */}
          {Object.entries(ASSET_CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as AssetCategory)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: selectedCategory === key ? `${val.color}20` : '#e8e8ed',
                color: selectedCategory === key ? val.color : '#6b7280',
                transition: 'all 0.15s ease'
              }}
            >
              {val.label}
            </button>
          ))}

          {/* Clear filter */}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              title="Clear filter"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'rgba(107, 114, 128, 0.15)',
                color: '#6b7280',
                marginLeft: 4,
                transition: 'all 0.15s ease'
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Asset List */}
        <AssetList status={activeTab} category={selectedCategory} />
      </main>
    </div>
  );
}
