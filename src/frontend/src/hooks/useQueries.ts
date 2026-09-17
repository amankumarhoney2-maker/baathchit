import {
  type Comment as BackendComment,
  type Reel as BackendReel,
  type Status as BackendStatus,
  createActor,
} from "@/backend";
import { resolveReelVideoUrl } from "@/lib/reel-video";
import type { ChatConversation, ChatMessage, Reel, Status } from "@/lib/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const CHAT_REFRESH_INTERVAL = 5000;
const CONVERSATIONS_REFRESH_INTERVAL = 10_000;
const CHAT_STALE_TIME = 3000;
const CONVERSATIONS_STALE_TIME = 8000;

export interface AuthProfile {
  username: string;
  password: string;
  createdAt: bigint;
}

function formatUploader(principal: { toText(): string }): string {
  const text = principal.toText();
  return `@${text.slice(0, 8)}`;
}

function mapStatus(status: BackendStatus): Status {
  return {
    id: status.id.toString(),
    author: formatUploader(status.author),
    authorPrincipal: status.author.toText(),
    text: status.text,
    imageUrl: status.image ? resolveReelVideoUrl(status.image) : null,
    createdAt: status.createdAt,
  };
}

function mapReel(reel: BackendReel): Reel {
  return {
    id: reel.id.toString(),
    uploader: formatUploader(reel.uploader),
    uploaderPrincipal: reel.uploader.toText(),
    caption: reel.caption,
    videoUrl: resolveReelVideoUrl(reel.video),
    likes: Number(reel.likeCount),
    comments: Number(reel.commentCount),
    saves: Number(reel.saveCount),
    shares: 0,
    likedByMe: false,
    savedByMe: false,
  };
}

export function useListReels() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      if (!actor) return [];
      const [reels, saved, liked] = await Promise.all([
        actor.listReels(),
        actor.listSavedReels(),
        actor.listLikedReels(),
      ]);
      const savedIds = new Set(saved.map((s) => s.reelId.toString()));
      const likedIds = new Set(liked.map((id) => id.toString()));
      return reels.map((reel) => ({
        ...mapReel(reel),
        likedByMe: likedIds.has(reel.id.toString()),
        savedByMe: savedIds.has(reel.id.toString()),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useListSavedReels() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["savedReels"],
    queryFn: async () => {
      if (!actor) return [];
      const saved = await actor.listSavedReels();
      return saved.map((s) => s.reelId.toString());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLikeReel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.likeReel(BigInt(reelId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useUnlikeReel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.unlikeReel(BigInt(reelId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useSaveReel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.saveReel(BigInt(reelId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
      void queryClient.invalidateQueries({ queryKey: ["savedReels"] });
    },
  });
}

export function useUnsaveReel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.unsaveReel(BigInt(reelId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
      void queryClient.invalidateQueries({ queryKey: ["savedReels"] });
    },
  });
}

export function useListComments(reelId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["comments", reelId],
    queryFn: async () => {
      if (!actor) return [];
      const comments = await actor.listComments(BigInt(reelId));
      return comments.map((c) => ({
        id: c.id.toString(),
        author: formatUploader(c.author),
        authorPrincipal: c.author.toText(),
        body: c.body,
        createdAt: c.createdAt,
      }));
    },
    enabled: !!actor && !isFetching && reelId !== "",
  });
}

export function useAddComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reelId, body }: { reelId: string; body: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.addComment(BigInt(reelId), body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["comments", variables.reelId],
      });
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useAddReel() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caption,
      file,
      onProgress,
    }: {
      caption: string;
      file: File;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
      if (onProgress) {
        blob.withUploadProgress(onProgress);
      }
      await actor.addReel(caption, blob, file.name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(principalText: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["userProfile", principalText],
    queryFn: async () => {
      if (!actor || !principalText) return null;
      return actor.getUserProfile(Principal.fromText(principalText));
    },
    enabled: !!actor && !isFetching && principalText.length > 0,
  });
}

export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["auth", "username", username],
    queryFn: async () => {
      if (!actor) return true;
      return actor.isUsernameAvailable(username);
    },
    enabled: !!actor && !isFetching && username.trim().length > 0,
  });
}

export function useRegisterUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.registerUser(username, password);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useChangePassword() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.changePassword(currentPassword, newPassword);
    },
  });
}

export function useChangeUsername() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUsername: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.changeUsername(newUsername);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

export function useSetProfilePicture() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
      if (onProgress) {
        blob.withUploadProgress(onProgress);
      }
      return actor.setProfilePicture(blob);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

export function useSetVisibility() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setVisibility(isPublic);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

export type { BackendComment };

export function useListConversations() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ChatConversation[]> => {
      if (!actor) return [];
      return actor.listConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: CONVERSATIONS_REFRESH_INTERVAL,
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}

export function useGetOrCreateConversation() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (other: Principal): Promise<ChatConversation> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getOrCreateConversation(other);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useListMessages(conversationId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["messages", conversationId.toString()],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!actor) return [];
      return actor.listMessages(conversationId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: CHAT_REFRESH_INTERVAL,
    staleTime: CHAT_STALE_TIME,
  });
}

export function useSendMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
      replyTo,
    }: {
      conversationId: bigint;
      text: string;
      replyTo: bigint | undefined;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.sendMessage({ conversationId, text, replyTo });
    },
    onSuccess: (message) => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", message.conversationId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useReactToMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      conversationId: bigint;
      messageId: bigint;
      emoji: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.reactToMessage({ messageId, emoji });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId.toString()],
      });
    },
  });
}

export function useListStatuses(principalText: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["statuses", principalText],
    queryFn: async (): Promise<Status[]> => {
      if (!actor || !principalText) return [];
      const statuses = await actor.listStatusesByAuthor(
        Principal.fromText(principalText),
      );
      return statuses.map(mapStatus);
    },
    enabled: !!actor && !isFetching && principalText.length > 0,
    staleTime: 15_000,
  });
}

export function useAddStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      text,
      file,
      onProgress,
    }: {
      text: string;
      file?: File | null;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      let image: ExternalBlob | null = null;
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
        if (onProgress) {
          blob.withUploadProgress(onProgress);
        }
        image = blob;
      }
      return actor.addStatus(text, image);
    },
    onSuccess: (status) => {
      void queryClient.invalidateQueries({
        queryKey: ["statuses", status.author.toText()],
      });
    },
  });
}

export function useDeleteStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; authorPrincipal: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.deleteStatus(BigInt(id));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["statuses", variables.authorPrincipal],
      });
    },
  });
}
