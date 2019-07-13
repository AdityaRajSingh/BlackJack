var socket = io();
var hand = [''];
var x = 0;
// hide the login form
$('.login').on('submit', function() {
  $('#new').hide();
  // get user name and send it to server
  var user = $('#name').val();
  var password= $('#password').val();
  socket.emit('add-user', {user:user,password:password});
  socket.emit('game-control');
  $('#user').text(user); 
});
var the_reveal = $('.the-reveal');
var socket = io();
socket.on('connected',function(data){
  if(socket.id===data){
   $('.login').remove();
the_reveal.show();
var bj=document.getElementById("bj");
document.body.style.backgroundImage="url('https://sironatherapeutichorsemanship.files.wordpress.com/2017/09/plain-green-background-wallpaper-3.jpg')";
bj.style.color="black";
var img=document.createElement("img");
img.setAttribute("src","public/images/Playing-Cards/A_of_spades_plain.png");
img.className="smallest";
var img1=document.createElement("img");
img1.setAttribute("src","public/images/Playing-Cards/A_of_spades_plain.png");
img1.className="smallest";
bj.prepend(img1);
bj.appendChild(img);
}
})
socket.on('disconnected',function(data){
  if(socket.id===data){
  alert("Wrong Password");
}
})
// reveal blackjack page
$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});


// lists a newly connected user
socket.on('list-of-users', function(data) {
  console.log(data);
  var player_list = '';
  $('#players').html('');
  for(var i = 0; i < data.length; i++) {
    player_list += '<b>' + data[i].name + ' </b>';
    if(i!==data.length-1)player_list+=", ";
  }
  $('#players').html(player_list);
});

// append chat messages to <li>
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg));
  window.scrollTo(0, document.body.scrollHeight);
});

// deal dealer
$(document).ready(function() {
  for(var i = 0; x < 20; x++) {
    socket.emit('deal-dealer');
  }
  socket.emit('test-dealer-score');

});
// display users score
socket.on('score', function(data) {
  $('#score').html('');
  $('#score').html('Your score: '+data);
  if (data > 21) {
    $('#score').html('');
    $('#score').html('Your score: '+data + ' <b> bust!</b>');
    $('#stand').trigger('click');
  }
  if (data == 21) {
    $('#score').html('Your score: '+data + ' <b>BlackJack!</b>');
    $('#stand').trigger('click');
  }
});

//display  dealers score
socket.on('d_score', function(data) {
  $('#d_score').html('');
  $('#d_score').html('Dealer score: '+data);
  if (data > 21) {
    $('#d_score').html('');
    $('#d_score').html('Dealer score: '+ data + ' <b>bust!</b>');
  }
  if (data == 21) {
    $('#d_score').html('Dealer score: '+data + ' <b>BlackJack!</b>');
  }
});

// buttons

$('#stand').click(function() {
  socket.emit('stand-button');
  socket.emit('game-control');
  $('#stand').prop("disabled", true);
});

// not used, originally the deck had only 52 cards
// and server would have to be restarted
socket.on('empty-deck', function() {
  $('#winner').html('<b>There are no more cards available...(52 used) Restart the server</b>')
});

socket.on('winner', function(data) {
  var winner = data;
  $('#winner').html('');
  if (data == 'dealer') {
    $('#d_score').show();
    winner = 'The <b>Dealer</b> has won!'
    $('#winner').append(winner);
  }
  else {
    $('#d_score').show();
    winner = '<b>' +data +' </b> wins with the best hand!'
    $('#winner').append(winner);
  }
});
socket.on('yourBet',function(data){
    if(socket.id===data.socket){
      let bet;
      if(data.bet!==0)
       bet='Congrats '+data.name+', you have won <b>$'+data.bet+'</b> in this game!';
       else
       bet="Sorry "+data.name+", you have lost the bet!";
      $("#user").html(bet);
    }
})
socket.on('user-turn', function(turn) {
  if (turn == false) {
    $('#hit').prop("disabled", true);
    $('#stand').prop("disabled", true);
    console.log('buttons disabled');
  }
  if (turn == true) {
    $('#hit').prop("disabled", false);
    $('#stand').prop("disabled", false);
    console.log('buttons enabled');
  }
});

socket.on('display-new-game', function (data) {
 if(socket.id===data[0].socket) $('#new').show();
  socket.emit('gameOver');
});

$('#new').click(function() {
  location.reload(true);
  socket.emit('reset');
});

// create dealer cards
socket.on('make-dealer-card', function(data) {
  make_dealer_card(data.suit, data.rank);
});
let count=0;
function make_dealer_card(suit, rank) {
  var card = document.getElementById("dealerCard");
  var img=document.createElement("img");
  img.id="img"+(count++);
  img.className="small";
  if(suit==="diams")suit="diamonds";
  img.setAttribute("src",'public/images/Playing-Cards/'+rank+'_of_'+suit+'.png');
  console.log("Dealer got "+suit+rank);
  card.appendChild(img);
}

socket.on('hide-dealer-hand', function() {
 for(let y=1;y<count;y++) $('#img'+y).hide();
 $("#d_score").hide();
});
socket.on('show-dealer-hand', function() {
  for(let y=0;y<count;y++) $('#img'+y).show();
  $("#d_score").show();
 });
// draw plyer card
$('#hit').click(function() {
  socket.emit('hit');
});

socket.on('make-card', function(data) {
  make_card(data.suit, data.rank);
});

function make_card(suit, rank) {
  var card = document.getElementById("player");
  var img=document.createElement("img");
  img.className="small";
  if(suit==="diams")suit="diamonds";
  img.setAttribute("src",'public/images/Playing-Cards/'+rank+'_of_'+suit+'.png');
  console.log("Player got "+suit+rank);
  card.appendChild(img);
}
socket.on('restarted',function()
{
  the_reveal.hide();
  socket.emit('')
})