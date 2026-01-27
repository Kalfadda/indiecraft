import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useAuth } from "@/features/auth";
import { useAssets, useAsset } from "../hooks/useAssets";
import { useAssetMutations } from "../hooks/useAssetMutations";
import { useAssetRealtime } from "../hooks/useAssetRealtime";
import { useCommentRealtime } from "../hooks/useCommentRealtime";
import { useNotificationRealtime } from "@/features/notifications/hooks/useNotificationRealtime";
import { useNavigationStore } from "@/stores/navigationStore";
import { useTheme, useThemeStore, THEMES, type ThemeId } from "@/stores/themeStore";
import { AssetList } from "./AssetList";
import { AssetForm } from "./AssetForm";
import { AssetDetailModal } from "./AssetDetailModal";
import { UpdateNotification } from "@/components/UpdateNotification";
import { Compare } from "@/features/tools";
import { ScheduleView } from "@/features/schedule";
import { ModelingView } from "@/features/modeling";
import { FeatureRequestsView } from "@/features/featurerequests";
import { GoalsDashboard, InboxView, useInboxCount } from "@/features/goals";
import { NotificationsView } from "@/features/notifications";
import { BulletinView } from "@/features/bulletin";
import { LibraryView } from "@/features/library";
import { Box, LogOut, Clock, Wifi, Tag, X, ListTodo, Boxes, CircleCheck, CalendarDays, Wrench, ChevronDown, GitCompare, Cpu, Lightbulb, FileQuestion, PlayCircle, Target, Bell, ShieldAlert, Clipboard, Palette, Inbox, LayoutDashboard, Library, Settings } from "lucide-react";
import { SettingsModal } from "@/features/settings";
import { ASSET_CATEGORIES, type AssetCategory, type AssetStatus } from "@/types/database";

type MainView = "goals" | "inbox" | "tasks" | "schedule" | "modelingrequests" | "compare" | "featurerequests" | "bulletin" | "notifications" | "library";
type ToolItem = { id: MainView; label: string; icon: React.ReactNode };
type TechnicalItem = { id: MainView; label: string; icon: React.ReactNode };
type ModelingItem = { id: MainView; label: string; icon: React.ReactNode };
type PlanningItem = { id: MainView; label: string; icon: React.ReactNode; badge?: number };

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const theme = useTheme();
  const { currentTheme, setTheme } = useThemeStore();
  const [mainView, setMainView] = useState<MainView>("goals");
  const { data: inboxCount = 0 } = useInboxCount();
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "latest" | "error">("idle");
  const [newVersion, setNewVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  function handleVersionClick() {
    // Updates disabled in BYOD version
    setUpdateStatus("latest");
    setTimeout(() => setUpdateStatus("idle"), 2000);
  }

  function handleUpdate() {
    // Updates disabled in BYOD version
  }
  const [activeTab, setActiveTab] = useState<AssetStatus>("pending");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [planningExpanded, setPlanningExpanded] = useState(true);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [technicalExpanded, setTechnicalExpanded] = useState(false);
  const [modelingExpanded, setModelingExpanded] = useState(false);

  // Navigation store for cross-component task navigation
  const pendingTaskId = useNavigationStore((state) => state.pendingTaskId);
  const setPendingTaskId = useNavigationStore((state) => state.setPendingTaskId);

  // Fetch the pending task for the navigation modal
  const { data: pendingTask } = useAsset(pendingTaskId || "");
  const {
    markAsInProgress,
    markAsCompleted,
    markAsBlocked,
    moveToPending,
    moveToInProgress,
    unblockAsset,
    updateAsset,
    claimAsset,
    unclaimAsset,
  } = useAssetMutations();

  // Keep the current view when a task navigation is requested (modal will show over current view)
  // No automatic view switch needed since we show a modal overlay

  const handleCloseNavigatedTask = () => {
    setPendingTaskId(null);
  };

  useAssetRealtime();
  useCommentRealtime();
  useNotificationRealtime();

  const toolItems: ToolItem[] = [
    { id: "compare", label: "Compare", icon: <GitCompare style={{ width: 18, height: 18 }} /> },
    { id: "library", label: "Library", icon: <Library style={{ width: 18, height: 18 }} /> },
  ];

  const technicalItems: TechnicalItem[] = [
    { id: "featurerequests", label: "Feature Requests", icon: <Lightbulb style={{ width: 18, height: 18 }} /> },
  ];

  const modelingItems: ModelingItem[] = [
    { id: "modelingrequests", label: "Asset Requests", icon: <FileQuestion style={{ width: 18, height: 18 }} /> },
  ];

  const { data: blockedAssets } = useAssets({ status: "blocked", category: selectedCategory });
  const { data: pendingAssets } = useAssets({ status: "pending", category: selectedCategory });
  const { data: inProgressAssets } = useAssets({ status: "in_progress", category: selectedCategory });
  const { data: completedAssets } = useAssets({ status: "completed", category: selectedCategory });

  const tabs: { id: AssetStatus; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "blocked",
      label: "Blocked",
      icon: <ShieldAlert style={{ width: 16, height: 16 }} />,
      count: blockedAssets?.length,
    },
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
  ];

  const planningItems: PlanningItem[] = [
    { id: "goals", label: "Goals", icon: <Target style={{ width: 18, height: 18 }} /> },
    { id: "inbox", label: "Inbox", icon: <Inbox style={{ width: 18, height: 18 }} />, badge: inboxCount > 0 ? inboxCount : undefined },
    { id: "schedule", label: "Schedule", icon: <CalendarDays style={{ width: 18, height: 18 }} /> },
    { id: "tasks", label: "All Tasks", icon: <ListTodo style={{ width: 18, height: 18 }} /> },
  ];

  const sidebarItems: { id: MainView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "bulletin", label: "Bulletin", icon: <Clipboard style={{ width: 20, height: 20 }} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background, color: theme.colors.text, display: 'flex', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      {/* Update Notification */}
      <UpdateNotification />

      {/* Left Sidebar */}
      <aside style={{
        width: 220,
        minHeight: '100vh',
        backgroundColor: theme.colors.sidebar,
        borderRight: `1px solid ${theme.colors.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: `1px solid ${theme.colors.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'border-color 0.3s ease'
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: theme.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s ease'
          }}>
            <Box style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>IndieCraft</h1>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {/* Planning Dropdown */}
          <div>
            <button
              onClick={() => setPlanningExpanded(!planningExpanded)}
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
                backgroundColor: planningItems.some(t => mainView === t.id) ? theme.colors.sidebarActive : 'transparent',
                color: planningItems.some(t => mainView === t.id) ? theme.colors.sidebarActiveText : theme.colors.sidebarText,
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <LayoutDashboard style={{ width: 20, height: 20 }} />
                Planning
              </div>
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  transition: 'transform 0.2s ease',
                  transform: planningExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Planning Items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: planningExpanded ? '300px' : '0px',
              transition: 'max-height 0.2s ease',
            }}>
              {planningItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMainView(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px 10px 44px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: mainView === item.id ? theme.colors.sidebarActive : 'transparent',
                    color: mainView === item.id ? theme.colors.sidebarActiveText : theme.colors.sidebarTextMuted,
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.icon}
                    {item.label}
                  </div>
                  {item.badge !== undefined && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: theme.colors.accent,
                      color: '#fff',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Other sidebar items (Bulletin) */}
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setMainView(item.id)}
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
                backgroundColor: mainView === item.id ? theme.colors.sidebarActive : 'transparent',
                color: mainView === item.id ? theme.colors.sidebarActiveText : theme.colors.sidebarText,
                marginTop: 4,
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.icon}
                {item.label}
              </div>
              {item.badge !== undefined && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: theme.colors.accent,
                  color: '#fff',
                }}>
                  {item.badge}
                </span>
              )}
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
                backgroundColor: modelingItems.some(t => mainView === t.id) ? theme.colors.sidebarActive : 'transparent',
                color: modelingItems.some(t => mainView === t.id) ? theme.colors.sidebarActiveText : theme.colors.sidebarText,
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Boxes style={{ width: 20, height: 20 }} />
                3D Art
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
                    backgroundColor: mainView === item.id ? theme.colors.sidebarActive : 'transparent',
                    color: mainView === item.id ? theme.colors.sidebarActiveText : theme.colors.sidebarTextMuted,
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => setMainView("notifications")}
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
              backgroundColor: mainView === "notifications" ? 'rgba(251, 146, 60, 0.2)' : 'transparent',
              color: mainView === "notifications" ? '#fb923c' : '#9ca3af',
              marginTop: 8,
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell style={{ width: 20, height: 20 }} />
            Notifications
          </button>

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
          borderTop: `1px solid ${theme.colors.sidebarBorder}`,
          transition: 'border-color 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.colors.successBg,
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            color: theme.colors.success,
            marginBottom: 12,
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <Wifi style={{ width: 12, height: 12 }} />
            <span>Live</span>
          </div>
          <div style={{
            fontSize: 13,
            color: theme.colors.sidebarText,
            marginBottom: 12,
            padding: '0 4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s ease'
          }}>
            {profile?.display_name || profile?.email}
          </div>

          {/* Theme Picker */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <button
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              title="Change Theme"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.sidebarText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                fontSize: 13
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette style={{ width: 16, height: 16 }} />
                <span>Theme</span>
              </div>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: theme.colors.primary,
                transition: 'background-color 0.3s ease'
              }} />
            </button>

            {/* Theme Picker Dropdown */}
            {themePickerOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 8,
                backgroundColor: theme.colors.sidebar,
                border: `1px solid ${theme.colors.sidebarBorder}`,
                borderRadius: 10,
                padding: 8,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                zIndex: 100
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.colors.sidebarTextMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 8px 8px',
                }}>
                  Choose Theme
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.values(THEMES).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as ThemeId);
                        setThemePickerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: currentTheme === t.id ? theme.colors.sidebarActive : 'transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: t.colors.sidebar
                        }} />
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: t.colors.primary
                        }} />
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: t.colors.accent
                        }} />
                      </div>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: currentTheme === t.id ? theme.colors.sidebarActiveText : theme.colors.sidebarText
                      }}>
                        {t.name}
                      </span>
                      {t.isDark && (
                        <span style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: theme.colors.sidebarTextMuted
                        }}>
                          dark
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.sidebarText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings style={{ width: 16, height: 16 }} />
              <span>Settings</span>
            </div>
          </button>

          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.sidebarText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.3s ease',
              fontSize: 13
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            Sign Out
          </button>

          {appVersion && (
            <button
              onClick={updateStatus === "available" ? handleUpdate : handleVersionClick}
              title="Check for updates"
              style={{
                marginTop: 12,
                fontSize: 11,
                color: updateStatus === "available" ? theme.colors.success :
                       updateStatus === "latest" ? theme.colors.success :
                       updateStatus === "error" ? theme.colors.error :
                       updateStatus === "checking" ? theme.colors.accent : theme.colors.sidebarTextMuted,
                textAlign: 'center',
                background: 'none',
                border: 'none',
                cursor: updateStatus === "checking" ? "wait" : "pointer",
                padding: '4px 8px',
                borderRadius: 4,
                width: '100%',
                transition: 'all 0.3s ease'
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
                backgroundColor: theme.colors.tabBg,
                borderRadius: 8,
                padding: 4,
                transition: 'background-color 0.3s ease'
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
                      backgroundColor: activeTab === tab.id ? theme.colors.tabActiveBg : 'transparent',
                      color: activeTab === tab.id ? theme.colors.tabActiveText : theme.colors.textMuted,
                      boxShadow: activeTab === tab.id ? (theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.1)') : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        backgroundColor: activeTab === tab.id ? theme.colors.primaryLight : theme.colors.pillBg,
                        color: activeTab === tab.id ? theme.colors.primary : theme.colors.pillText,
                        transition: 'all 0.3s ease'
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
                color: theme.colors.textMuted,
                marginRight: 4,
                transition: 'color 0.3s ease'
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
                  backgroundColor: selectedCategory === null ? theme.colors.primary : theme.colors.pillBg,
                  color: selectedCategory === null ? theme.colors.textInverse : theme.colors.pillText,
                  transition: 'all 0.3s ease'
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
                    backgroundColor: selectedCategory === key ? `${val.color}20` : theme.colors.pillBg,
                    color: selectedCategory === key ? val.color : theme.colors.pillText,
                    transition: 'all 0.3s ease'
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
                    backgroundColor: theme.colors.pillBg,
                    color: theme.colors.pillText,
                    marginLeft: 4,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>

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

        {mainView === "goals" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            <GoalsDashboard
              onNavigateToInbox={() => setMainView("inbox")}
              onNavigateToTask={(taskId) => setPendingTaskId(taskId)}
            />
          </main>
        )}

        {mainView === "inbox" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            <InboxView
              onNavigateToTask={(taskId) => setPendingTaskId(taskId)}
            />
          </main>
        )}

        {mainView === "bulletin" && (
          <main style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
            <BulletinView />
          </main>
        )}

        {mainView === "notifications" && (
          <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
            <NotificationsView />
          </main>
        )}

        {mainView === "library" && (
          <main style={{ height: 'calc(100vh)', display: 'flex', flexDirection: 'column' }}>
            <LibraryView />
          </main>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Task navigation modal - shows when clicking a task from other views */}
      <AssetDetailModal
        asset={pendingTask || null}
        isOpen={!!pendingTaskId && !!pendingTask}
        onClose={handleCloseNavigatedTask}
        onMarkInProgress={(id) => {
          markAsInProgress.mutate(id);
          handleCloseNavigatedTask();
        }}
        onMarkCompleted={(id) => {
          markAsCompleted.mutate(id);
          handleCloseNavigatedTask();
        }}
        onMarkBlocked={(id, reason) => {
          markAsBlocked.mutate({ id, reason });
          handleCloseNavigatedTask();
        }}
        onMoveToPending={(id) => {
          moveToPending.mutate(id);
          handleCloseNavigatedTask();
        }}
        onMoveToInProgress={(id) => {
          moveToInProgress.mutate(id);
          handleCloseNavigatedTask();
        }}
        onUnblock={(id) => {
          unblockAsset.mutate(id);
          handleCloseNavigatedTask();
        }}
        onUpdate={(id, data) => {
          updateAsset.mutate({ id, ...data });
        }}
        onClaim={(id) => {
          claimAsset.mutate(id);
        }}
        onUnclaim={(id) => {
          unclaimAsset.mutate(id);
        }}
      />
    </div>
  );
}
