import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/status";

module {
  /// Maximum number of characters allowed in a status/note.
  public let maxTextLength : Nat = 280;

  /// Creates a new status/note for the author. The text must be non-empty and
  /// at most 280 characters.
  public func addStatus(
    statuses : Map.Map<Nat, Types.Status>,
    state : { var nextStatusId : Nat },
    author : Principal,
    text : Text,
    image : ?Storage.ExternalBlob,
  ) : Types.Status {
    if (text.size() == 0) {
      Runtime.trap("Status text must not be empty");
    };
    if (text.size() > maxTextLength) {
      Runtime.trap("Status text must be at most 280 characters");
    };
    let status : Types.Status = {
      id = state.nextStatusId;
      author;
      text;
      image;
      createdAt = Time.now();
    };
    statuses.add(status.id, status);
    state.nextStatusId += 1;
    status;
  };

  /// Returns a user's statuses/notes, newest first.
  public func listStatusesByAuthor(
    statuses : Map.Map<Nat, Types.Status>,
    author : Principal,
  ) : [Types.Status] {
    let mine = statuses.values().toArray().filter(func s = s.author == author);
    mine.sort(func (a, b) =
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else { #equal }
    );
  };

  /// Deletes a status/note. Only its author may delete it.
  public func deleteStatus(
    statuses : Map.Map<Nat, Types.Status>,
    id : Nat,
    caller : Principal,
  ) : () {
    let status = statuses.get(id) ?? Runtime.trap("Status not found");
    if (status.author != caller) {
      Runtime.trap("Unauthorized: Only the author can delete this status");
    };
    statuses.remove(id);
  };
};
