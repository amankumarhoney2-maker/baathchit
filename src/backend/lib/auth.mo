import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/auth";

module {
  /// Register a username and password for a first-time Google sign-in user.
  /// The profile is stored against the caller's principal. Returns false when
  /// the caller already has a profile or the username is already taken.
  public func register(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    usernames : Map.Map<Text, Principal.Principal>,
    caller : Principal.Principal,
    username : Text,
    password : Text,
  ) : async Bool {
    switch (profiles.get(caller)) {
      case (?_) { return false };
      case null {};
    };
    switch (usernames.get(username)) {
      case (?_) { return false };
      case null {};
    };
    profiles.add(caller, {
      username;
      password;
      createdAt = Time.now();
      profilePicture = null;
      isPublic = true;
    });
    usernames.add(username, caller);
    true
  };

  /// Fetch the profile stored against a given principal.
  public func getProfile(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    caller : Principal.Principal,
  ) : async ?Types.AuthProfile {
    profiles.get(caller)
  };

  /// Look up another user's public profile info (username, profile picture,
  /// visibility). Returns null when the principal has no registered profile.
  /// The principal ID itself is not returned: the caller already knows it, and
  /// the frontend uses `isPublic` to decide whether to render it.
  public func getUserProfile(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    principal : Principal.Principal,
  ) : ?Types.PublicProfile {
    switch (profiles.get(principal)) {
      case (?profile) {
        ?{
          username = profile.username;
          profilePicture = profile.profilePicture;
          isPublic = profile.isPublic;
        }
      };
      case null { null };
    }
  };

  /// Check whether a username is already taken by another user.
  public func isUsernameTaken(
    usernames : Map.Map<Text, Principal.Principal>,
    username : Text,
  ) : Bool {
    switch (usernames.get(username)) {
      case (?_) { true };
      case null { false };
    }
  };

  /// Change the caller's password. Returns false when the caller has no
  /// profile or the supplied current password does not match.
  public func changePassword(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    caller : Principal.Principal,
    currentPassword : Text,
    newPassword : Text,
  ) : async Bool {
    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.password != currentPassword) { return false };
        profiles.add(caller, { profile with password = newPassword });
        true
      };
      case null { false };
    };
  };

  /// Change the caller's username. Returns false when the caller has no
  /// profile or the new username is already taken by another user. When the
  /// new username equals the caller's current username it is a no-op success.
  public func changeUsername(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    usernames : Map.Map<Text, Principal.Principal>,
    caller : Principal.Principal,
    newUsername : Text,
  ) : async Bool {
    switch (profiles.get(caller)) {
      case (?profile) {
        switch (usernames.get(newUsername)) {
          case (?owner) {
            if (owner == caller) { true } else { false };
          };
          case null {
            usernames.remove(profile.username);
            usernames.add(newUsername, caller);
            profiles.add(caller, { profile with username = newUsername });
            true;
          };
        };
      };
      case null { false };
    };
  };

  /// Set the caller's profile picture (an external-blob reference). Returns
  /// false when the caller has no profile.
  public func setProfilePicture(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    caller : Principal.Principal,
    picture : ?Storage.ExternalBlob,
  ) : async Bool {
    switch (profiles.get(caller)) {
      case (?profile) {
        profiles.add(caller, { profile with profilePicture = picture });
        true
      };
      case null { false };
    };
  };

  /// Toggle whether the caller's account is public (ID shown everywhere) or
  /// private (ID hidden from other users). Returns false when the caller has
  /// no profile.
  public func setVisibility(
    profiles : Map.Map<Principal.Principal, Types.AuthProfile>,
    caller : Principal.Principal,
    isPublic : Bool,
  ) : async Bool {
    switch (profiles.get(caller)) {
      case (?profile) {
        profiles.add(caller, { profile with isPublic = isPublic });
        true
      };
      case null { false };
    };
  };
};
