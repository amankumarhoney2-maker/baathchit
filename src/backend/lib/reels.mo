import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/reels";

module {
  /// Returns all reels in the feed, newest first.
  public func listReels(reels : Map.Map<Nat, Types.Reel>) : [Types.Reel] {
    let all = reels.values().toArray();
    all.sort(func (a, b) =
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else { #equal }
    );
  };

  /// Returns a single reel by id, if it exists.
  public func getReel(reels : Map.Map<Nat, Types.Reel>, id : Nat) : ?Types.Reel {
    reels.get(id);
  };

  /// Creates a new reel from an uploaded video and caption.
  public func addReel(
    reels : Map.Map<Nat, Types.Reel>,
    state : { var nextReelId : Nat },
    uploader : Principal,
    caption : Text,
    video : Storage.ExternalBlob,
    filename : Text,
  ) : Types.Reel {
    let reel : Types.Reel = {
      id = state.nextReelId;
      uploader;
      caption;
      video;
      filename;
      createdAt = Time.now();
      likeCount = 0;
      commentCount = 0;
      saveCount = 0;
    };
    reels.add(reel.id, reel);
    state.nextReelId += 1;
    reel;
  };

  /// Records a like on a reel by a user. Idempotent: a user can like once.
  public func likeReel(
    reels : Map.Map<Nat, Types.Reel>,
    likes : Map.Map<Nat, Set.Set<Principal>>,
    reelId : Nat,
    liker : Principal,
  ) : () {
    let likers = switch (likes.get(reelId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        likes.add(reelId, s);
        s;
      };
    };
    if (not likers.contains(liker)) {
      likers.add(liker);
      switch (reels.get(reelId)) {
        case (?r) {
          reels.add(reelId, { r with likeCount = r.likeCount + 1 });
        };
        case null {};
      };
    };
  };

  /// Removes a like on a reel by a user. Idempotent.
  public func unlikeReel(
    reels : Map.Map<Nat, Types.Reel>,
    likes : Map.Map<Nat, Set.Set<Principal>>,
    reelId : Nat,
    liker : Principal,
  ) : () {
    switch (likes.get(reelId)) {
      case (?likers) {
        if (likers.contains(liker)) {
          likers.remove(liker);
          switch (reels.get(reelId)) {
            case (?r) {
              reels.add(reelId, { r with likeCount = if (r.likeCount > 0) { r.likeCount - 1 } else { 0 } });
            };
            case null {};
          };
        };
      };
      case null {};
    };
  };

  /// Adds a comment to a reel and bumps the reel's comment count.
  public func addComment(
    reels : Map.Map<Nat, Types.Reel>,
    comments : Map.Map<Nat, List.List<Types.Comment>>,
    state : { var nextCommentId : Nat },
    reelId : Nat,
    author : Principal,
    body : Text,
  ) : Types.Comment {
    let comment : Types.Comment = {
      id = state.nextCommentId;
      reelId;
      author;
      body;
      createdAt = Time.now();
    };
    state.nextCommentId += 1;
    let list = switch (comments.get(reelId)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.Comment>();
        comments.add(reelId, l);
        l;
      };
    };
    list.add(comment);
    switch (reels.get(reelId)) {
      case (?r) {
        reels.add(reelId, { r with commentCount = r.commentCount + 1 });
      };
      case null {};
    };
    comment;
  };

  /// Returns the comments on a reel, oldest first.
  public func listComments(comments : Map.Map<Nat, List.List<Types.Comment>>, reelId : Nat) : [Types.Comment] {
    switch (comments.get(reelId)) {
      case (?l) l.toArray();
      case null [];
    };
  };

  /// Saves a reel to a user's collection. Idempotent per user.
  public func saveReel(
    reels : Map.Map<Nat, Types.Reel>,
    saved : Map.Map<Principal, List.List<Types.SavedReel>>,
    reelId : Nat,
    saver : Principal,
  ) : () {
    let list = switch (saved.get(saver)) {
      case (?l) l;
      case null {
        let l = List.empty<Types.SavedReel>();
        saved.add(saver, l);
        l;
      };
    };
    if (not list.toArray().any(func s = s.reelId == reelId)) {
      list.add({ reelId; savedAt = Time.now() });
      switch (reels.get(reelId)) {
        case (?r) {
          reels.add(reelId, { r with saveCount = r.saveCount + 1 });
        };
        case null {};
      };
    };
  };

  /// Removes a reel from a user's saved collection. Idempotent.
  public func unsaveReel(
    reels : Map.Map<Nat, Types.Reel>,
    saved : Map.Map<Principal, List.List<Types.SavedReel>>,
    reelId : Nat,
    saver : Principal,
  ) : () {
    switch (saved.get(saver)) {
      case (?list) {
        let snapshot = list.toArray();
        let filtered = snapshot.filter(func s = s.reelId != reelId);
        if (filtered.size() != snapshot.size()) {
          list.clear();
          for (s in filtered.values()) { list.add(s) };
          switch (reels.get(reelId)) {
            case (?r) {
              reels.add(reelId, { r with saveCount = if (r.saveCount > 0) { r.saveCount - 1 } else { 0 } });
            };
            case null {};
          };
        };
      };
      case null {};
    };
  };

  /// Returns the reels a user has saved.
  public func listSavedReels(saved : Map.Map<Principal, List.List<Types.SavedReel>>, user : Principal) : [Types.SavedReel] {
    switch (saved.get(user)) {
      case (?l) l.toArray();
      case null [];
    };
  };
};
