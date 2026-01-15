import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useAuth } from "@/features/auth";
import { useAssets } from "../hooks/useAssets";
import { useAssetRealtime } from "../hooks/useAssetRealtime";
import { AssetList } from "./AssetList";
import { AssetForm } from "./AssetForm";
import { UpdateNotification } from "@/components/UpdateNotification";
import { Compare } from "@/features/tools";
import { ScheduleView } from "@/features/schedule";
import { ModelingView } from "@/features/modeling";
import { FeatureRequestsView } from "@/features/featurerequests";
import { Box, LogOut, Settings, Clock, Wifi, Tag, X, ListTodo, Boxes, CircleCheck, Archive, Info, CalendarDays, Wrench, ChevronDown, GitCompare, Cpu, Lightbulb, FileQuestion, PlayCircle } from "lucide-react";
import { ASSET_CATEGORIES, type AssetCategory, type AssetStatus } from "@/types/database";

type MainView = "tasks" | "schedule" | "modelingrequests" | "compare" | "featurerequests";
type ToolItem = { id: MainView; label: string; icon: React.ReactNode };
type TechnicalItem = { id: MainView; label: string; icon: React.ReactNode };
type ModelingItem = { id: MainView; label: string; icon: React.ReactNode };

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [mainView, setMainView] = useState<MainView>("tasks");
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "latest" | "error">("idle");
  const [newVersion, setNewVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  async function handleVersionClick() {
    if (updateStatus === "checking") return;

    setUpdateStatus("checking");
    try {
      const update = await check();
      if (update) {
        setNewVersion(update.version);
        setUpdateStatus("available");
      } else {
        setUpdateStatus("latest");
        setTimeout(() => setUpdateStatus("idle"), 3000);
      }
    } catch {
      setUpdateStatus("error");
      setTimeout(() => setUpdateStatus("idle"), 3000);
    }
  }

  async function handleUpdate() {
    try {
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch {
      setUpdateStatus("error");
    }
  }
  const [activeTab, setActiveTab] = useState<AssetStatus>("pending");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [technicalExpanded, setTechnicalExpanded] = useState(false);
  const [modelingExpanded, setModelingExpanded] = useState(false);

  useAssetRealtime();

  const toolItems: ToolItem[] = [
    { id: "compare", label: "Compare", icon: <GitCompare style={{ width: 18, height: 18 }} /> },
  ];

  const technicalItems: TechnicalItem[] = [
    { id: "featurerequests", label: "Feature Requests", icon: <Lightbulb style={{ width: 18, height: 18 }} /> },
  ];

  const modelingItems: ModelingItem[] = [
    { id: "modelingrequests", label: "Modeling Requests", icon: <FileQuestion style={{ width: 18, height: 18 }} /> },
  ];

  const { data: pendingAssets } = useAssets({ status: "pending", category: selectedCategory });
  const { data: inProgressAssets } = useAssets({ status: "in_progress", category: selectedCategory });
  const { data: completedAssets } = useAssets({ status: "completed", category: selectedCategory });
  const { data: implementedAssets } = useAssets({ status: "implemented", category: selectedCategory });

  const tabs: { id: AssetStatus; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "pending",
      label: "Pending",
      icon: <Clock style={{ width: 16, height: 16 }} />,
      count: pendingAssets?.length,
    },
    {
      id: "in_progress",
      label: "In Progress",
      icon: <PlayCircle style={{ width: 16, height: 16 }} />,
      count: inProgressAssets?.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CircleCheck style={{ width: 16, height: 16 }} />,
      count: completedAssets?.length,
    },
    {
      id: "implemented",
      label: "Implemented",
      icon: <Archive style={{ width: 16, height: 16 }} />,
      count: implementedAssets?.length,
    },
  ];

  const sidebarItems: { id: MainView; label: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", icon: <ListTodo style={{ width: 20, height: 20 }} /> },
    { id: "schedule", label: "Schedule", icon: <CalendarDays style={{ width: 20, height: 20 }} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f7', color: '#1e1e2e', display: 'flex' }}>
      {/* Update Notification */}
      <UpdateNotification />

      {/* Left Sidebar */}
      <aside style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: '#1e1e2e',
        borderRight: '1px solid #2d2d3d',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #2d2d3d',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Scythe Ops</h1>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setMainView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: mainView === item.id ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                color: mainView === item.id ? '#a78bfa' : '#9ca3af',
                marginBottom: 4,
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Technical Dropdown */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setTechnicalExpanded(!technicalExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: technicalItems.some(t => mainView === t.id) ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                color: technicalItems.some(t => mainView === t.id) ? '#4ade80' : '#9ca3af',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Cpu style={{ width: 20, height: 20 }} />
                Technical
              </div>
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  transition: 'transform 0.2s ease',
                  transform: technicalExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Technical Items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: technicalExpanded ? '200px' : '0px',
              transition: 'max-height 0.2s ease',
            }}>
              {technicalItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMainView(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px 10px 44px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: mainView === item.id ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                    color: mainView === item.id ? '#4ade80' : '#6b7280',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modeling Dropdown */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setModelingExpanded(!modelingExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: modelingItems.some(t => mainView === t.id) ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                color: modelingItems.some(t => mainView === t.id) ? '#a78bfa' : '#9ca3af',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Boxes style={{ width: 20, height: 20 }} />
                Modeling
              </div>
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  transition: 'transform 0.2s ease',
                  transform: modelingExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Modeling Items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: modelingExpanded ? '200px' : '0px',
              transition: 'max-height 0.2s ease',
            }}>
              {modelingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMainView(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px 10px 44px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: mainView === item.id ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    color: mainView === item.id ? '#a78bfa' : '#6b7280',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Dropdown */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: toolItems.some(t => mainView === t.id) ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: toolItems.some(t => mainView === t.id) ? '#22d3ee' : '#9ca3af',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Wrench style={{ width: 20, height: 20 }} />
                Tools
              </div>
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  transition: 'transform 0.2s ease',
                  transform: toolsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Tool Items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: toolsExpanded ? '200px' : '0px',
              transition: 'max-height 0.2s ease',
            }}>
              {toolItems.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setMainView(tool.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px 10px 44px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: mainView === tool.id ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: mainView === tool.id ? '#22d3ee' : '#6b7280',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #2d2d3d'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(22, 163, 74, 0.15)',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            color: '#16a34a',
            marginBottom: 12,
            justifyContent: 'center'
          }}>
            <Wifi style={{ width: 12, height: 12 }} />
            <span>Live</span>
          </div>
          <div style={{
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 12,
            padding: '0 4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {profile?.display_name || profile?.email}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => (window.location.href = "/admin")}
              title="Admin Panel"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Settings style={{ width: 18, height: 18 }} />
            </button>
            <button
              onClick={signOut}
              title="Sign Out"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </div>
          {appVersion && (
            <button
              onClick={updateStatus === "available" ? handleUpdate : handleVersionClick}
              title="Check for updates"
              style={{
                marginTop: 12,
                fontSize: 11,
                color: updateStatus === "available" ? "#22c55e" :
                       updateStatus === "latest" ? "#22c55e" :
                       updateStatus === "error" ? "#ef4444" :
                       updateStatus === "checking" ? "#a78bfa" : "#6b7280",
                textAlign: 'center',
                background: 'none',
                border: 'none',
                cursor: updateStatus === "checking" ? "wait" : "pointer",
                padding: '4px 8px',
                borderRadius: 4,
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              {updateStatus === "checking" && "Checking..."}
              {updateStatus === "available" && `Update to v${newVersion}`}
              {updateStatus === "latest" && "Up to date ✓"}
              {updateStatus === "error" && "Check failed"}
              {updateStatus === "idle" && `v${appVersion}`}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ marginLeft: 220, flex: 1 }}>
        {mainView === "tasks" && (
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

            {/* Info box for Implemented tab */}
            {activeTab === "implemented" && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                marginBottom: 24,
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: 10,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                <Info style={{ width: 18, height: 18, color: '#3b82f6', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#3b82f6', lineHeight: 1.5 }}>
                  Implemented tasks are automatically removed after 7 days. Move tasks back to Completed or Pending if you need to keep them longer.
                </p>
              </div>
            )}

            {/* Asset List */}
            <AssetList status={activeTab} category={selectedCategory} />
          </main>
        )}

        {mainView === "schedule" && (
          <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
            <ScheduleView />
          </main>
        )}

        {mainView === "modelingrequests" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            <ModelingView />
          </main>
        )}

        {mainView === "compare" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e1e2e', marginBottom: 4 }}>
                Compare Categories
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280' }}>
                Side-by-side comparison of task categories
              </p>
            </div>
            <Compare />
          </main>
        )}

        {mainView === "featurerequests" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            <FeatureRequestsView />
          </main>
        )}
      </div>
    </div>
  );
}
