import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/chat";

module {
  public func pairKey(a : Principal, b : Principal) : Text {
    let ta = a.toText();
    let tb = b.toText();
    if (ta < tb) { ta # ":" # tb } else { tb # ":" # ta };
  };

  public func isParticipant(c : Types.Conversation, p : Principal) : Bool {
    c.participantA == p or c.participantB == p;
  };

  public func listConversations(
    caller : Principal,
    conversations : Map.Map<Types.ConversationId, Types.Conversation>,
  ) : [Types.Conversation] {
    conversations.values().toArray().filter(func c = isParticipant(c, caller));
  };

  public func getConversation(
    id : Types.ConversationId,
    conversations : Map.Map<Types.ConversationId, Types.Conversation>,
  ) : ?Types.Conversation {
    conversations.get(id);
  };

  public func getOrCreateConversation(
    a : Principal,
    b : Principal,
    conversations : Map.Map<Types.ConversationId, Types.Conversation>,
    conversationByPair : Map.Map<Text, Types.ConversationId>,
    state : Types.ChatState,
  ) : Types.Conversation {
    let key = pairKey(a, b);
    switch (conversationByPair.get(key)) {
      case (?id) {
        conversations.get(id) ?? Runtime.trap("Conversation missing");
      };
      case null {
        let id = state.nextConversationId;
        state.nextConversationId += 1;
        let conv : Types.Conversation = {
          id;
          participantA = a;
          participantB = b;
          createdAt = Time.now();
        };
        conversations.add(id, conv);
        conversationByPair.add(key, id);
        conv;
      };
    };
  };

  public func listMessages(
    conversationId : Types.ConversationId,
    messages : Map.Map<Types.ConversationId, List.List<Types.Message>>,
  ) : [Types.Message] {
    switch (messages.get(conversationId)) {
      case (?list) { list.toArray() };
      case null { [] };
    };
  };

  public func sendMessage(
    sender : Principal,
    input : Types.SendMessageInput,
    conversations : Map.Map<Types.ConversationId, Types.Conversation>,
    messages : Map.Map<Types.ConversationId, List.List<Types.Message>>,
    state : Types.ChatState,
  ) : Types.Message {
    let conv = conversations.get(input.conversationId) ?? Runtime.trap("Conversation not found");
    if (not isParticipant(conv, sender)) {
      Runtime.trap("Not a participant");
    };
    let id = state.nextMessageId;
    state.nextMessageId += 1;
    let msg : Types.Message = {
      id;
      conversationId = input.conversationId;
      sender;
      text = input.text;
      replyTo = input.replyTo;
      reactions = [];
      createdAt = Time.now();
    };
    switch (messages.get(input.conversationId)) {
      case (?list) { list.add(msg) };
      case null {
        let list = List.empty<Types.Message>();
        list.add(msg);
        messages.add(input.conversationId, list);
      };
    };
    msg;
  };

  func updateReactions(m : Types.Message, caller : Principal, emoji : Text) : Types.Message {
    switch (m.reactions.find(func r = r.author == caller)) {
      case (?r) {
        if (r.emoji == emoji) {
          { m with reactions = m.reactions.filter(func x = not (x.author == caller)) };
        } else {
          { m with reactions = m.reactions.map(func x = if (x.author == caller) { { x with emoji = emoji } } else { x }) };
        };
      };
      case null {
        { m with reactions = m.reactions.concat([{ author = caller; emoji = emoji }]) };
      };
    };
  };

  public func reactToMessage(
    caller : Principal,
    input : Types.ReactInput,
    messages : Map.Map<Types.ConversationId, List.List<Types.Message>>,
  ) : () {
    for (list in messages.values()) {
      list.mapInPlace(func m = if (m.id == input.messageId) { updateReactions(m, caller, input.emoji) } else { m });
    };
  };
};
