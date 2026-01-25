import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Loader2, MessageSquare, Users } from "lucide-react";
import { useBulletins } from "../hooks/useBulletins";
import { useBulletinMutations } from "../hooks/useBulletinMutations";
import { BulletinNote } from "./BulletinNote";
import { BulletinForm } from "./BulletinForm";
import { useTheme } from "@/stores/themeStore";

export function BulletinView() {
  const theme = useTheme();
  const { data: bulletins = [], isLoading } = useBulletins();
  const { deleteBulletin } = useBulletinMutations();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    // Animate out then delete
    setTimeout(() => {
      deleteBulletin.mutate(id, {
        onSettled: () => setDeletingId(null),
      });
    }, 300);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${theme.colors.warning} 0%, ${theme.colors.primary} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              <Users style={{ width: 20, height: 20, color: theme.colors.textInverse }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.text, margin: 0, transition: 'all 0.3s ease' }}>
              Community Bulletin
            </h2>
          </div>
          <p style={{ fontSize: 14, color: theme.colors.textMuted, margin: '8px 0 0 52px', transition: 'all 0.3s ease' }}>
            Leave messages for the team. Drag notes to the side to remove them.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, ${theme.colors.warning} 0%, ${theme.colors.primary} 100%)`,
            color: theme.colors.textInverse,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${theme.colors.warningBg}`,
            transition: 'all 0.3s ease',
          }}
        >
          <Plus style={{ width: 18, height: 18 }} />
          Post Note
        </motion.button>
      </div>

      {/* Bulletin Board */}
      <div
        style={{
          flex: 1,
          minHeight: 500,
          borderRadius: 16,
          background: theme.isDark
            ? `linear-gradient(135deg, ${theme.colors.card} 0%, ${theme.colors.background} 100%)`
            : `linear-gradient(135deg, ${theme.colors.card} 0%, ${theme.colors.backgroundSecondary} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Cork board texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.03) 0%, transparent 30%),
              radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 20%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Board frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `8px solid ${theme.colors.border}`,
            borderRadius: 16,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }}
        />

        {isLoading ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Loader2 style={{
              width: 32,
              height: 32,
              color: theme.colors.textMuted,
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : bulletins.length === 0 ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: theme.colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              <MessageSquare style={{ width: 28, height: 28, color: theme.colors.textMuted }} />
            </div>
            <p style={{ color: theme.colors.textMuted, opacity: 0.7, fontSize: 14, margin: 0, transition: 'all 0.3s ease' }}>
              No notes yet. Post one to get started!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {bulletins.map((bulletin) => (
              <BulletinNote
                key={bulletin.id}
                bulletin={bulletin}
                onDelete={handleDelete}
                isDeleting={deletingId === bulletin.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Form Modal */}
      <BulletinForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
