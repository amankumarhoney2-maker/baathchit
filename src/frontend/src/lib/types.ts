import type { Principal } from "@icp-sdk/core/principal";

export type Tab = "reels" | "chats" | "profile";

export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Reel {
  id: string;
  uploader: string;
  uploaderPrincipal: string;
  caption: string;
  videoUrl: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  likedByMe: boolean;
  savedByMe: boolean;
}

export interface ChatReaction {
  author: Principal;
  emoji: string;
}

export interface ChatMessage {
  id: bigint;
  conversationId: bigint;
  sender: Principal;
  text: string;
  replyTo?: bigint;
  reactions: ChatReaction[];
  createdAt: bigint;
}

export interface ChatConversation {
  id: bigint;
  participantA: Principal;
  participantB: Principal;
  createdAt: bigint;
}

export interface ProfilePicture {
  url: string;
  filename: string;
}

export interface Status {
  id: string;
  author: string;
  authorPrincipal: string;
  text: string;
  imageUrl: string | null;
  createdAt: bigint;
}
