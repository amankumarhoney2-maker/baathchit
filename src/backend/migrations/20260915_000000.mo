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

  type OldActor = {};

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
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      profiles = Map.empty();
      usernames = Map.empty();
      conversations = Map.empty();
      conversationByPair = Map.empty();
      messages = Map.empty();
      chatState = { var nextConversationId = 0; var nextMessageId = 0 };
      reels = Map.empty();
      comments = Map.empty();
      likes = Map.empty();
      saved = Map.empty();
      state = { var nextReelId = 0; var nextCommentId = 0 };
    };
  };
};
