module {
  public type ConversationId = Nat;
  public type MessageId = Nat;

  public type Conversation = {
    id : ConversationId;
    participantA : Principal;
    participantB : Principal;
    createdAt : Int;
  };

  public type Reaction = {
    author : Principal;
    emoji : Text;
  };

  public type Message = {
    id : MessageId;
    conversationId : ConversationId;
    sender : Principal;
    text : Text;
    replyTo : ?MessageId;
    reactions : [Reaction];
    createdAt : Int;
  };

  public type SendMessageInput = {
    conversationId : ConversationId;
    text : Text;
    replyTo : ?MessageId;
  };

  public type ReactInput = {
    messageId : MessageId;
    emoji : Text;
  };

  public type ChatState = {
    var nextConversationId : Nat;
    var nextMessageId : Nat;
  };
};
