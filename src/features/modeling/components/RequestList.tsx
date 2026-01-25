import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { FileQuestion, Loader2 } from "lucide-react";
import { useRequests, type RequestWithCreator } from "../hooks/useRequests";
import { useRequestMutations } from "../hooks/useRequestMutations";
import { RequestCard } from "./RequestCard";
import { RequestDetailModal } from "./RequestDetailModal";
import { useTheme } from "@/stores/themeStore";
import type { ModelRequestStatus } from "@/types/database";

interface RequestListProps {
  status: ModelRequestStatus;
}

export function RequestList({ status }: RequestListProps) {
  const theme = useTheme();
  const { data: requests, isLoading, error } = useRequests({ status });
  const { acceptRequest, denyRequest, deleteRequest } = useRequestMutations();

  const [selectedRequest, setSelectedRequest] = useState<RequestWithCreator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCardClick = (request: RequestWithCreator) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRequest(null), 200);
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptRequest.mutateAsync(id);
      handleCloseModal();
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleDeny = async (id: string, reason: string) => {
    try {
      await denyRequest.mutateAsync({ requestId: id, reason });
      handleCloseModal();
    } catch (err) {
      console.error("Failed to deny request:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    setDeletingId(id);
    try {
      await deleteRequest.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete request:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        color: theme.colors.textMuted,
        transition: 'all 0.3s ease',
      }}>
        <Loader2
          style={{
            width: 32,
            height: 32,
            marginBottom: 16,
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ margin: 0, fontSize: 14, transition: 'all 0.3s ease' }}>Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '32px 24px',
        backgroundColor: theme.colors.errorBg,
        borderRadius: 12,
        border: `1px solid ${theme.colors.error}`,
        color: theme.colors.error,
        textAlign: 'center',
        transition: 'all 0.3s ease',
      }}>
        <p style={{ margin: 0, fontSize: 14, transition: 'all 0.3s ease' }}>
          Failed to load requests. Please try again.
        </p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        color: theme.colors.textMuted,
        transition: 'all 0.3s ease',
      }}>
        <FileQuestion style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.5, transition: 'all 0.3s ease' }} />
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
          {status === "open" ? "No open requests" : "No denied requests"}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: 14, transition: 'all 0.3s ease' }}>
          {status === "open"
            ? "Create a new request to get started"
            : "Denied requests will appear here for 7 days"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        <AnimatePresence mode="popLayout">
          {requests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              index={index}
              onClick={() => handleCardClick(request)}
              onDelete={status === "open" ? handleDelete : undefined}
              isDeleting={deletingId === request.id}
            />
          ))}
        </AnimatePresence>
      </div>

      <RequestDetailModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAccept={status === "open" ? handleAccept : undefined}
        onDeny={status === "open" ? handleDeny : undefined}
        isTransitioning={acceptRequest.isPending || denyRequest.isPending}
      />
    </>
  );
}
