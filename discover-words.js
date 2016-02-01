Games = new Mongo.Collection("games");

if (Meteor.isClient) {
  Meteor.subscribe("games");

  Template.body.helpers({
    nbrRuningGames: function() {
      return Games.find().count();
    },
    games: function() {
      return Games.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.join_game.events({
    "click .join-game": function(event) {
      Meteor.call("joinGame");
    }
  });

  Template.game.events({
    "click .delete-game": function(event) {
      Meteor.call("deleteGame", this._id);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("games", function() {
    return Games.find();
  });

  Meteor.methods({
    deleteGame: function(game_id) {
      if(!Meteor.userId())
        throw new Meteor.Error('not-authorized');

      Games.remove(game_id);
    },
    joinGame: function() {
      if(!Meteor.userId())
        throw new Meteor.Error('not-authorized');

      // Find a game where one player's missing
      // \todo make only one query, not 2, with a sql OR
      var free_game = Games.findOne({
        $and: [
          {player1: {$ne: null}},
          {player1: {$ne: Meteor.userId()}},
          {player2: {$eq: null}}
        ]
      });
      if(!free_game) {
        free_game = Games.findOne({
        $and: [
          {player1: {$eq: null}},
          {player2: {$ne: null}},
          {player2: {$ne: Meteor.userId()}}
        ]
      });
      }

      if(free_game) {
        console.log("Player " + Meteor.userId() + " joining game " + free_game._id);
        // Joinin as player 1
        if( !free_game.player1 )
          Games.update(free_game._id, { $set: {player1: Meteor.userId()} });
        else // joining as player 2
          Games.update(free_game._id, { $set: {player2: Meteor.userId()} });
      }
      else {
        var new_game = Games.insert({
          player1: Meteor.userId(),
          player2: null,
          createdAt: new Date()
        });
        console.log("Player " + Meteor.userId() + " creating new game: " + new_game._id);
      }
    }
  });
}
