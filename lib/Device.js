var rest = require('rest');
var parser = require('xml2json');

var mime = require('rest/interceptor/mime');

function Device(opts){
  if(!(this instanceof Device)) return new Device(opts);

  this.location = opts.location;
}

Device.prototype.description = function(){
  var self = this;

  return rest({
    path: self.location
  }).then(function(resp){
    // TODO: lowercase the header key
    self.applicationUrl = resp.headers['Application-Url'];

    var description = parser.toJson(resp.entity, {
      object: true
    });

    var info = description.root.device;

    self.name = info.friendlyName;
    // TODO: mapping of code names to common name
    self.model = info.modelName;
    self.info = info;
  }, function(err){
    // TODO: error
  });
};

Device.prototype.launch = function(applicationName, data, cb){
  var client = rest.chain(mime, { mime: 'application/x-www-form-urlencoded.js' });

  this.applicationResourceUrl = this.applicationUrl + applicationName;

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

Device.prototype.appInfo = function(cb){
  return rest({
    path: this.applicationResourceUrl
  }).then(function(resp){
    var applicationInfo = parser.toJson(resp.entity, {
      object: true
    });

    if(typeof cb === 'function'){
      cb(null, applicationInfo);
    } else {
      return applicationInfo;
    }
  }, function(err){
    // TODO: error
  });
};

module.exports = Device;
