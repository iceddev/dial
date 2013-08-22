var dial = require('../');

dial.on('device', function(device){

  console.log(device);

});

dial.discover();
