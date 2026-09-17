import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Reel = {
    id : Nat;
    uploader : Principal;
    caption : Text;
    video : Blob;
    filename : Text;
    createdAt : Int;
    likeCount : Nat;
    commentCount : Nat;
    saveCount : Nat;
  };

  type Comment = {
    id : Nat;
    reelId : Nat;
    author : Principal;
    body : Text;
    createdAt : Int;
  };

  type SavedReel = {
    reelId : Nat;
    savedAt : Int;
  };

  type AuthProfile = {
    username : Text;
    password : Text;
    createdAt : Int;
    profilePicture : ?Blob;
    isPublic : Bool;
  };

  type Conversation = {
    id : Nat;
    participantA : Principal;
    participantB : Principal;
    createdAt : Int;
  };

  type Reaction = {
    author : Principal;
    emoji : Text;
  };

  type Message = {
    id : Nat;
    conversationId : Nat;
    sender : Principal;
    text : Text;
    replyTo : ?Nat;
    reactions : [Reaction];
    createdAt : Int;
  };

  type Status = {
    id : Nat;
    author : Principal;
    text : Text;
    image : ?Blob;
    createdAt : Int;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, AuthProfile>;
    usernames : Map.Map<Text, Principal>;
    conversations : Map.Map<Nat, Conversation>;
    conversationByPair : Map.Map<Text, Nat>;
    messages : Map.Map<Nat, List.List<Message>>;
    chatState : { var nextConversationId : Nat; var nextMessageId : Nat };
    reels : Map.Map<Nat, Reel>;
    comments : Map.Map<Nat, List.List<Comment>>;
    likes : Map.Map<Nat, Set.Set<Principal>>;
    saved : Map.Map<Principal, List.List<SavedReel>>;
    state : { var nextReelId : Nat; var nextCommentId : Nat };
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, AuthProfile>;
    usernames : Map.Map<Text, Principal>;
    conversations : Map.Map<Nat, Conversation>;
    conversationByPair : Map.Map<Text, Nat>;
    messages : Map.Map<Nat, List.List<Message>>;
    chatState : { var nextConversationId : Nat; var nextMessageId : Nat };
    reels : Map.Map<Nat, Reel>;
    comments : Map.Map<Nat, List.List<Comment>>;
    likes : Map.Map<Nat, Set.Set<Principal>>;
    saved : Map.Map<Principal, List.List<SavedReel>>;
    state : { var nextReelId : Nat; var nextCommentId : Nat };
    statuses : Map.Map<Nat, Status>;
    statusState : { var nextStatusId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      profiles = old.profiles;
      usernames = old.usernames;
      conversations = old.conversations;
      conversationByPair = old.conversationByPair;
      messages = old.messages;
      chatState = old.chatState;
      reels = old.reels;
      comments = old.comments;
      likes = old.likes;
      saved = old.saved;
      state = old.state;
      statuses = Map.empty();
      statusState = { var nextStatusId = 0 };
    };
  };
};
