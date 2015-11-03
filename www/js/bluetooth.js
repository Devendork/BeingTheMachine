var bt = {
	macAddress: undefined,
    alternate: true,
	
	init:function(){
		console.log("init bt");
		if(app.has_bt) bt.listPorts();
	},

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

        var connect = function(){
            ui.serial("attempting to connect. " +
                    "make sure the serial port is open on the target device");

            bluetoothSerial.connect(
                bt.macAddress,
                bt.openPort,
                bt.showError
                );
        };

        var disconnect = function(){
            ui.serial("attemtping to disconnect");
            bluetoothSerial.disconnect(
                bt.closePort,
                bt.showError
            );
        };

        bluetoothSerial.isConnected(disconnect,connect);
    },


    openPort:function(){
        ui.serial("Connected to: "+bt.macAddress);
        ui.but_connect.text("Disconnect");

        bluetoothSerial.subscribe('\n', bt.onData, bt.showError);
        bt.sendData("i");

        //  ui.serial("start playing");
        //  var playing = setInterval(function(){
        //     var move_info = d2.nextStep();
        //     var str = "m "+move_info.ms.x+" "+move_info.ms.y+" "+move_info.l;
        //     bt.sendData(str);
        // }, 100);
    },

    onData:function(data){
    	var forward = true,
    		playing = false;

        ui.serial("-> "+ data);

        // function startPlaying(){
        //         ui.serial("start playing");
        //         bt.playing = setInterval(function(){
        //             var move_info = d2.nextStep();
        //             var str = "m "+move_info.ms.x+" "+move_info.ms.y+" "+move_info.l;
        //             bt.sendData(str);
        //         }, 100);
        // };

        // function endPlaying(){
        // 	clearInterval(bt.playing);
        // };

        function nextStep(){
        	var move_info = d2.nextStep();
            var str = "m "+move_info.ms.x+" "+move_info.ms.y+" "+move_info.l;
            //var str;
            // if(bt.alternate) str = "m 1600 1600 "+move_info.l;
            // else str = "m 1400 1400 "+move_info.l;

        	bt.sendData(str);
            // bt.alternate = !bt.alternate;
        };

        function prevStep(){
        	var move_info = d2.prevStep();
            var str = "m "+move_info.ms.x+" "+move_info.ms.y+" "+move_info.l;
        	bt.sendData(str);
        };

        // function playForward(){
        // 	forward = true;
        // };

        // function playBackward(){
        // 	forward = false;

        // };

        for(var i = 0, len = data.length; i < len; i++){
            switch(data[i]){
            	// case 's': startPlaying(); break;
            	// case 'e': endPlaying(); break;
            	case 'n': nextStep();break;
            	case 'p': prevStep();break;
            	// case 'f': playForward();break;
            	// case 'b': playBackward();break;
            };
        }

        

    },

  //   formatData: function(data){
  //   	/*
  //   	i xmin xmax ymin ymax: initializes by sending the bounding box positions of the model
		// m x y l: move to x y position with laser on (1) or off (0)
		// b: draw bounding box
		// c: center servos
		// TODO: p: signal path
		// TODO l x : signal layer x
		// TODO s: start playing
		// TODO e: end playing
		// */
		// var str = "";

		// function initialize(){
		// 	//send the initialization command
  //       	var bounds = computeArduinoBounds();
  //       	str = "i "+bounds.x.min+" "+bounds.x.max+" "+bounds.y.min+" "+bounds.y.max;
		// };

		// function boundingBox(){
		// 	str = 'b';
		// };

		// function centerServos(){
		// 	str = 'c';
		// }

  //   	switch(data){
  //       	case 'i': initialize(); break;
  //       	// case 'm': moveToStep(data);  break;
  //       	// case 'b': boundingBox(); break;
  //       	// case 'c': centerServos(); break;
  //           default: str = data;
  //       };

  //       return str;
  //   },

    sendData: function(data) { // send data to Arduino


        var success = function() {
            console.log("success");
            ui.serial("<- " + data);
        };

        var failure = function() {
            bt.showError("Failed writing data to Bluetooth peripheral");
        };

        //data = bt.formatData(data);


        if(data != ""){
	        if(app.has_bt) bluetoothSerial.write(data+'\n', success, failure);
	        //else ui.serial("<- " + data);
	    }
    },

    closePort:function(){
        ui.serial("Disconneting from "+app.macAddress);
        app.macAddress = undefined;
        ui.but_connect.text("Connect to Arduino");
        bluetoothSerial.unsubscribe(
            function(data){
                ui.serial(data);
            },
            bt.showError
        );
    },

    showError:function(error){
        ui.serial(error);
    }


};