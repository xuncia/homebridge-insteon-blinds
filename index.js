var request = require("sync-request");

var Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-blinds", "BlindsHTTP", BlindsHTTPAccessory);
}

function BlindsHTTPAccessory(log, config) {
    // global vars
    this.log = log;

    // configuration vars
    this.name = config["name"];
    this.upURL = config["up_url"];
    this.downURL = config["down_url"];
    this.stopURL = config["stop_url"];
    this.lastURL = config["last_url"];// aggiunto work in progress LG
    this.stopAtBoundaries = config["trigger_stop_at_boundaries"];
    this.httpMethod = config["http_method"] || "POST";
    this.motionTime = config["motion_time"];

    // state vars
    this.interval = null;
    this.timeout = null;
    this.lastPosition = this.posizione_new(this.lastURL); // last known position of the blinds, down by default
   // console.log('last position'+ this.lastPosition)
    this.currentPositionState = 2; // stopped by default
    this.currentTargetPosition = this.lastPosition; // down by default

    // register the service and provide the functions
    this.service = new Service.WindowCovering(this.name);

    // the current position (0-100%)
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L493
    this.service
        .getCharacteristic(Characteristic.CurrentPosition)
        .on('get', this.getCurrentPosition.bind(this));

    // the position state
    // 0 = DECREASING; 1 = INCREASING; 2 = STOPPED;
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L1138
    this.service
        .getCharacteristic(Characteristic.PositionState)
        .on('get', this.getPositionState.bind(this));

    // the target position (0-100%)
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L1564
    this.service
        .getCharacteristic(Characteristic.TargetPosition)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));
}

BlindsHTTPAccessory.prototype.getCurrentPosition = function(callback) {
    CP = this.posizione_new(this.lastURL);
    this.log("Requested CurrentPosition: %s", CP);//this.lastPosition);    
    callback(null, CP);//posizione_new(this.lastURL));//this.lastPosition);
}

BlindsHTTPAccessory.prototype.getPositionState = function(callback) {
    this.log("Requested PositionState: %s", this.currentPositionState);
    callback(null, this.currentPositionState);
}

BlindsHTTPAccessory.prototype.getTargetPosition = function(callback) {
    //TP = this.posizione_new(this.lastURL);
    this.log("Requested TargetPosition: %s", CP);//this.currentTargetPosition);
    callback(null, CP);//this.posizione_new(this.lastURL));//this.currentTargetPosition);
}

BlindsHTTPAccessory.prototype.setTargetPosition = function(pos, callback) {
    this.log("Set TargetPosition: %s", pos);
    this.currentTargetPosition = pos;
    if (this.currentTargetPosition == this.lastPosition) {
        if (this.interval != null) clearInterval(this.interval);
        if (this.timeout != null) clearTimeout(this.timeout);
        this.httpRequest(this.stopURL, this.httpMethod, function() {
            this.log("Already here");
        }.bind(this));
        callback(null);
        return;
    }
    const moveUp = (this.currentTargetPosition >= this.lastPosition);
    this.log((moveUp ? "Moving up" : "Moving down"));

    this.service
        .setCharacteristic(Characteristic.PositionState, (moveUp ? 1 : 0));
    this.httpRequest( (moveUp ? this.upURL : this.downURL),this.httpMethod, function() {
        this.log(
            "Success moving %s",
            (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
        );
        this.service
            .setCharacteristic(Characteristic.CurrentPosition, pos);
        this.service
            .setCharacteristic(Characteristic.PositionState, 2);
    }.bind(this));

    var localThis = this;
    if (this.interval != null) clearInterval(this.interval);
    if (this.timeout != null) clearTimeout(this.timeout);
    this.interval = setInterval(function(){
        localThis.lastPosition += (moveUp ? 1 : -1);
        if (localThis.lastPosition == localThis.currentTargetPosition) {
            if (localThis.currentTargetPosition != 0 && localThis.currentTargetPosition != 100) {
                localThis.httpRequest(localThis.stopURL, localThis.httpMethod, function() {
                    localThis.log(
                        "Success stop moving %s",
                        (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
                    );
                    localThis.service
                        .setCharacteristic(Characteristic.CurrentPosition, pos);
                    localThis.service
                        .setCharacteristic(Characteristic.PositionState, 2);
                    localThis.lastPosition = pos;
                }.bind(localThis));
            }
            clearInterval(localThis.interval);
        }
    }, parseInt(this.motionTime) / 100);
    if (this.stopAtBoundaries && (this.currentTargetPosition == 0 || this.currentTargetPosition == 100)) {
        this.timeout = setTimeout(function() {
            localThis.httpRequest(localThis.stopURL, localThis.httpMethod, function() {
                localThis.log(
                    "Success stop adjusting moving %s",
                    (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
                );
            }.bind(localThis));
        }, parseInt(this.motionTime));
    }
    callback(null);
}

BlindsHTTPAccessory.prototype.httpRequest = function(url,method, callback)  {

    var res2 = request(method,url);
    var risposta = res2.statusCode;
    console.log("chiamata "+risposta)
    wait(1000)
    if (res2 && res2.statusCode == 200) {
        console.log("sono nell'if della request response: ");
        
        callback(null);
    } else {
        this.log(
            "Error getting state (status code %s): %s",
            (res2 ? res2.statusCode : "not defined"),
            err
        );
        callback(err);
    }
}

BlindsHTTPAccessory.prototype.posizione_new = function (indirizzo){
    this.log(indirizzo);
var res = request('POST','http://bathub:BruceWayne@'+ indirizzo);
var stato = res.getBody('utf8');
    
    this.log("Posizione: " + stato.substring(69,71) +" FF->Open - 00->Closed");
    if (stato.substring(69,71)== 'FF')
    {
       //console.log("Value: " + stato.substring(69,71));
        return 100;
    }
    else
    {
        //console.log("Value "+ stato.substring(69,71));
        return 0;
    }
    
    
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }
BlindsHTTPAccessory.prototype.getServices = function() {
    return [this.service];
}

