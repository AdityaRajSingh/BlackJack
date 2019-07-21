var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
var dealer = {
  'total': 0,
};

var index = 0;

var suits = ['hearts', 'diams', 'clubs', 'spades'];
var ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
var deck = [];


make_deck();

function make_deck() {
  deck = [];
  
  for( var i = 0; i < suits.length; i++ ) {
    
    for( var j = 0; j < ranks.length; j++ ) {
      
      var card = {};
      card.suit = suits[i];
      card.rank = ranks[j];
      
      deck.push(card);
    }
  }
}


function draw_card() {
  var card;
  if(deck.length > 0) {
    var rand_index = Math.floor(Math.random() * deck.length );
    card = deck.splice(rand_index, 1)[0];
  }
  return card;
}


app.use('/public',express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(process.env.PORT || 80, function(){
  console.log('listening on *:80');
});

io.on('connection', function(socket) {
  
  socket.on('chat message', function(msg){
    for(var i = 0; i < users.length; i++) {
      if(users[i].socket === socket.id) {
        if(msg==="")msg=" has a bet of $"+users[i].bet+"</b>";
        else msg=":</b> "+msg;
        io.emit('chat message new', "<b>"+users[i].name + msg);
      }
    }
  });
  
  
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
        'bet':data.bet
      });
      io.emit('connected',socket.id);
      io.emit('hide-dealer-hand');
      io.emit('list-of-users', users)
    }
    else{
      io.emit('disconnected',socket.id);
    }
  });

  
  socket.on('game-control', function() {
    for(var i = 0; i < users.length; i++) {
      
      if(users[index].socket != socket.id) {
        
        users[i].turn = false;
        socket.emit('user-turn', users[i].turn);
      }
    }
  }); 
  
  socket.on('deal-dealer', function() {
    if (dealer.total < 17) {
      var card = draw_card();
      if(card) {
        
        io.emit('make-dealer-card',{'suit': card.suit, 'rank': card.rank});
        
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
      
      socket.emit('make-card',{'suit': card.suit, 'rank': card.rank});
      
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
  
  socket.on('stand-button', function() {
    io.emit('chat message new',"<b>"+users[index].name+" has a score of "+users[index].total+"</b>");
    if (users[index+1] == undefined) {
      
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
        let sum=0;
        let j;
    for(let i in users)
    {
      sum+=parseInt(users[i].bet);
      if(users[i]===win){j=i;}
      else{io.emit('yourBet',{user:users[i],bet:parseInt(users[i].bet)*(-1)})
    }
    if(j){
      io.emit('yourBet',{user:users[j],bet:sum});
    }
    else{
     if(index==users.length-1) io.emit('dealer-won',sum);
    }
        io.emit('show-dealer-hand');
          io.emit('gameOver');
      }
     }
     } else {
      index++;
      users[index].turn = true;
      io.to(users[index].socket).emit('user-turn', true);
    }
  });
  
  socket.on('reset', function(reset){
    
    make_deck();
    dealer.total = 0;
    for(var i = 0; i < users.length; i++) {
      users[i].total = 0;
    }
  });

  
  socket.on('disconnect', function() {
    for(var i = 0; i < users.length; i++) {
      if(users[i].socket === socket.id) {
        io.emit('chat message', users[i].name + ' has rage quit!');
        io.emit('Restarted');
      }
    } 
  });
});