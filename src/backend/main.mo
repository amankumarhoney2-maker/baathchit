import Blob "mo:core/Blob";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Storage "mo:caffeineai-object-storage/Storage";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BlobValue "mo:caffeineai-oql/BlobValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import OQL "mo:caffeineai-oql";
import AuthApi "mixins/auth-api";
import ChatApi "mixins/chat-api";
import ReelsApi "mixins/reels-api";
import StatusApi "mixins/status-api";
import ApiDocMixin "mixins/api-doc";
import AuthTypes "types/auth";
import ChatTypes "types/chat";
import ReelsTypes "types/reels";
import StatusTypes "types/status";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();

  let profiles : Map.Map<Principal, AuthTypes.AuthProfile>;
  let usernames : Map.Map<Text, Principal>;
  include AuthApi(profiles, usernames);

  let conversations : Map.Map<ChatTypes.ConversationId, ChatTypes.Conversation>;
  let conversationByPair : Map.Map<Text, ChatTypes.ConversationId>;
  let messages : Map.Map<ChatTypes.ConversationId, List.List<ChatTypes.Message>>;
  let chatState : ChatTypes.ChatState;
  include ChatApi(accessControlState, conversations, conversationByPair, messages, chatState);

  let reels : Map.Map<Nat, ReelsTypes.Reel>;
  let comments : Map.Map<Nat, List.List<ReelsTypes.Comment>>;
  let likes : Map.Map<Nat, Set.Set<Principal>>;
  let saved : Map.Map<Principal, List.List<ReelsTypes.SavedReel>>;
  let state : { var nextReelId : Nat; var nextCommentId : Nat };

  include ReelsApi(accessControlState, reels, comments, likes, saved, state);

  let statuses : Map.Map<Nat, StatusTypes.Status>;
  let statusState : { var nextStatusId : Nat };
  include StatusApi(accessControlState, statuses, statusState);

  transient let anyP = Principal.fromText("aaaaa-aa");

  // Flatten the per-reel comment lists into a single iterator of comments.
  func allComments() : Iter.Iter<ReelsTypes.Comment> {
    let acc = List.empty<ReelsTypes.Comment>();
    for ((_, list) in comments.entries()) {
      for (c in list.toArray().values()) { acc.add(c) };
    };
    acc.toArray().values()
  };

  // Flatten each user's saved-reel list, carrying the owning principal along.
  func allSavedReels() : Iter.Iter<(Principal.Principal, ReelsTypes.SavedReel)> {
    let acc = List.empty<(Principal.Principal, ReelsTypes.SavedReel)>();
    for ((p, list) in saved.entries()) {
      for (s in list.toArray().values()) { acc.add((p, s)) };
    };
    acc.toArray().values()
  };

  // Flatten the per-conversation message lists into a single iterator.
  func allMessages() : Iter.Iter<ChatTypes.Message> {
    let acc = List.empty<ChatTypes.Message>();
    for ((_, list) in messages.entries()) {
      for (m in list.toArray().values()) { acc.add(m) };
    };
    acc.toArray().values()
  };

  // replyTo is an optional message id; expose 0 when there is no reply.
  func replyToId(m : ChatTypes.Message) : Nat {
    switch (m.replyTo) { case null 0; case (?r) r }
  };

  // profilePicture is an optional external-blob reference; expose an empty
  // blob when the user has not uploaded one.
  func profilePicBlob(p : ?Storage.ExternalBlob) : Blob {
    switch (p) { case null Blob.fromArray([]); case (?b) b }
  };

  include Expose({
    entities = [
      // Auth profiles: private per-user credentials. The owning principal is the
      // map key, so it is promoted as a column; the password is hidden.
      OQL.Entity.manual<(Principal.Principal, AuthTypes.AuthProfile)>(
        "authProfile",
        func () = profiles.entries(),
        "AuthProfile",
        "principal",
      )
        .sample((anyP, { username = ""; password = ""; createdAt = 0; profilePicture = null; isPublic = true }))
        .payload("principal", func ((p, _)) = p)
        .payload("username", func ((_, a)) = a.username)
        .payload("password", func ((_, a)) = a.password)
        .payload("createdAt", func ((_, a)) = a.createdAt)
        .payload("profilePicture", func ((_, a)) = profilePicBlob(a.profilePicture))
        .payload("isPublic", func ((_, a)) = a.isPublic)
        .ownedBy("principal")
        .hidden("password")
        .scopedPerUser()
        .build(),
      // Reels: public feed content. The video blob reference is hidden.
      reels.toEntity("reel", "Reel", "id")
        .sample({
          id = 0;
          uploader = anyP;
          caption = "";
          video = Blob.fromArray([]);
          filename = "";
          createdAt = 0;
          likeCount = 0;
          commentCount = 0;
          saveCount = 0;
        })
        .hidden("video")
        .public_()
        .build(),
      // Statuses/notes: public profile content. The optional image blob
      // reference is hidden. Declared manually because the optional
      // external-blob field has no implicit `_toRow` instance for
      // auto-derivation.
      OQL.Entity.manual<StatusTypes.Status>(
        "status",
        func () = statuses.values(),
        "Status",
        "id",
      )
        .sample({
          id = 0;
          author = anyP;
          text = "";
          image = null;
          createdAt = 0;
        })
        .payload("id", func s = s.id)
        .payload("author", func s = s.author)
        .payload("text", func s = s.text)
        .payload("createdAt", func s = s.createdAt)
        .hidden("image")
        .public_()
        .build(),
      // Comments: public content attached to reels.
      OQL.Entity.manual<ReelsTypes.Comment>("comment", allComments, "Comment", "id")
        .sample({ id = 0; reelId = 0; author = anyP; body = ""; createdAt = 0 })
        .payload("id", func c = c.id)
        .payload("reelId", func c = c.reelId)
        .payload("author", func c = c.author)
        .payload("body", func c = c.body)
        .payload("createdAt", func c = c.createdAt)
        .public_()
        .build(),
      // Saved reels: private per-user collection; owner is the map key.
      OQL.Entity.manual<(Principal.Principal, ReelsTypes.SavedReel)>(
        "savedReel",
        allSavedReels,
        "SavedReel",
        "reelId",
      )
        .sample((anyP, { reelId = 0; savedAt = 0 }))
        .payload("owner", func ((p, _)) = p)
        .payload("reelId", func ((_, s)) = s.reelId)
        .payload("savedAt", func ((_, s)) = s.savedAt)
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      // Conversations: private 1:1 chats; controller-only (agent answers, no
      // end user reads another's DMs via OQL).
      conversations.toEntity("conversation", "Conversation", "id")
        .sample({ id = 0; participantA = anyP; participantB = anyP; createdAt = 0 })
        .controllerOnly()
        .build(),
      // Messages: private chat content; controller-only. The reactions array is
      // exposed as a count and replyTo as a sentinel (0 = none).
      OQL.Entity.manual<ChatTypes.Message>("message", allMessages, "Message", "id")
        .sample({
          id = 0;
          conversationId = 0;
          sender = anyP;
          text = "";
          replyTo = null;
          reactions = [];
          createdAt = 0;
        })
        .payload("id", func m = m.id)
        .payload("conversationId", func m = m.conversationId)
        .payload("sender", func m = m.sender)
        .payload("text", func m = m.text)
        .payload("replyTo", replyToId)
        .payload("reactionCount", func m = m.reactions.size())
        .payload("createdAt", func m = m.createdAt)
        .controllerOnly()
        .build(),
    ];
  });

  include ApiDocMixin();
};
