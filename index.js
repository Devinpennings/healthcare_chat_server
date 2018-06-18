#!/usr/bin/env node
const runtime = require('./ChatRuntime'); 
const program = require('commander');
runtime.setup();
require('draftlog').into(console)

let cListening = console.draft();
let cCount = console.draft();
let iLoad = 0;
let loader = ['◜', '◝', '◞', '◟']
setInterval( () => {
  cCount('Online users: ', runtime.users.filter(  
                                            function (value) {    
                                              return (value.user.status === 'online');  
                                            }).length, 
          ' | Online rooms: ', runtime.getRooms.length, 
          ' | Total messages: ', runtime.getMessages().length);
  cListening(loader[iLoad], ' Listening on *:3000');
  iLoad++;
  if(iLoad > 3){ iLoad = 0; }
}, 500);

console.log('listening on port 3000');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});
  
let listAllUsers = function(options) {
  if(options.all) console.log(runtime.getUsersWithoutSocket(runtime.users))
  else console.log(runtime.getUsersWithoutSocket(runtime.users.filter(  
    function (value) {    
      return (value.user.status === 'online');  
    })))
}

program
  .version('1.0.0')
    .command('users')
      .description('List all online users')
      .option('-a, --all', 'List all users')
      .action(listAllUsers)

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
