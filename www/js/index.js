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


        var lastImported = localStorage.getItem('last-imported');
        var lastLoaded = localStorage.getItem('last-loaded');
        var lastFilename = localStorage.getItem('last-filename');


        // if (lastImported) {
        //   app.openGCodeFromText(lastFilename, lastImported);
        // } else {
          app.openGCodeFromText("hand.gcode", gcode);
  
         //openGCodeFromPath(lastLoaded || 'examples/octocat.gcode');
        //}

         // Drop files from desktop onto main page to import them.
        $('body').on('dragover', function(event) {
            event.stopPropagation();
            event.preventDefault();
            event.originalEvent.dataTransfer.dropEffect = 'copy'
          }).on('drop', function(event) {
            event.stopPropagation();
            event.preventDefault();
            var files = event.originalEvent.dataTransfer.files;
            if (files.length > 0) {
              var reader = new FileReader();
              reader.onload = function() {
                app.openGCodeFromText(files[0].name, reader.result);
                d2.add(select_flavor);
                d3.add(select_flavor.object);
              };
              reader.readAsText(files[0]);
            }
         });

        //make sure to set up the graphics after the file has been loaded
        d2.init(ui.div_2d);
        d2.add(select_flavor);

        d3.init(ui.div_3d);
        d3.add(select_flavor.object);

        d3.setControls(false);

        if(!app.hasGL) ui.glError();

    },


    onDeviceReady: function() {
        app.has_bt = true;

        //THIS IS CALLED BEFORE INIT UI, YOU CANNOT CALL ANYTHING FROM BT OR UI IN HERE


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
             
      localStorage.setItem('last-imported', gcode);
      localStorage.setItem('last-filename', name);
      localStorage.removeItem('last-loaded');
    }

};

app.initialize();
