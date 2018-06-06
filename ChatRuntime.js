const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv4 = require('uuid/v4');
const Database = require('better-sqlite3');
const db = new Database('database.db');
const schedule = require('node-schedule');

function User(obj, socket){ 
  this.socket = socket; 
  this.user = obj;
}

function ChatRuntime() 
{ 
  this.users = [];

  this.setup = function() {

    var self = this;

    var stmt = db.prepare("DROP TABLE IF EXISTS messages");
    stmt.run();

    var stmt = db.prepare("CREATE TABLE IF NOT EXISTS messages (chatId INTEGER, senderId INTEGER, message TEXT, type TEXT, read INTEGER, date TEXT)");
    stmt.run();

    var j = schedule.scheduleJob('* * 0 * * *', function(){
      var d = new Date();
      d.setDate(d.getDate()-30);
      var stmt = db.prepare('DELETE FROM messages WHERE date < DateTime($d)');
      stmt.run({
        $d: d.toISOString(),
      });
      // console.log('Removed all messages older than 30 days');
    });

    io.on('connection', function(client){
      var user; 
      client.on('authenticate', function(data){
        user = data;
        self.userConnected(data, client);  
      });
      client.on('disconnecting', function(){
        self.userDisconnected(user, client);
      });
      client.on('sent_message', function(data){
        self.userSentMessage(user, client, data);
      });
    });

    http.listen(3000, function(){

    });
  }
  this.userConnected = function(user, socket) {
    // console.log('user ' + user.user_id + ' authenticated')
    user.status = 'online';
    const usr = new User(user, socket);

    var userIndex = this.users.find(x => x.user.user_id == user.user_id);
    var i = this.users.indexOf(userIndex);
    if(i == -1){
      this.users.push(usr);
    } else{
      this.users.splice(i, 1, usr);
    }

    if(user.type == 'doctor'){
      var patients = this.users.filter(  
        function (value) {  
          return (value.user.type === 'patient' && value.user.mappedDoctor.user_id === user.user_id);  
        }  
      );  

      patients.forEach((patient) => {
        socket.join(patient.user.user_id, () => {
          io.to(patient.user.user_id).emit('user_joined', {
            user: user,
            room: this.getRoom(patient.user.user_id)
          });
        });
      });

    } else if(user.type == 'patient'){
    
      socket.join(user.user_id, () => {
        io.to(user.user_id).emit('user_joined', {
          user: user,
          room: this.getRoom(user.user_id)
        });
      });

      const doctor = this.users.find(x => x.user.user_id === 1)

      if(doctor != undefined){
        doctor.socket.join(user.user_id, () => {
          io.to(user.user_id).emit('user_joined', {
            user: doctor.user,
            room: this.getRoom(user.user_id)
          })
        });
      }

    }
  }
  this.userDisconnected = function(user, socket) {
    if(user == undefined) { return }
    // console.log('user ' + user.user_id + ' disconnecting')
    user.status = 'offline';

    var rooms = Object.keys(socket.rooms);
    rooms.forEach((roomId) => {
      socket.leave(roomId, () => {
        var room = this.getRoom(roomId);
        io.to(roomId).emit('user_left', {
          user: user,
          room: room
        });
      });
    });
  }
  this.userSentMessage = function(user, socket, message) {

    message.date = new Date();

    // console.log('message received ' + message.message + ' from user ' + user.user_id + ' on channel ' + message.chatId);
    var stmt = db.prepare("INSERT INTO messages(chatId, senderId, message, type, read, date) VALUES ($ci, $si, $m, $t, $r, $d)")
    stmt.run({ ci: message.chatId,
      si: message.sender.user_id,
      m: message.message,
      t: message.type,
      r: 0,
      d: message.date.toISOString()
    });
    // console.log('sending message');
    io.to(message.chatId).emit('new_message', {
      chatId: message.chatId,
      sender: message.sender,
      message: message.message,
      type: message.type,
      read: false,
      date: message.date
    });
  }
  this.getUsersWithoutSocket = function(users){
    let result = []
    users.forEach(function(v){ 
      result.push(v.user);
    });
    // console.log(result);
    return result;
  }
  this.getRoom = function(id){
    var room = io.sockets.adapter.rooms[id];
    if(room == undefined){ return room; }

    var patient = this.users.find(x => x.user.user_id == id);
    var doctor = this.users.find(x => x.user.user_id == patient.user.mappedDoctor.user_id);

    return {
      id: id,
      doctor: patient.user.mappedDoctor,
      patient: patient.user,
      messages: this.getMessages(id),
    }
  }
  this.getRooms = function (){
    var result = [];
    Object.keys(io.sockets.adapter.rooms).forEach(x => {
      result.push(this.getRoom(x));
    });
    return result;
  }
  this.getMessages = function (id = 0){
    var result;
    if(id == 0){
      var stmt = db.prepare('SELECT * FROM messages');
      var result = stmt.all();
    }else{
      var stmt = db.prepare('SELECT * FROM messages WHERE chatId = ?');
      var result = stmt.all(id);
    }
    result.forEach((message) => {
      var user = this.users.find(x => x.user.user_id == message.senderId);
      message.sender = user.user;
    });
    return result;
  }
}

module.exports = new ChatRuntime();
