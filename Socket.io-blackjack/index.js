var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = [];
var dealer = {
  'total': 0,
};
// list of users
var index = 0;
// card & deck global var
var suits = ['hearts', 'diams', 'clubs', 'spades'];
var ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
var deck = [];

// call when all players are connected
make_deck();

function make_deck() {
  deck = [];
  // suits
  for( var i = 0; i < suits.length; i++ ) {
    // ranks
    for( var j = 0; j < ranks.length; j++ ) {
      // cards
      var card = {};
      card.suit = suits[i];
      card.rank = ranks[j];
      // add card to the deck
      deck.push(card);
    }
  }
}

// function to draw a random card
function draw_card() {
  var card;
  if(deck.length > 0) {
    var rand_index = Math.floor(Math.random() * deck.length );
    card = deck.splice(rand_index, 1)[0];
  }
  return card;
}

// allow use of external files
app.use('/public',express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen( 80 , function(){
  console.log('listening on *:80');
});

io.on('connection', function(socket) {
  // send a message
  socket.on('chat message', function(msg){
    for(var i = 0; i < users.length; i++) {
      if(users[i].socket === socket.id) {
        io.emit('chat message', users[i].name + ': ' + msg);
      }
    }
  });
  
  // add a user (socket id is used to find the user)
  socket.on('add-user', function(data){
    let flag=0;
    if(users.length){
      if(data.password!=users[0].password){
        console.log("Wrong Password");
      }
      else{
       flag=1
      }
    }
    else{
      flag=1
    }
    if(flag===1)
    {
      users.push({
        'name': data.user,
        'password': data.password,
        'socket': socket.id,
        'total': 0,
        'turn': false,
        'bet':1000
      });
      io.emit('connected',socket.id);
      io.emit('hide-dealer-hand');
      io.emit('list-of-users', users)
    }
    else{
      io.emit('disconnected',socket.id);
    }
  });

  // turn based control
  socket.on('game-control', function() {
    for(var i = 0; i < users.length; i++) {
      // find the current player
      if(users[index].socket != socket.id) {
        // if it is not the current players turn disable buttons
        users[i].turn = false;
        socket.emit('user-turn', users[i].turn);
      }
    }
  }); 
  
  socket.on('deal-dealer', function() {
    if (dealer.total < 17) {
      var card = draw_card();
      if(card) {
        // make card
        io.emit('make-dealer-card',{'suit': card.suit, 'rank': card.rank});
        // adds up the users current total
        switch (card.rank) {
          case 'J':
          case 'Q':
          case 'K':
          dealer.total += 10;
          break;
          case 'A':
          if (dealer.total < 11) {
            dealer.total += 11;
            break;
          } else {
            dealer.total += 1;
            break;
          }
          default:
          dealer.total += card.rank;
        }
      }
      io.emit('d_score', dealer.total);
      io.emit('hide-dealer-hand');
    };
  });
  
  socket.on('hit', function() {
    var card = draw_card();
    if(card) {
      // make card
      socket.emit('make-card',{'suit': card.suit, 'rank': card.rank});
      // adds up the users current total
      switch (card.rank) {
        case 'J':
        case 'Q':
        case 'K':
        users[index].total += 10;
        break;
        case 'A':
        if (users[index].total < 11) {
          users[index].total += 11;
          break;
        } else {
          users[index].total += 1;
          break;
        }
        default:
        users[index].total += card.rank;
      }
      socket.emit('score', users[index].total);
    } else {
      socket.emit('empty-deck');
    }
  });
  
  // checks if dealer has 21
  socket.on('test-score', function() {
    if(dealer.total == 21) {
      for(var i = 0; i < users.length; i++) {
        socket.emit('stand-button');
      }
    }
  });
  socket.on('gameOver',function(){
    users=[];
    socket.emit('reset');
  })
  // moves to the next user
  socket.on('stand-button', function() {
    if (users[index+1] == undefined) {
      // reset to first user
      index = 0;
      io.emit('display-new-game',users);
      io.emit('user-turn', false);
      var win={name:'dealer',socket:0};
      let max=0;
      for(var i = 0; i < users.length; i++) {
        if (users[i].total <= 21 && (users[i].total > dealer.total||dealer.total>21)) {
          if(users[i].total>max){max=users[i].total;win=users[i];}
        }
        io.emit('winner', win.name);
    for(let i in users)
    {
      if(users[i].socket===win.socket){users[i].bet=(users.length+1)*(1000)}
      else{users[i].bet=0;}
      io.emit('yourBet',users[i]);
    }
        io.emit('show-dealer-hand');
          io.emit('gameOver');
      }
      // io.to(users[index].socket).emit('user-turn', true);
    } else {
      index++;
      users[index].turn = true;
      io.to(users[index].socket).emit('user-turn', true);
    }
  });
  // reset game
  socket.on('reset', function(reset){
    // so the deck does not empty
    make_deck();
    dealer.total = 0;
    for(var i = 0; i < users.length; i++) {
      users[i].total = 0;
    }
  });

  // user disconnects
  socket.on('disconnect', function() {
    for(var i = 0; i < users.length; i++) {
      if(users[i].socket === socket.id) {
        io.emit('chat message', users[i].name + ' has rage quit!');
        io.emit('Restarted');
      }
    } 
  });
});