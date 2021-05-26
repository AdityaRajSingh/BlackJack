var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const path = require('path');
const { disconnect } = require('process');
const {userJoin,getCurrentUser,userLeaves,getRoomUsers} = require('./utils/users')
var rooms=[];
const suits = ['hearts', 'diams', 'clubs', 'spades'];
const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];

app.use(express.static(path.join(__dirname,'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(process.env.PORT || 8080, function(){
  console.log('listening on *:8080');
});


// Socket Connections

//Waiting Room Setup

io.on('connection',(socket)=>
{
  
    socket.on('joinRoom',({username,roomid,bidamt,type})=>
    {
      //New User Creation
        const user= userJoin(socket.id,username,roomid,bidamt,type);
        socket.join(user.roomid);
        console.log(username,' Joined Room:',user.roomid);


        //Send Users and Room Info
        io.to(user.roomid).emit('roomUsers',
        {
            roomid:user.roomid,
            users:getRoomUsers(user.roomid)
        });

       
      //Draw Card Function
      function draw_card(roomindex) {
        var card;
        if(!rooms[roomindex])console.log("Room not found while drawing");
        if(rooms[roomindex].deck.length > 0) {
          var rand_index = Math.floor(Math.random() * rooms[roomindex].deck.length );
          card = rooms[roomindex].deck.splice(rand_index, 1)[0];
        }
        return card;
      }

      socket.on('chat message', function(msg){
        let roomindex=rooms.findIndex(room=>room.roomid===roomid);
        for(var i = 0; i < rooms[roomindex].users.length; i++) {
          if(rooms[roomindex].users[i].socket === socket.id) {
            if(msg==="")msg=" has a bet of $"+rooms[roomindex].users[i].bet+"</b>";
            else msg=":</b> "+msg;
            io.to(roomid).emit('chat message new', "<b>"+rooms[roomindex].users[i].name + msg);
          }
        }
      });



      socket.on('hit', function() {
        let roomindex=rooms.findIndex(room=>room.roomid===roomid);
        if(roomindex===-1){return console.log("Room not found on hit");}
      
        var card = draw_card(roomindex);
        if(card) {
          socket.emit('make-card',{'suit': card.suit, 'rank': card.rank});
          
          switch (card.rank) {
            case 'J':
            case 'Q':
            case 'K':
              rooms[roomindex].users[rooms[roomindex].index].total += 10;
            break;
            case 'A':
            if (rooms[roomindex].users[rooms[roomindex].index].total < 11)
            {
              rooms[roomindex].users[rooms[roomindex].index].total += 11;
              break;
            } 
            else 
            {
              rooms[roomindex].users[rooms[roomindex].index].total += 1;
              break;
            }
            default:
              {
              rooms[roomindex].users[rooms[roomindex].index].total += card.rank;
              }
          }
          //emit Score to User
          socket.emit('score', rooms[roomindex].users[rooms[roomindex].index].total);
        }
        else 
        {
          socket.emit('empty-deck');
        }
      });


      socket.on('stand-button', function() {
        let roomindex=rooms.findIndex(room=>room.roomid===roomid);
        if(roomindex===-1){return console.log("Room not found on stand");}
        io.to(roomid).emit('chat message new',"<b>"+rooms[roomindex].users[rooms[roomindex].index].name+" has a score of "+rooms[roomindex].users[rooms[roomindex].index].total+"</b>");
        //last User show New Game
        if (rooms[roomindex].users[rooms[roomindex].index+1] === undefined) 
        {
          io.to(roomindex).emit('user-turn',false);
          //result start
          let win={name:'dealer',socket:0};
          let max=0;
          for(var i = 0; i < rooms[roomindex].users.length; i++) 
          {
            if (rooms[roomindex].users[i].total <= 21 && (rooms[roomindex].users[i].total > rooms[roomindex].dealer.total || rooms[roomindex].dealer.total>21)) 
            {
              if(rooms[roomindex].users[i].total>max)
              {
                max=rooms[roomindex].users[i].total;
                win=rooms[roomindex].users[i];
              }
            }
          }
            io.to(roomid).emit('winner', win.name);

            //Show Individual Profit/Loss;
            let sum=0;
            let winnerIndex;
        for(let i in rooms[roomindex].users)
        {
          sum+=parseInt(rooms[roomindex].users[i].bet);
          if(rooms[roomindex].users[i]===win)
            winnerIndex=i;
          else
          {
            io.to(roomid).emit('yourBet',
            {
              user:rooms[roomindex].users[i],
              bet:parseInt(rooms[roomindex].users[i].bet)*(-1)
            })
          }
        }

        if(winnerIndex)
        {
          io.to(roomid).emit('yourBet',
          {
            user:rooms[roomindex].users[winnerIndex],
            bet:sum
          });
        }
        else
        {
          io.to(roomid).emit('dealer-won',sum);
        }

          io.to(roomid).emit('show-dealer-hand');
          io.to(roomid).emit('gameOver');
          //result end
        }
        else 
        {
          rooms[roomindex].users[rooms[roomindex].index].turn=false;
          io.to(rooms[roomindex].users[rooms[roomindex].index].socket).emit('user-turn', false);
          rooms[roomindex].index++;
          rooms[roomindex].users[rooms[roomindex].index].turn = true;
          io.to(rooms[roomindex].users[rooms[roomindex].index].socket).emit('user-turn', true);
        }
      });
            
      //Start Game
      socket.on('startGame',({username,roomid,type})=>
      {
        rooms.push(
          {
            roomid:roomid,
            users:[],
            dealer:{'total':0},
            index:0,
            deck:[]
          });
        
        let roomindex=rooms.findIndex(room=>room.roomid===roomid);     
        if(roomindex===-1)console.log("Room not found in Game started"); 

        let roomusers=getRoomUsers(roomid);
        for(let data of roomusers)
        {
          rooms[roomindex].users.push({
          'name': data.username,
          'password': data.roomid,
          'socket': data.id,
          'total': 0,
          'turn': false,
          'bet':data.bidamt
          });
        }
        console.log(rooms[roomindex]);


        io.to(roomid).emit('user-turn',false);
        
        io.to(rooms[roomindex].users[0].socket).emit('user-turn',true);


        make_deck();
        function make_deck() {
        rooms[roomindex].deck = [];

        for( var i = 0; i < suits.length; i++ ) {
          
          for( var j = 0; j < ranks.length; j++ ) {
            
            var card = {};
            card.suit = suits[i];
            card.rank = ranks[j];
            rooms[roomindex].deck.push(card);
          }
        }
        }


        io.to(roomid).emit('hide-dealer-hand');
        io.to(roomid).emit('list-of-users', rooms[roomindex].users)
        io.to(roomid).emit("gameStarted");



        socket.on('deal-dealer', function() 
        {
          if (rooms[roomindex].dealer.total < 17) {
            var card = draw_card(roomindex);
            if(card) {
              
              io.to(roomid).emit('make-dealer-card',{'suit': card.suit, 'rank': card.rank});
              
              switch (card.rank) {
                case 'J':
                case 'Q':
                case 'K':
                rooms[roomindex].dealer.total += 10;
                break;
                case 'A':
                if (rooms[roomindex].dealer.total < 11) {
                  rooms[roomindex].dealer.total += 11;
                  break;
                } else {
                  rooms[roomindex].dealer.total += 1;
                  break;
                }
                default:
                  rooms[roomindex].dealer.total += card.rank;
              }
            }
            io.to(roomid).emit('d_score', rooms[roomindex].dealer.total);
            io.to(roomid).emit('hide-dealer-hand');
          };
        });
      //Broadcast when a user disconnects
        socket.on('disconnect',()=>
        {
            const user= userLeaves(socket.id);
            
            if(user)
            {
            //io.to(user.roomid).emit('message',formatMessage(chatBot,`${user.username} left the chat`));
            io.to(user.roomid).emit('roomUsers',
            {
                roomid:user.roomid,
                users:getRoomUsers(user.roomid)
            });
            }
        })
      })
    })
    //Broadcast when a user disconnects
    socket.on('disconnect',()=>
    {
        console.log('User Disconnected');
        const user= userLeaves(socket.id);
        
        if(user)
        {
          io.to(user.roomid).emit('roomUsers',
          {
              roomid:user.roomid,
              users:getRoomUsers(user.roomid)
          });
        }
        
    })
})