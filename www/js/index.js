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
var scene2d = null;
var scene3d = null;

var app = {
    //global bluetooth vars
    macAddress:undefined,
    chars:"",
    view: "2d",
    has_bt: false,    

    // Application Constructor
    initialize: function() {
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
        hasGL = Detector.webgl;
        console.log("init ui ", hasGL);

        $('#renderArea3d').hide();
        $('#square').hide();
        $('#bluetooth_alert').hide();
        $('#file_alert').hide();
        //$('.bluetooth').hide();


        if(!hasGL){
            var element = document.getElementById("renderArea3d"); 
            element.style.fontFamily = 'monospace';
            element.style.fontSize = '13px';
            element.style.fontWeight = 'normal';
            element.style.textAlign = 'center';
            element.style.background = '#fff';
            element.style.color = '#F00';
            element.style.padding = '1.5em';
            element.style.width = '400px';
            element.style.margin = '5em auto 0';
            element.innerHTML = window.WebGLRenderingContext ? [
             'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
             'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
         ].join( '\n' ) : [
             'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
             'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
         ].join( '\n' );
        }



        scene2d = new Scene2D($('#renderArea2d'));
        if(hasGL) scene3d = create3DScene($('#renderArea3d'));

        var lastImported = localStorage.getItem('last-imported');
        var lastLoaded = localStorage.getItem('last-loaded');
        var lastFilename = localStorage.getItem('last-filename');

        if (lastImported) {
            openGCodeFromText(lastFilename, lastImported);
        } else {
            openGCodeFromPath(lastLoaded || 'gcode/hand.gcode');
        }

        if(hasGL){ 
            update3DScene();
            controls.enabled = false;
        }
        app.menu.setSwipeable(false);

        $("#layerRange").change(function(){
          var i =  $("#layerRange").prop('value');
          var showValue = +i+1;
          scene2d.loadLayer(i); 
          $("#instRange").prop('max', scene2d.instructions[i].length);
          $("#instRange").prop('value', 0);
          
        });

        $("#instRange").change(function(){
        var i =  $("#instRange").prop('value');
          while(scene2d.step < i){
            scene2d.nextStep();
          }

          while(scene2d.step > i){
            scene2d.prevStep();
          }
        });

        //figure out how to use touch start /end for equivalent
        var interval;
        $("#increment").mousedown(function() {
            interval = setInterval(function(){
              scene2d.nextStep();
              app.sendData("next");
            }, 100);
        }).mouseup(function() {
            clearInterval(interval);  
        })
        

        $("#decrement").mousedown(function() {
            interval = setInterval(function(){
              scene2d.prevStep();
              app.sendData("prev");
            }, 100);
        }).mouseup(function() {
            clearInterval(interval);  
        });
        
        // $("#increment").click(function(){
        //   scene2d.nextStep();
        //   app.sendData("next");

        // });

        $("#connect").click(function(){
            app.menu.toggle();
            app.listPorts();
            // var temp = [];
            // temp.push({name:"BTM_BT1",address: "00:00:01"});
            // temp.push({name:"BTM_BT2",address: "00:00:02"});
            // app.selectConnection(temp);
        });

        $("#bt_select").click(function(){
            app.serial("establishing connection");
            //write to mac address
            app.manageConnection();
        });

        $("#bt_close_select").click(function(){
              app.serial("removing connection");
              $("#bluetooth_alert").hide();
        });


         
        $("#toggleView").click(function(){
            if (app.view == "3d") {
                console.log("toggle2d");
                app.view = "2d";
                $("#renderArea3d").css('display','none');
                $("#renderArea2d").css('display','block');
                $("#cube").show();
                $("#square").hide();
                if(hasGL) controls.enabled = false;


            }else {
                console.log("toggle3d");
                app.view = "3d"
                $("#renderArea2d").css('display','none');
                $("#renderArea3d").css('display','block');
                $("#cube").hide();
                $("#square").show();
                if(hasGL) controls.enabled = true;
            }
        });
    },


    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.has_bt = true;
        console.log("device ready");
        $('.bluetooth').show();
        app.listPorts();

        var interval;
        var triggerNext = function(){
             interval = setInterval(function(){
              scene2d.nextStep();
              app.sendData("next");
            }, 100);        
        };

         var triggerLast = function(){
             interval = setInterval(function(){
            scene2d.prevStep();
              app.sendData("next");
            }, 100);        
        };

        var endInterval = function(){
            clearInterval(interval);  
        };

        // document.getElementById("#increment").addEventListener('touchstart', triggerNext, false);
        // document.getElementById("#increment").addEventListener('touchend', endInterval, false);
        // document.getElementById("#decrement").addEventListener('touchstart', triggerLast, false);
        // document.getElementById("#decrement").addEventListener('touchend', endInterval, false);

        
        
    },

    listPorts: function(){
        //app.receivedEvent('deviceready');
        var listPorts = function(){
            bluetoothSerial.list(
                function(results){
                    app.serial(JSON.stringify(results));
                    app.selectConnection(results);
                },
                function(error){
                    app.serial(JSON.stringify(error));
                }
            );
        }

        var notEnabled = function(){
            app.serial("Bluetooth is not enabled");
        }

        bluetoothSerial.isEnabled(
            listPorts,
            notEnabled
        );

    },
    // Update DOM on a Received Event
    // receivedEvent: function(id) {
    //     var parentElement = document.getElementById(id);
    //     var listeningElement = parentElement.querySelector('.listening');
    //     var receivedElement = parentElement.querySelector('.received');

    //     listeningElement.setAttribute('style', 'display:none;');
    //     receivedElement.setAttribute('style', 'display:block;');

    //     console.log('Received Event: ' + id);
    // },

    // selectFile:function(){
    //     $(".file_select").remove(); //clear the list
        
    //     for(var i in list){
    //         $('#file_menu').prepend($('<button></button>')
    //             .addClass("alert-dialog-button")
    //             .addClass("bt_file")
    //             .prop("value", list[i].address)
    //             .text(list[i].name)
    //         );
            
    //     }

    //     $(".bt_select").click(function(){
    //         app.macAddress = $(this).prop('value');
    //         $("#bluetooth_alert").hide();
    //         app.menu.toggle();
    //         manageConnection();
    //     });

    //     $('#bluetooth_alert').show();

    // },

    selectConnection:function(list){
        app.serial("open box");

        $(".bt_select").remove(); //clear the list
        
        for(var i in list){
            $('#bt_menu').prepend($('<button></button>')
                .addClass("alert-dialog-button")
                .addClass("bt_select")
                .prop("value", list[i].address)
                .text(list[i].name)
            );
            
        }

        $(".bt_select").click(function(){
            app.serial("selected");
            app.macAddress = $(this).prop('value');
            $("#bluetooth_alert").hide();
            app.menu.toggle();
            app.manageConnection();
        });

        $('#bluetooth_alert').show();

    },

    manageConnection: function(){
        app.serial("manage connection");

        var connect = function(){
            app.clearSerial();
            app.serial("attempting to connect. " +
                    "make sure the serial port is open on the target device");

            bluetoothSerial.connect(
                app.macAddress,
                app.openPort,
                app.showError
                );
        };

        var disconnect = function(){
            app.serial("attemtping to disconnect");
            bluetoothSerial.disconnect(
                app.closePort,
                app.showError
            );
        };

        bluetoothSerial.isConnected(disconnect,connect);
    },


    openPort:function(){
        app.serial("Connected to: "+app.macAddress);
        bluetoothSerial.subscribe('\n', app.onData, app.showError);
    },

    onData:function(data){
        $
        app.serial(data);
    },

    sendData: function(data) { // send data to Arduino


        var success = function() {
            console.log("success");
            app.serial("S: " + data);
        };

        var failure = function() {
            app.showError("Failed writing data to Bluetooth peripheral");
        };

        if(app.has_bt) bluetoothSerial.write(data, success, failure);
        else app.serial("S: " + data);
    },

    closePort:function(){
        app.serial("Disconneting from "+app.macAddress);
        connectButton.innerHTML = "Connect";
        bluetoothSerial.unsubscribe(
            function(data){
                app.serial(data);
            },
            app.showError
        );
    },

    showError:function(error){
        app.serial(error);
    },

    serial:function(message){

       $('#serialMonitor').append($('<div></div>')
            .addClass("serialLine")
            .text(message)
        );
    },

    clearSerial:function(){
        var display = document.getElementById("serialMonitor");
        display.innerHTML = "";
    }

};

app.initialize();
