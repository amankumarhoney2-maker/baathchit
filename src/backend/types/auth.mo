import Storage "mo:caffeineai-object-storage/Storage";

module {
  /// A user's profile stored against their Google account (Internet Identity
  /// principal). The username is unique across all users; the password is
  /// stored alongside the Google account for the app's own sign-in flow.
  /// `profilePicture` is an optional external-blob reference to the user's
  /// uploaded avatar. `isPublic` controls whether the user's principal ID is
  /// shown to other users across the app (true = shown everywhere, false =
  /// hidden from everyone except the user themself).
  public type AuthProfile = {
    username : Text;
    password : Text;
    createdAt : Int;
    profilePicture : ?Storage.ExternalBlob;
    isPublic : Bool;
  };

  /// The public-facing subset of a user's profile that other users may look up.
  /// Deliberately excludes the password and the principal ID: the caller
  /// already knows the principal they are looking up, and the frontend uses
  /// `isPublic` to decide whether to render that user's ID.
  public type PublicProfile = {
    username : Text;
    profilePicture : ?Storage.ExternalBlob;
    isPublic : Bool;
  };
};
