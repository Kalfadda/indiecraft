import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAssets, type AssetWithCreator } from "../hooks/useAssets";
import { useAssetMutations } from "../hooks/useAssetMutations";
import { AssetCard } from "./AssetCard";
import { AssetDetailModal } from "./AssetDetailModal";
import { Package, Loader2 } from "lucide-react";
import type { AssetCategory, AssetStatus } from "@/types/database";
import { useTheme } from "@/stores/themeStore";

interface AssetListProps {
  status?: AssetStatus;
  category?: AssetCategory | null;
}

export function AssetList({ status, category }: AssetListProps) {
  const { data: assets, isLoading, error } = useAssets({ status, category });
  const { markAsInProgress, markAsCompleted, markAsBlocked, moveToPending, moveToInProgress, unblockAsset, deleteAsset, updateAsset, claimAsset, unclaimAsset, checkLinkedEvent } = useAssetMutations();
  const [selectedAsset, setSelectedAsset] = useState<AssetWithCreator | null>(null);
  const theme = useTheme();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 0',
        transition: 'all 0.3s ease'
      }}>
        <Loader2 style={{
          width: 32,
          height: 32,
          color: theme.colors.primary,
          animation: 'spin 1s linear infinite',
          transition: 'all 0.3s ease'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        borderRadius: 12,
        backgroundColor: theme.colors.errorBg,
        border: `1px solid ${theme.colors.error}`,
        padding: 24,
        textAlign: 'center',
        color: theme.colors.error,
        transition: 'all 0.3s ease'
      }}>
        Failed to load assets. Please try again.
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 0',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{
          marginBottom: 16,
          display: 'flex',
          width: 80,
          height: 80,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: theme.colors.pillBg,
          transition: 'all 0.3s ease'
        }}>
          <Package style={{ width: 40, height: 40, color: theme.colors.textMuted, transition: 'all 0.3s ease' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: theme.colors.text, marginBottom: 8, marginTop: 0, transition: 'all 0.3s ease' }}>
          No tasks found
        </h3>
        <p style={{ fontSize: 14, color: theme.colors.textMuted, maxWidth: 320, margin: 0, transition: 'all 0.3s ease' }}>
          {status === "blocked"
            ? "No blocked tasks. Tasks here are waiting on dependencies or blockers."
            : status === "pending"
            ? "No pending tasks. Create a new task to get started!"
            : status === "in_progress"
            ? "No tasks in progress. Start working on a task to see it here!"
            : status === "completed"
            ? "No completed tasks. Mark tasks as complete when work is done!"
            : "No tasks have been created yet."}
        </p>
      </motion.div>
    );
  }

  const handleMarkInProgress = (id: string) => {
    markAsInProgress.mutate(id, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleMarkCompleted = (id: string) => {
    markAsCompleted.mutate(id, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleMoveToPending = (id: string) => {
    moveToPending.mutate(id, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleMoveToInProgress = (id: string) => {
    moveToInProgress.mutate(id, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleMarkBlocked = (id: string, reason: string) => {
    markAsBlocked.mutate({ id, reason }, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleUnblock = (id: string) => {
    unblockAsset.mutate(id, {
      onSuccess: () => setSelectedAsset(null)
    });
  };

  const handleUpdate = (id: string, data: { name: string; blurb: string; category: any; priority: any; eta_date: string | null }) => {
    updateAsset.mutate({ id, ...data }, {
      onSuccess: (updatedAsset) => {
        // Update the selected asset with new data to reflect changes immediately
        if (selectedAsset && selectedAsset.id === id) {
          setSelectedAsset({ ...selectedAsset, ...updatedAsset });
        }
      }
    });
  };

  const handleClaim = (id: string) => {
    claimAsset.mutate(id, {
      onSuccess: (updatedAsset) => {
        if (selectedAsset && selectedAsset.id === id) {
          // Re-fetch to get claimer info
          setSelectedAsset({ ...selectedAsset, ...updatedAsset });
        }
      }
    });
  };

  const handleUnclaim = (id: string) => {
    unclaimAsset.mutate(id, {
      onSuccess: (updatedAsset) => {
        if (selectedAsset && selectedAsset.id === id) {
          setSelectedAsset({ ...selectedAsset, ...updatedAsset, claimer: null });
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    // Check if asset has a linked event
    const linkedEvent = await checkLinkedEvent(id);

    if (linkedEvent) {
      const confirmDelete = confirm(
        `⚠️ This task has a linked ${linkedEvent.type} "${linkedEvent.title}" on the schedule.\n\n` +
        `Deleting this task will also delete the linked event.\n\n` +
        `Are you sure you want to delete both?`
      );

      if (confirmDelete) {
        deleteAsset.mutate(id);
      }
    } else {
      if (confirm("Are you sure you want to delete this task?")) {
        deleteAsset.mutate(id);
      }
    }
  };

  const isLoading_ = markAsInProgress.isPending || markAsCompleted.isPending || markAsBlocked.isPending || moveToPending.isPending || moveToInProgress.isPending || unblockAsset.isPending || updateAsset.isPending || claimAsset.isPending || unclaimAsset.isPending;

  return (
    <>
      <div style={{
        display: 'grid',
        gap: 20,
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
      }}>
        <AnimatePresence mode="popLayout">
          {assets.map((asset, index) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              index={index}
              onClick={() => setSelectedAsset(asset)}
              onDelete={handleDelete}
              isDeleting={deleteAsset.isPending}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onMarkInProgress={status === "pending" ? handleMarkInProgress : undefined}
        onMarkCompleted={status === "in_progress" ? handleMarkCompleted : undefined}
        onMarkBlocked={(status === "pending" || status === "in_progress") ? handleMarkBlocked : undefined}
        onMoveToPending={(status === "in_progress" || status === "completed") ? handleMoveToPending : undefined}
        onMoveToInProgress={status === "completed" ? handleMoveToInProgress : undefined}
        onUnblock={status === "blocked" ? handleUnblock : undefined}
        onUpdate={handleUpdate}
        onClaim={handleClaim}
        onUnclaim={handleUnclaim}
        isTransitioning={isLoading_}
      />
    </>
  );
}
