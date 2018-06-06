#!/usr/bin/env node
const runtime = require('./ChatRuntime'); 
runtime.setup();
require('draftlog').into(console)

var cListening = console.draft();
var cCount = console.draft();
var iLoad = 0;
var loader = ['◜', '◝', '◞', '◟']
setInterval( () => {
  cCount('Online users : ', runtime.users.filter(  
                                            function (value) {    
                                              return (value.user.status === 'online');  
                                            }).length, 
          ' | Online rooms : ', runtime.getRooms.length, 
          ' | Total messages : ', runtime.getMessages().length);
  cListening(loader[iLoad], ' Listening on *:3000');
  iLoad++;
  if(iLoad > 3){ iLoad = 0; }
}, 500)

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function (cmd) {
  
  switch(cmd) {
      case 'user_count':
        console.log('active users: ' + (runtime.users.filter((x) => {x.status === 'online'})).length)
        break;
      case 'user_list':
        console.log(runtime.getUsersWithoutSocket(runtime.users))
        break;
      case 'get_rooms':
        console.log(runtime.getRooms());
        break;
      default:
        break;
  }
});
