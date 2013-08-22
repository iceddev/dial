var EventEmitter = require('events').EventEmitter;
var util = require('util');

var SSDP = require('node-ssdp');
var Device = require('./lib/Device');

function Dial(){
  if(!(this instanceof Dial)) return new Dial();

  var self = this;

  EventEmitter.call(self);

  var ssdp = this.ssdp = new SSDP({
    log: false
  });

  ssdp.on('response', function(msg){
    // parse the response
    var header = msg.toString('utf-8');
    var headerLocation = header.match(/Location:(.*)/i);
    if(!(headerLocation && headerLocation[1])) return;
    var location = headerLocation[1].trim();

    var device = new Device({
      location: location
    });

    device.description()
      .then(function(){
        self.emit('device', device);
      });
  });

}

util.inherits(Dial, EventEmitter);

Dial.prototype.discover = function(){
  // search Target (ST) defined on page 4 of https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGlhbC1tdWx0aXNjcmVlbi5vcmd8ZGlhbHxneDo1NTA2NDQ5MDZmMzdkNzI0
  this.ssdp.search('urn:dial-multiscreen-org:service:dial:1');
};

// it's fine for this to be a singleton
module.exports = Dial();
