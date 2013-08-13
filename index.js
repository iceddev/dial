var EventEmitter = require('events').EventEmitter;
var util = require('util');
var url = require('url');

var SSDP = require('node-ssdp');
var parser = require('xml2json');
var rest = require('rest');
var defaultRequest = require('rest/interceptor/defaultRequest');
var mime = require('rest/interceptor/mime');

function Dial(){
  if(!(this instanceof Dial)) return new Dial();

  var self = this;

  EventEmitter.call(self);

  self.on('headers', function(headers){
    self.deviceDescription(headers.location);
  });

  var ssdp = this.ssdp = new SSDP();

  ssdp.on('response', function onResponse(msg){
    // parse the response
    var data = msg.toString('utf-8');
    var lines = data.split(/\r\n|\n|\r/);

    var headers = {};
    lines.forEach(function(line, idx){
      if(idx === 0){
        // the first response is the HTTP status
        console.log('STATUS: ', line);
        return;
      }
      // splitting based on first colon
      var a = line.split(/:/);
      var key = a.shift();
      var val = a.join(':');

      if(key && val){
        // lowercase the keys and leave off key-value pairs where one is empty
        headers[key.toLowerCase()] = val.trim();
      }
    });

    self.client = rest
      .chain(defaultRequest, {
        headers: {
          'Host': self.host
        }
      });

    self.emit('headers', headers);
  });

}

util.inherits(Dial, EventEmitter);

Dial.prototype.discover = function(){
  // search Target (ST) defined on page 4 of https://docs.google.com/viewer?a=v&pid=sites&srcid=ZGlhbC1tdWx0aXNjcmVlbi5vcmd8ZGlhbHxneDo1NTA2NDQ5MDZmMzdkNzI0
  this.ssdp.search('urn:dial-multiscreen-org:service:dial:1');
};

Dial.prototype.deviceDescription = function(url){
  var self = this;

  if(typeof url !== 'string'){
    url = url.location;
  }

  return this.client({
    path: url
  }).then(function(resp){
    var description = parser.toJson(resp.entity, {
      object: true
    });

    // TODO: lowercase the header key
    self.applicationUrl = resp.headers['Application-Url'];

    self.emit('device', description);
  }, function(err){
    // TODO: error
  });
};

Dial.prototype.launch = function(applicationName, data, cb){
  var client = this.client.chain(mime, { mime: 'application/x-www-form-urlencoded.js' });

  this.applicationResourceUrl = this.applicationUrl + applicationName;

  console.log(this.applicationResourceUrl);

  return client({
    path: this.applicationResourceUrl,
    method: 'POST',
    entity: data
  }).then(function(resp){
    if(typeof cb === 'function'){
      cb(null, resp);
    } else {
      return resp;
    }
  });
};

Dial.prototype.appInfo = function(applicationResourceUrl, cb){
  if(typeof applicationResourceUrl === 'function' && typeof cb !== 'function'){
    // juggle callback
    cb = applicationResourceUrl;
  }
  if(typeof applicationResourceUrl !== 'string'){
    // use applicationResourceUrl of object if one not provided
    applicationResourceUrl = this.applicationResourceUrl;
  }
  return this.client({
    path: applicationResourceUrl
  }).then(function(resp){
    var applicationInfo = parser.toJson(resp.entity, {
      object: true
    });

    if(typeof cb === 'function'){
      cb(null, applicationUrl);
    } else {
      return applicationInfo;
    }
  }, function(err){
    // TODO: error
  });
};

module.exports = Dial;
