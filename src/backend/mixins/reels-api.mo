import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import ReelsLib "../lib/reels";
import Types "../types/reels";

mixin (
  accessControlState : AccessControl.AccessControlState,
  reels : Map.Map<Nat, Types.Reel>,
  comments : Map.Map<Nat, List.List<Types.Comment>>,
  likes : Map.Map<Nat, Set.Set<Principal>>,
  saved : Map.Map<Principal, List.List<Types.SavedReel>>,
  state : { var nextReelId : Nat; var nextCommentId : Nat },
) {
  /// Returns all reels in the feed, newest first.
  public query ({ caller }) func listReels() : async [Types.Reel] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reels");
    };
    ReelsLib.listReels(reels);
  };

  /// Returns a single reel by id, if it exists.
  public query ({ caller }) func getReel(id : Nat) : async ?Types.Reel {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reels");
    };
    ReelsLib.getReel(reels, id);
  };

  /// Uploads a new reel with a caption. The video is stored via the
  /// object-storage extension; only the external blob reference is kept here.
  public shared ({ caller }) func addReel(caption : Text, video : Storage.ExternalBlob, filename : Text) : async Types.Reel {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload reels");
    };
    ReelsLib.addReel(reels, state, caller, caption, video, filename);
  };

  /// Likes a reel as the caller.
  public shared ({ caller }) func likeReel(reelId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like reels");
    };
    ReelsLib.likeReel(reels, likes, reelId, caller);
  };

  /// Removes the caller's like from a reel.
  public shared ({ caller }) func unlikeReel(reelId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unlike reels");
    };
    ReelsLib.unlikeReel(reels, likes, reelId, caller);
  };

  /// Adds a comment to a reel as the caller.
  public shared ({ caller }) func addComment(reelId : Nat, body : Text) : async Types.Comment {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can comment on reels");
    };
    ReelsLib.addComment(reels, comments, state, reelId, caller, body);
  };

  /// Returns the comments on a reel.
  public query ({ caller }) func listComments(reelId : Nat) : async [Types.Comment] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };
    ReelsLib.listComments(comments, reelId);
  };

  /// Saves a reel to the caller's collection.
  public shared ({ caller }) func saveReel(reelId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save reels");
    };
    ReelsLib.saveReel(reels, saved, reelId, caller);
  };

  /// Removes a reel from the caller's saved collection.
  public shared ({ caller }) func unsaveReel(reelId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unsave reels");
    };
    ReelsLib.unsaveReel(reels, saved, reelId, caller);
  };

  /// Returns the reels the caller has saved.
  public query ({ caller }) func listSavedReels() : async [Types.SavedReel] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view saved reels");
    };
    ReelsLib.listSavedReels(saved, caller);
  };

  /// Returns the reel IDs the caller has liked, so like state can be reflected
  /// on feed load.
  public query ({ caller }) func listLikedReels() : async [Nat] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view liked reels");
    };
    let acc = List.empty<Nat>();
    for ((reelId, likers) in likes.entries()) {
      if (likers.contains(caller)) { acc.add(reelId) };
    };
    acc.toArray()
  };
};
