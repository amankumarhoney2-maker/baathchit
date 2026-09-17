import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// A status/note posted by a user from their profile. The text is capped at
  /// 280 characters. An optional image is stored off-chain via the
  /// object-storage extension; the backend keeps only the external blob
  /// reference.
  public type Status = {
    id : Nat;
    author : Principal;
    text : Text;
    image : ?Storage.ExternalBlob;
    createdAt : Int;
  };
};
