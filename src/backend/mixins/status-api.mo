import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";
import StatusLib "../lib/status";
import Types "../types/status";

mixin (
  accessControlState : AccessControl.AccessControlState,
  statuses : Map.Map<Nat, Types.Status>,
  state : { var nextStatusId : Nat },
) {
  /// Posts a status/note as the caller. `text` must be non-empty and at most
  /// 280 characters. `image` is an optional external-blob reference produced by
  /// the object-storage extension.
  public shared ({ caller }) func addStatus(text : Text, image : ?Storage.ExternalBlob) : async Types.Status {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can post statuses");
    };
    StatusLib.addStatus(statuses, state, caller, text, image);
  };

  /// Returns a user's statuses/notes, newest first.
  public query ({ caller }) func listStatusesByAuthor(author : Principal) : async [Types.Status] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view statuses");
    };
    StatusLib.listStatusesByAuthor(statuses, author);
  };

  /// Deletes one of the caller's own statuses/notes.
  public shared ({ caller }) func deleteStatus(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete statuses");
    };
    StatusLib.deleteStatus(statuses, id, caller);
  };
};
