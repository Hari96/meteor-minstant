Meteor.subscribe("chats");
Meteor.subscribe("userData");
// set up the main template the the router will use to build pages
Router.configure({
  layoutTemplate: 'ApplicationLayout'
});
// specify the top level route, the page users see when they arrive at the site
Router.route('/', function () {
  this.render("navbar", {to:"header"});
  this.render("welcome_page", {to:"main"});
});
// specify a route too get to main start page
Router.route('home', function() {
  this.render("navbar", {to:"header"});
  this.render("lobby_page", {to:"main"});
});

// specify a route that allows the current user to chat to another users
Router.route('/chat/:_id', function () {
  if (!Meteor.user()) {
    this.render("navbar", {to:"header"});
    this.render("not_logged_in", {to:"main"});
  }
  else {
  // the user they want to chat to has id equal to
  // the id sent in after /chat/...
  var otherUserId = this.params._id;
  Session.set("otherUserId", otherUserId);
  // find a chat that has two users that match current user id
  // and the requested user id
  var filter = {$or:[
              {user1Id:Meteor.userId(), user2Id:otherUserId},
              {user2Id:Meteor.userId(), user1Id:otherUserId}
              ]};
  var chat = Chats.findOne(filter);
  if (!chat){// no chat matching the filter - need to insert a new one
    //chatId = Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    var chatId = Meteor.call("insertNewChat", otherUserId);
  }
  else {// there is a chat going already - use that.
    chatId = chat._id;
  }
  if (chatId){// looking good, save the id to the session
    Session.set("chatId",chatId);
    // prevents blank emoticon image appearing if user begins by not choosing an emoticon
    Session.set("eId", 0);
  }
  this.render("navbar", {to:"header"});
  this.render("chat_page", {to:"main"});
}
});

///
// helper functions
///
Template.available_user_list.helpers({
  users:function(){
    return Meteor.users.find();
  }
})
Template.available_user.helpers({
  getUsername:function(userId){
    user = Meteor.users.findOne({_id:userId});
    return user.profile.username;
  },
  isMyUser:function(userId){
    if (userId == Meteor.userId()){
      return true;
    }
    else {
      return false;
    }
  }
})


Template.chat_page.helpers({
  messages: function() {
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (!chat.messages) {
      return "";
    }
    var userName = [], messageArr = [];
    var avatar = []; emoticonArr = [];
    for (var j = 0; j < chat.users.length; j++) {
      userName[j] = Meteor.users.findOne({_id: chat.users[j].user}).profile.username;
      avatar[j] = Meteor.users.findOne({_id: chat.users[j].user}).profile.avatar;
    }
    for (var i = 0; i < chat.messages.length; i++) {
      messageArr[i] = { avatar: avatar[i], user: userName[i], msg: chat.messages[i].text, em: chat.emoticons[i].eUrl};
    }
    return messageArr;
  },
  chatee: function() {
    var otherUserId = Session.get("otherUserId");
    var otherUser = Meteor.users.findOne({_id: otherUserId}).profile.username;
    return otherUser;
  }
})

Template.emoticon_table.helpers( {
  emoticons: function() {
var estring = '<tr>';
for (var i = 1; i < 11; i++) {
  estring += '<td><button id = "' + i + '"><img src = "/' + i + '.gif" id = "' + i + '" /></button></td>';
}
estring += '</tr><tr>';
for (var i = 11; i < 21; i++) {
  estring += '<td><button id = "' + i + '"><img src = "/' + i + '.gif" id = "' + i + '" /></button></td>';
}
estring += '</tr><tr>';
for (var i = 21; i < 31; i++) {
  estring += '<td><button id = "' + i + '"><img src = "/' + i + '.gif" id = "' + i + '" /></button></td>';
}
estring += '</tr><tr>';
for (var i = 31; i < 41; i++) {
  estring += '<td><button id = "' + i + '"><img src = "/' + i + '.gif" id = "' + i + '" /></button></td>';
}
estring += '</tr><tr>';
for (var i = 41; i < 51; i++) {
  estring += '<td><button id = "' + i + '"><img src = "/' + i + '.gif" id = "' + i + '" /></button></td>';
}
estring += '</tr>';
return estring;
}
})

//events

Template.chat_page.events({
// this event fires when the user sends a message on the chat page
'submit .js-send-chat':function(event) {
  // stop the form from triggering a page reload
  event.preventDefault();
  // see if we can find a chat object in the database
  // to which we'll add the message
  var chat = Chats.findOne({_id:Session.get("chatId")});
  if (chat){// ok - we have a chat to use
    var msgs = chat.messages; // pull the messages property
    var userArr = chat.users; // pull matching users (Bob)
    var emoticonArr = chat.emoticons; // pull matching emoticons
    if (!msgs){// no messages yet, create a new array
      msgs = [];
      userArr = []; // new array containing users to matcheach message (Bob)
      emoticonArr = []; // new array containing emoticons to matcheach message (Bob)
    }
    var dest = document.getElementById("emoticon");
    dest.innerHTML = "";
    // push adds the message to the end of the array
    msgs.push({text: event.target.chat.value});
    userArr.push({user: Meteor.user()._id});// push adds user to end of user array (Bob)
    var emoticonId = Session.get("eId"); // gets emoticonId from Template.emoticon_table.events
    if (emoticonId == 0) {
      emoticonArr.push({eUrl: ""});
    }
    else {
      emoticonArr.push({eUrl: '<img src = "/' + emoticonId + '.gif" id ="em">'});
    }
    // reset the form
    event.target.chat.value = "";
    // reset emoticon
    Session.set("eId", 0);
    // put the messages array onto the chat object
    chat.messages = msgs;
    chat.users = userArr; //put user Array into chat object(Bob)
    chat.emoticons = emoticonArr; //put emoticon Array into chat object(Bob)
    // delete old messages if more than 10 messages in array
    if (chat.messages.length > 10) {
      chat.messages.shift();
      chat.users.shift();
      chat.emoticons.shift();
    }
    Meteor.call("updateChats", chat._id, chat);
  }
}
})

Template.emoticon_table.events({
'click .js-choose-emoticon': function(event) {
  var target = event.target;
  var icon = target.id;
  var dest = document.getElementById("emoticon");
  if (icon == 10) {
    dest.innerHTML = "";
    icon = 0;
  }
  else {
    dest.innerHTML = '<img src = "/' + icon + '.gif" />';
  }
  Session.set("eId", icon);
}
})
