import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/chat";
import ChatLib "../lib/chat";

mixin (
  accessControlState : AccessControl.AccessControlState,
  conversations : Map.Map<Types.ConversationId, Types.Conversation>,
  conversationByPair : Map.Map<Text, Types.ConversationId>,
  messages : Map.Map<Types.ConversationId, List.List<Types.Message>>,
  state : Types.ChatState,
) {
  public query ({ caller }) func listConversations() : async [Types.Conversation] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    ChatLib.listConversations(caller, conversations);
  };

  public query ({ caller }) func listMessages(conversationId : Types.ConversationId) : async [Types.Message] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let conv = ChatLib.getConversation(conversationId, conversations) ?? Runtime.trap("Conversation not found");
    if (not ChatLib.isParticipant(conv, caller)) {
      Runtime.trap("Not a participant");
    };
    ChatLib.listMessages(conversationId, messages);
  };

  public shared ({ caller }) func getOrCreateConversation(other : Principal) : async Types.Conversation {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    ChatLib.getOrCreateConversation(caller, other, conversations, conversationByPair, state);
  };

  public shared ({ caller }) func sendMessage(input : Types.SendMessageInput) : async Types.Message {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    ChatLib.sendMessage(caller, input, conversations, messages, state);
  };

  public shared ({ caller }) func reactToMessage(input : Types.ReactInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    ChatLib.reactToMessage(caller, input, messages);
  };
};
