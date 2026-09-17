mixin () {
  /// Static API documentation for the Baathchit backend. Authored from the
  /// current source; read-only and returns no runtime state.
  public query func getApiDoc() : async Text {
    "# Baathchit Backend API\n" #
    "\n" #
    "Baathchit is a real-time chat and short-video (reels) app. Users sign in with\n" #
    "their Google account via Internet Identity SSO, register a username/password\n" #
    "against that account, post and engage with reels, and hold private 1:1 chat\n" #
    "conversations with other users. This document describes the public canister\n" #
    "API: purpose, authentication, authorization, units, lifecycle, retry safety,\n" #
    "errors, and non-obvious gotchas.\n" #
    "\n" #
    "## Public methods\n" #
    "\n" #
    "### Authorization (Internet Identity SSO + roles)\n" #
    "- `_initialize_access_control : () -> async ()` — initializes role-based\n" #
    "  access control. Must be called once by a signed-in caller before any\n" #
    "  role-guarded call (guarded queries included). The first initializer becomes\n" #
    "  admin; subsequent callers receive the user role.\n" #
    "- `_internet_identity_sign_in_start` / `_internet_identity_sign_in_finish` —\n" #
    "  the Internet Identity sign-in flow used by the frontend.\n" #
    "- `assignCallerUserRole : (user : principal, role : variant { admin; user; guest }) -> async ()`\n" #
    "  — assigns a role to another principal. Admin-only.\n" #
    "- `getCallerUserRole : () -> async variant { admin; user; guest }` — the\n" #
    "  caller's own role.\n" #
    "- `isCallerAdmin : () -> async bool` — whether the caller is an admin.\n" #
    "- `__accessControlState` — internal access-control state accessor.\n" #
    "\n" #
    "### Object storage\n" #
    "- `_immutableObjectStorageCreateCertificate : (blobHash : text) -> async record { method : text; blob_hash : text }`\n" #
    "  — issues the upload certificate the storage gateway requires. Used by the\n" #
    "  frontend when uploading reel videos; do not call directly.\n" #
    "\n" #
    "### Auth profiles\n" #
    "- `registerUser : (username : text, password : text) -> async bool` — sets a\n" #
    "  unique username and password for the caller's Google account. Returns false\n" #
    "  if the caller already has a profile or the username is taken.\n" #
    "- `getCallerProfile : () -> async ?record { username : text; password : text; createdAt : int; profilePicture : ?blob; isPublic : bool }`\n" #
    "  — the caller's own profile, or null if not registered.\n" #
    "- `getUserProfile : (principal : principal) -> async ?record { username : text; profilePicture : ?blob; isPublic : bool }`\n" #
    "  — another user's public profile info (username, profile picture,\n" #
    "  visibility), or null if that principal has no registered profile. The\n" #
    "  principal ID itself is not returned; the frontend uses `isPublic` to\n" #
    "  decide whether to render that user's ID (false = hide it everywhere).\n" #
    "- `isUsernameAvailable : (username : text) -> async bool` — whether a username\n" #
    "  is free to register.\n" #
    "- `changePassword : (currentPassword : text, newPassword : text) -> async bool`\n" #
    "  — changes the caller's password. Returns false when the current password\n" #
    "  does not match or the caller has no profile.\n" #
    "- `changeUsername : (newUsername : text) -> async bool` — changes the caller's\n" #
    "  username. Returns false when the new username is already taken by another\n" #
    "  user or the caller has no profile.\n" #
    "- `setProfilePicture : (picture : ?blob) -> async bool` — sets the caller's\n" #
    "  profile picture (an external-blob reference produced by the object-storage\n" #
    "  extension); pass null to clear it.\n" #
    "- `setVisibility : (isPublic : bool) -> async bool` — toggles whether the\n" #
    "  caller's account is public (ID shown everywhere) or private (ID hidden from\n" #
    "  other users).\n" #
    "\n" #
    "### Reels\n" #
    "- `listReels : () -> async [Reel]` — all reels, newest first.\n" #
    "- `getReel : (id : nat) -> async ?Reel` — a single reel by id.\n" #
    "- `addReel : (caption : text, video : blob, filename : text) -> async Reel` —\n" #
    "  uploads a new reel. `video` is an external-blob reference produced by the\n" #
    "  object-storage extension.\n" #
    "- `likeReel : (reelId : nat) -> async ()` / `unlikeReel : (reelId : nat) -> async ()`\n" #
    "  — add/remove the caller's like.\n" #
    "- `addComment : (reelId : nat, body : text) -> async Comment` — comment on a reel.\n" #
    "- `listComments : (reelId : nat) -> async [Comment]` — comments on a reel.\n" #
    "- `saveReel : (reelId : nat) -> async ()` / `unsaveReel : (reelId : nat) -> async ()`\n" #
    "  — add/remove a reel from the caller's saved collection.\n" #
    "- `listSavedReels : () -> async [SavedReel]` — the caller's saved reels.\n" #
    "\n" #
    "### Statuses & notes\n" #
    "- `addStatus : (text : text, image : ?blob) -> async Status` — posts a\n" #
    "  status/note as the caller. `text` must be non-empty and at most 280\n" #
    "  characters (a longer or empty text traps). `image` is an optional\n" #
    "  external-blob reference produced by the object-storage extension; pass\n" #
    "  null for a text-only status.\n" #
    "- `listStatusesByAuthor : (author : principal) -> async [Status]` — a user's\n" #
    "  statuses/notes, newest first. Any signed-in user may read any author's\n" #
    "  statuses.\n" #
    "- `deleteStatus : (id : nat) -> async ()` — deletes one of the caller's own\n" #
    "  statuses/notes. Traps with `Status not found` for an unknown id and\n" #
    "  `Unauthorized: Only the author can delete this status` when the caller is\n" #
    "  not the author.\n" #
    "\n" #
    "### Chat (private 1:1)\n" #    "- `listConversations : () -> async [Conversation]` — the caller's conversations.\n" #
    "- `listMessages : (conversationId : nat) -> async [Message]` — messages in a\n" #
    "  conversation the caller participates in.\n" #
    "- `getOrCreateConversation : (other : principal) -> async Conversation` —\n" #
    "  returns the existing 1:1 conversation with `other`, or creates it.\n" #
    "- `sendMessage : (input : record { conversationId : nat; text : text; replyTo : ?nat }) -> async Message`\n" #
    "  — sends a message; `replyTo` optionally references a message to reply to.\n" #
    "- `reactToMessage : (input : record { messageId : nat; emoji : text }) -> async ()`\n" #
    "  — adds/updates the caller's reaction (emoji) on a message.\n" #
    "\n" #
    "### OQL data queries\n" #
    "- `schema : () -> async text` — the OQL schema of the exposed entities.\n" #
    "- `execute : (query : text) -> async text` — runs a JSON OQL query over the\n" #
    "  exposed entities. See the per-entity authorization below.\n" #
    "\n" #
    "## Authentication and authorization\n" #
    "\n" #
    "Sign-in uses Internet Identity SSO backed by the user's Google account. The\n" #
    "caller's `principal` is derived from their Internet Identity. Anonymous\n" #
    "callers are treated as guests.\n" #
    "\n" #
    "### Registration prerequisite\n" #
    "Role-guarded endpoints require the caller to hold the `user` role (or\n" #
    "`admin`). A direct API caller must call `_initialize_access_control` once as\n" #
    "a signed-in caller before any role-guarded call, guarded queries included.\n" #
    "The first initializer receives the admin role; every subsequent caller\n" #
    "receives the user role. An unregistered or anonymous caller on a guarded\n" #
    "endpoint traps with a message such as `Unauthorized: Only users can perform\n" #
    "this action` (chat) or `Unauthorized: Only users can view reels` (reels).\n" #
    "\n" #
    "A caller can be unregistered even when the app appears to know it: registration\n" #
    "happens only when a caller signs in through the app's own frontend, so a\n" #
    "principal that never did so is unregistered even if it belongs to the app's\n" #
    "owner. A signed-in caller derived against a different origin is a different\n" #
    "principal than the one the frontend registered.\n" #
    "\n" #
    "### Which methods require a signed caller\n" #
    "All reels, status, and chat methods require the `user` role and trap\n" #
    "otherwise. The\n" #
    "auth-profile methods (`registerUser`, `getCallerProfile`, `getUserProfile`,\n" #
    "`isUsernameAvailable`) are open to any caller. The settings methods\n" #
    "(`changePassword`, `changeUsername`,\n" #
    "`setProfilePicture`, `setVisibility`) require the caller to have a registered\n" #
    "profile and return `false` (not a trap) when they do not. `assignCallerUserRole`\n" #
    "is admin-only.\n" #
    "\n" #
    "### Identity derivation\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin` when available. An agent already holding\n" #
    "the user's Internet Identity authorization derives the correct per-app\n" #
    "principal against that origin, for example `icp identity link web <name>\n" #
    "--app <host>`. Such a delegation acts with the user's full authority in this\n" #
    "app until it expires.\n" #
    "\n" #
    "### OQL per-entity authorization\n" #
    "- `authProfile` — scoped per user: each signed-in caller reads only their own\n" #
    "  profile; the password column is hidden from the schema.\n" #
    "- `reel`, `comment`, `status` — public: anyone (including anonymous) reads all\n" #
    "  rows.\n" #
    "- `savedReel` — scoped per user: each caller reads only their own saved reels.\n" #
    "- `conversation`, `message` — controller-only: private 1:1 chat data readable\n" #
    "  only by the platform controller (the Data Intelligence agent); no end user\n" #
    "  reads another's DMs through OQL.\n" #
    "\n" #
    "## Units and encodings\n" #
    "- Timestamps (`createdAt`, `savedAt`) are `int` nanoseconds since the Unix\n" #
    "  epoch (`Time.now()`).\n" #
    "- Identifiers (`id`, `reelId`, `conversationId`, `messageId`) are `nat`,\n" #
    "  assigned monotonically by the canister.\n" #
    "- Principals are Candid `principal` values; in OQL they surface as `#text` of\n" #
    "  the textual principal.\n" #
    "- `replyTo` is an optional `nat` message id; in OQL it is encoded as `0` when\n" #
    "  absent.\n" #
    "- `reactions` is an array of `{ author : principal; emoji : text }`; in OQL it\n" #
    "  is exposed as a `reactionCount` nat column.\n" #
    "- `video` is an external-blob reference (opaque); the actual bytes live in the\n" #
    "  object-storage gateway, not on-chain.\n" #
    "- `profilePicture` is an optional external-blob reference to the user's avatar;\n" #
    "  like `video`, the bytes live off-chain.\n" #
    "- `image` on a status/note is an optional external-blob reference; the bytes\n" #
    "  live off-chain. In OQL the `image` column is hidden from the schema.\n" #
    "- `isPublic` is a bool: when true the user's principal ID is shown everywhere\n" #
    "  (profile, reels, comments, chat); when false other users cannot see that\n" #
    "  user's ID anywhere in the app. The user's own ID is always visible to\n" #
    "  themselves regardless of the setting.\n" #
    "- Roles are the variant `{ admin; user; guest }`.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "Reels and chat are read via the query methods above; there is no push channel.\n" #
    "The frontend polls `listReels`, `listConversations`, and `listMessages` on a\n" #
    "periodic refresh to approximate real-time updates. Polling is safe: reads are\n" #
    "pure queries and never mutate state.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "- `registerUser` is idempotent in effect: a second call for the same caller\n" #
    "  returns false and does not overwrite the existing profile.\n" #
    "- `changePassword`, `changeUsername`, `setProfilePicture`, and `setVisibility`\n" #
    "  are idempotent: each sets the requested value; re-applying the same value is\n" #
    "  a no-op success. `changeUsername` to the caller's current username succeeds\n" #
    "  without changing anything.\n" #
    "- `likeReel` / `saveReel` are idempotent: re-liking or re-saving an already\n" #
    "  liked/saved reel is a no-op (the engagement counters are not double\n" #
    "  incremented).\n" #
    "- `getOrCreateConversation` is idempotent: it returns the existing\n" #
    "  conversation rather than creating a duplicate.\n" #
    "- `sendMessage` is not idempotent: each call appends a new message. Retrying a\n" #
    "  failed send may duplicate the message; the frontend should avoid blind\n" #
    "  retries.\n" #
    "- `reactToMessage` upserts the caller's reaction for a given emoji; calling it\n" #
    "  again with the same emoji replaces rather than duplicates.\n" #
    "- `addStatus` is not idempotent: each call appends a new status/note. Retrying\n" #
    "  a failed post may duplicate it; the frontend should avoid blind retries.\n" #
    "- `deleteStatus` is idempotent in effect for the author: deleting an already\n" #
    "  deleted id traps with `Status not found` rather than succeeding silently.\n" #
    "\n" #
    "## Errors, traps, and limits\n" #
    "Authorization failures trap (reject) rather than returning an error value:\n" #
    "chat methods trap with `Unauthorized: Only users can perform this action`;\n" #
    "reels methods trap with `Unauthorized: Only users can ...` (view/upload/like/\n" #
    "comment/save); status methods trap with `Unauthorized: Only users can ...`\n" #
    "(post/view/delete). `addStatus` traps with `Status text must not be empty` or\n" #
    "`Status text must be at most 280 characters` for invalid text, and\n" #
    "`deleteStatus` traps with `Status not found` or `Unauthorized: Only the author\n" #
    "can delete this status`. `listMessages` additionally traps with `Conversation not found`\n" #
    "for an unknown conversation and `Not a participant` for a caller outside the\n" #
    "conversation. `registerUser` returns `false` (not a trap) for a duplicate\n" #
    "profile or taken username. The settings methods (`changePassword`,\n" #
    "`changeUsername`, `setProfilePicture`, `setVisibility`) also return `false`\n" #
    "(not a trap) when the caller has no profile; `changePassword` additionally\n" #
    "returns `false` when the current password is wrong, and `changeUsername` when\n" #
    "the new username is taken by another user.\n" #
    "\n" #
    "Reel video bytes are stored off-chain; the on-chain `video` field is only a\n" #
    "reference. Do not attempt to read video content from the canister. OQL\n" #
    "`execute` responses must fit the canister's message limits; keep queries\n" #
    "bounded."
  };
};
