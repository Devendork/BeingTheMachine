/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



var module = angular.module('app', ['onsen']); 
var hasGL = undefined;
var render_raw = true;

var app = {
    //global bluetooth vars
    macAddress:undefined,
    chars:"",
    view: "2d",
    has_bt: false,  

    // Application Constructor
    initialize: function() {
        console.log("init app");
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        ons.ready(function(){app.initUI();});
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('pause', this.closePort, false);
        document.addEventListener('resume', this.manageConnection, false);
    },

    initUI:function(){

        app.hasGL = Detector.webgl;
        bt.init();        
        ui.init();

        function loadFile(){
            app.lastImported = localStorage.getItem('last-imported');
            app.lastLoaded = localStorage.getItem('last-loaded');
            app.lastFilename = localStorage.getItem('last-filename');

            if (app.lastImported) {
                app.openGCodeFromText(app.lastFilename, app.lastImported);
            } else {
                app.openGCodeFromPath(app.lastLoaded || 'gcode/hand.gcode');
            }
        }

        loadFile();

        //make sure to set up the graphics after the file has been loaded
        d2.init(ui.div_2d);
        d2.add(select_flavor);

        d3.init(ui.div_3d);
        d3.add(select_flavor.object);

        d3.setControls(false);

         if(!app.hasGL) ui.glError();

    },


    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.has_bt = true;
        bt.init();

        // var interval;
        // var triggerNext = function(){
        //      interval = setInterval(function(){
        //       d2.nextStep();
        //       app.sendData("next");
        //     }, 100);        
        // };

        //  var triggerLast = function(){
        //      interval = setInterval(function(){
        //      d2.prevStep();
        //      app.sendData("next");
        //     }, 100);        
        // };

        // var endInterval = function(){
        //     clearInterval(interval);  
        // };

        // document.getElementById("#increment").addEventListener('touchstart', triggerNext, false);
        // document.getElementById("#increment").addEventListener('touchend', endInterval, false);
        // document.getElementById("#decrement").addEventListener('touchstart', triggerLast, false);
        // document.getElementById("#decrement").addEventListener('touchend', endInterval, false);

        
        
    },

    ////////////////// BLUETOOTH FUNCTIONS //////////////////////

    listPorts: function(){
        //app.receivedEvent('deviceready');
        var listPorts = function(){
            bluetoothSerial.list(
                function(results){
                    ui.serial(JSON.stringify(results));
                    ui.bluetoothAlert(results);
                },
                function(error){
                    ui.serial(JSON.stringify(error));
                }
            );
        }

        var notEnabled = function(){
            ui.serial("Bluetooth is not enabled");
        }

        bluetoothSerial.isEnabled(
            listPorts,
            notEnabled
        );

    },


    manageConnection: function(){
        ui.serial("manage connection");

        var connect = function(){
            ui.clearSerial();
            ui.serial("attempting to connect. " +
                    "make sure the serial port is open on the target device");

            bluetoothSerial.connect(
                app.macAddress,
                app.openPort,
                app.showError
                );
        };

        var disconnect = function(){
            ui.serial("attemtping to disconnect");
            bluetoothSerial.disconnect(
                app.closePort,
                app.showError
            );
        };

        bluetoothSerial.isConnected(disconnect,connect);
    },


    openPort:function(){
        ui.serial("Connected to: "+app.macAddress);
        bluetoothSerial.subscribe('\n', app.onData, app.showError);

        //send the initialization command
        app.sendData("i 0 0 10 10");
    },

    onData:function(data){
        ui.serial("-> "+ data);
        // i: say hello / initialize / handshake
        // s: start playing
        // e: end playing
        // n: send next instruction
        // p: send previous instruction
        // i x: go to instruction number x
        // l x: go to layer number x
        // f: play forward (give next instruction)
        // b: play backward (give prev instruciton)

        var trigger = {

        }
    },

    sendData: function(data) { // send data to Arduino


        var success = function() {
            console.log("success");
            ui.serial("<- " + data);
        };

        var failure = function() {
            app.showError("Failed writing data to Bluetooth peripheral");
        };

        if(app.has_bt) bluetoothSerial.write(data+'\n', success, failure);
        else ui.serial("<- " + data);
    },

    closePort:function(){
        ui.serial("Disconneting from "+app.macAddress);
        connectButton.innerHTML = "Connect";
        bluetoothSerial.unsubscribe(
            function(data){
                ui.serial(data);
            },
            app.showError
        );
    },

    showError:function(error){
        ui.serial(error);
    },

    ////////////////// TOTO: Move to G-CODE MODEL //////////////////////

    updateModel: function(h, a, dist, ha, min, max){
      select_flavor = new outputFlavor(raw_flavor.is.slice(0), raw_flavor.diameter, h, a,  render_raw, dist, ha, min, max);   
    },

    ////////////////// FILE SYSTEM FUNCTIONS //////////////////////

    loadFile: function(path, callback /* function(contents) */) {
      $.get(path, null, callback, 'text')
        .error(function() { error() });
    },



    openGCodeFromPath: function(path) {
        console.log("opening from path", path);
        app.loadFile(path, function(gcode) {
        createGeometryFromGCode(gcode);
      });
    },

    openGCodeFromText: function(name, gcode) {
      console.log("opening from text", name);  
      createGeometryFromGCode(gcode);
             
      // app.localStorage.setItem('last-imported', gcode);
      // app.localStorage.setItem('last-filename', name);
      // app.localStorage.removeItem('last-loaded');
    }

};

app.initialize();
