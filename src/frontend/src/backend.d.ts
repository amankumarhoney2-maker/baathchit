import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AuthProfile {
    username: string;
    password: string;
    createdAt: bigint;
    isPublic: boolean;
    profilePicture?: ExternalBlob;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Comment {
    id: bigint;
    body: string;
    createdAt: bigint;
    author: Principal;
    reelId: bigint;
}
export interface Conversation {
    id: ConversationId;
    participantA: Principal;
    participantB: Principal;
    createdAt: bigint;
}
export type ConversationId = bigint;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Message {
    id: MessageId;
    createdAt: bigint;
    text: string;
    sender: Principal;
    conversationId: ConversationId;
    replyTo?: MessageId;
    reactions: Array<Reaction>;
}
export type MessageId = bigint;
export type Principal = Principal;
export interface PublicProfile {
    username: string;
    isPublic: boolean;
    profilePicture?: ExternalBlob;
}
export interface ReactInput {
    messageId: MessageId;
    emoji: string;
}
export interface Reaction {
    emoji: string;
    author: Principal;
}
export interface Reel {
    id: bigint;
    likeCount: bigint;
    video: ExternalBlob;
    createdAt: bigint;
    filename: string;
    caption: string;
    commentCount: bigint;
    uploader: Principal;
    saveCount: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface SavedReel {
    savedAt: bigint;
    reelId: bigint;
}
export interface SendMessageInput {
    text: string;
    conversationId: ConversationId;
    replyTo?: MessageId;
}
export interface Status {
    id: bigint;
    createdAt: bigint;
    text: string;
    author: Principal;
    image?: ExternalBlob;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Adds a comment to a reel as the caller.
     */
    addComment(reelId: bigint, body: string): Promise<Comment>;
    /**
     * / Uploads a new reel with a caption. The video is stored via the
     * / object-storage extension; only the external blob reference is kept here.
     */
    addReel(caption: string, video: ExternalBlob, filename: string): Promise<Reel>;
    /**
     * / Posts a status/note as the caller. `text` must be non-empty and at most
     * / 280 characters. `image` is an optional external-blob reference produced by
     * / the object-storage extension.
     */
    addStatus(text: string, image: ExternalBlob | null): Promise<Status>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Change the caller's password. Requires the current password to match;
     * / returns false otherwise or when the caller has no profile.
     */
    changePassword(currentPassword: string, newPassword: string): Promise<boolean>;
    /**
     * / Change the caller's username. Returns false when the new username is
     * / already taken by another user or the caller has no profile.
     */
    changeUsername(newUsername: string): Promise<boolean>;
    /**
     * / Deletes one of the caller's own statuses/notes.
     */
    deleteStatus(id: bigint): Promise<void>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Static API documentation for the Baathchit backend. Authored from the
     * / current source; read-only and returns no runtime state.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Fetch the caller's own profile (username/password) stored against their
     * / Google account. Returns null when the caller has not registered yet.
     */
    getCallerProfile(): Promise<AuthProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrCreateConversation(other: Principal): Promise<Conversation>;
    /**
     * / Returns a single reel by id, if it exists.
     */
    getReel(id: bigint): Promise<Reel | null>;
    /**
     * / Look up another user's public profile info (username, profile picture,
     * / visibility). Returns null when the principal has no registered profile.
     * / The frontend uses `isPublic` to decide whether to render that user's
     * / principal ID: when false, the ID must be hidden everywhere in the app.
     */
    getUserProfile(principal: Principal): Promise<PublicProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Check whether a username is available for registration.
     */
    isUsernameAvailable(username: string): Promise<boolean>;
    /**
     * / Likes a reel as the caller.
     */
    likeReel(reelId: bigint): Promise<void>;
    /**
     * / Returns the comments on a reel.
     */
    listComments(reelId: bigint): Promise<Array<Comment>>;
    listConversations(): Promise<Array<Conversation>>;
    /**
     * / Returns the reel IDs the caller has liked, so like state can be reflected
     * / on feed load.
     */
    listLikedReels(): Promise<Array<bigint>>;
    listMessages(conversationId: ConversationId): Promise<Array<Message>>;
    /**
     * / Returns all reels in the feed, newest first.
     */
    listReels(): Promise<Array<Reel>>;
    /**
     * / Returns the reels the caller has saved.
     */
    listSavedReels(): Promise<Array<SavedReel>>;
    /**
     * / Returns a user's statuses/notes, newest first.
     */
    listStatusesByAuthor(author: Principal): Promise<Array<Status>>;
    reactToMessage(input: ReactInput): Promise<void>;
    /**
     * / Set a unique username and password for the caller's Google account.
     * / Fails if the caller already has a profile or the username is taken.
     */
    registerUser(username: string, password: string): Promise<boolean>;
    /**
     * / Saves a reel to the caller's collection.
     */
    saveReel(reelId: bigint): Promise<void>;
    schema(): Promise<string>;
    sendMessage(input: SendMessageInput): Promise<Message>;
    /**
     * / Set the caller's profile picture (an external-blob reference produced by
     * / the object-storage extension). Pass null to clear it.
     */
    setProfilePicture(picture: ExternalBlob | null): Promise<boolean>;
    /**
     * / Toggle whether the caller's account is public (ID shown everywhere) or
     * / private (ID hidden from other users).
     */
    setVisibility(isPublic: boolean): Promise<boolean>;
    /**
     * / Removes the caller's like from a reel.
     */
    unlikeReel(reelId: bigint): Promise<void>;
    /**
     * / Removes a reel from the caller's saved collection.
     */
    unsaveReel(reelId: bigint): Promise<void>;
}
