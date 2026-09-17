import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// A reel uploaded by a user. The video content is stored off-chain via the
  /// object-storage extension; the backend keeps only the external blob
  /// reference plus engagement metadata.
  public type Reel = {
    id : Nat;
    uploader : Principal;
    caption : Text;
    video : Storage.ExternalBlob;
    filename : Text;
    createdAt : Int;
    likeCount : Nat;
    commentCount : Nat;
    saveCount : Nat;
  };

  /// A comment left on a reel.
  public type Comment = {
    id : Nat;
    reelId : Nat;
    author : Principal;
    body : Text;
    createdAt : Int;
  };

  /// A user's saved reel (their personal collection).
  public type SavedReel = {
    reelId : Nat;
    savedAt : Int;
  };
};
