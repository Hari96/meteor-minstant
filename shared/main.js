// methods that provide write access to the data
Meteor.methods({
  insertNewChat: function(otherUserId) {
    Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
  },
  updateChats: function(id, chat) {
    Chats.update(id, chat);
  }
})
