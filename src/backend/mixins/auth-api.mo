import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import AuthLib "../lib/auth";
import Types "../types/auth";

mixin (
  profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
  usernames : Map.Map<Text, Principal.Principal>,
) {
  /// Set a unique username and password for the caller's Google account.
  /// Fails if the caller already has a profile or the username is taken.
  public shared ({ caller }) func registerUser(username : Text, password : Text) : async Bool {
    await AuthLib.register(profiles, usernames, caller, username, password)
  };

  /// Fetch the caller's own profile (username/password) stored against their
  /// Google account. Returns null when the caller has not registered yet.
  public query ({ caller }) func getCallerProfile() : async ?Types.AuthProfile {
    profiles.get(caller)
  };

  /// Look up another user's public profile info (username, profile picture,
  /// visibility). Returns null when the principal has no registered profile.
  /// The frontend uses `isPublic` to decide whether to render that user's
  /// principal ID: when false, the ID must be hidden everywhere in the app.
  public query func getUserProfile(principal : Principal.Principal) : async ?Types.PublicProfile {
    AuthLib.getUserProfile(profiles, principal)
  };

  /// Check whether a username is available for registration.
  public query func isUsernameAvailable(username : Text) : async Bool {
    not (AuthLib.isUsernameTaken(usernames, username))
  };

  /// Change the caller's password. Requires the current password to match;
  /// returns false otherwise or when the caller has no profile.
  public shared ({ caller }) func changePassword(currentPassword : Text, newPassword : Text) : async Bool {
    await AuthLib.changePassword(profiles, caller, currentPassword, newPassword)
  };

  /// Change the caller's username. Returns false when the new username is
  /// already taken by another user or the caller has no profile.
  public shared ({ caller }) func changeUsername(newUsername : Text) : async Bool {
    await AuthLib.changeUsername(profiles, usernames, caller, newUsername)
  };

  /// Set the caller's profile picture (an external-blob reference produced by
  /// the object-storage extension). Pass null to clear it.
  public shared ({ caller }) func setProfilePicture(picture : ?Storage.ExternalBlob) : async Bool {
    await AuthLib.setProfilePicture(profiles, caller, picture)
  };

  /// Toggle whether the caller's account is public (ID shown everywhere) or
  /// private (ID hidden from other users).
  public shared ({ caller }) func setVisibility(isPublic : Bool) : async Bool {
    await AuthLib.setVisibility(profiles, caller, isPublic)
  };
};
