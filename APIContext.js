const axios = require('axios');
const api = axios.create({
    baseURL: 'http://35.195.241.255/api/',
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar',
                }
});

function ChatRuntime() 
{ 
    this.getPrescription = function(pCode) {
        api.get('/')
    }.then((response) => {
        
    }).catch((error) => {

    });
}