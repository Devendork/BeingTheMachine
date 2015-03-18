var ui = {

  init: function(){
    console.log("init UI");

  //load vars for each div tag
    ui.div_2d = $('#renderArea2d');
    ui.div_3d = $('#renderArea3d');

    var div_file_alert = $('#file_alert');
    ui.div_bt_alert = $('#bluetooth_alert');
    ui.div_bt_menu =  $('#bt_menu');    
    ui.div_serial = $('#serialMonitor');

    var range_layer = $("#layerRange");
    var range_inst = $("#instRange");

    var but_increment = $("#increment");
    var but_decrement = $("#decrement");
    var but_connect = $("#connect");
    var but_bt_close = $("#bt_close_select");
    var but_toggle_view = $("#toggleView");

    var icon_square =  $('#square');
    var icon_cube =  $('#cube');

    var class_bt = $('.bluetooth');
    ui.class_bt_select = $('.bt_select');

    //setup the interface
    ui.div_3d.hide();
    icon_square.hide();
    ui.div_bt_alert.hide();
    div_file_alert.hide();
    class_bt.show();

    app.menu.setSwipeable(false);
      

    range_layer.change(function(){
      var i =  $(this).prop('value');
      var showValue = +i+1;
      d2.loadLayer(i); 
      range_inst.prop('max', d2.instructions[i].length);
      range_inst.prop('value', 0);
    });

    range_inst.change(function(){
      var i =  $(this).prop('value');
      while(d2.step < i){
        d2.nextStep();
      }
      while(d2.step > i){
        d2.prevStep();
      }
    });

    //figure out how to use touch start /end for equivalent
    var interval;
    but_increment.mousedown(function() {
        interval = setInterval(function(){
          d2.nextStep();
          app.sendData("next");
        }, 100);
    }).mouseup(function() {
        clearInterval(interval);  
    })
    

    but_decrement.mousedown(function() {
        interval = setInterval(function(){
          d2.prevStep();
          app.sendData("prev");
        }, 100);
    }).mouseup(function() {
        clearInterval(interval);  
    });
    
    but_connect.click(function(){
        app.menu.toggle();
        app.listPorts();
        // var temp = [];
        // temp.push({name:"BTM_BT1",address: "00:00:01"});
        // temp.push({name:"BTM_BT2",address: "00:00:02"});
        // app.selectConnection(temp);
    });


    but_bt_close.click(function(){
          app.serial("removing connection");
          div_bt_alert.hide();
    });


     
    but_toggle_view.click(function(){
        if (app.view == "3d") {
            app.view = "2d";
            ui.div_3d.hide();
            ui.div_2d.show();
            icon_cube.show();
            icon_square.hide();
            if(app.hasGL)
              d3.setControls(false); 

        }else {
            app.view = "3d"
            ui.div_2d.hide();
            ui.div_3d.show();
            icon_cube.hide();
            icon_square.show();
            if(app.hasGL)
              d3.setControls(true);
        }
    });


  },

  glError:function(){
    //update this later
    // ui.div_3d.fontFamily('monospace');
    // ui.div_3d.fontSize('13px');
    // ui.div_3d.textAlign('center');
    // ui.div_3d.color("#F00");
    ui.div_3d.text(window.WebGLRenderingContext ? [
             'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
             'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
         ].join( '\n' ) : [
             'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
             'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
         ].join( '\n' )
         );
  },

  bluetoothAlert:function(list){

      ui.class_bt_select.remove(); //clear the list
      
      for(var i in list){
         ui.div_bt_menu.prepend($('<button></button>')
              .addClass("alert-dialog-button")
              .addClass("bt_select")
              .prop("value", list[i].address)
              .text(list[i].name)
          );
          
      }

      class_bt_select.click(function(){
          ui.serial("selected");
          app.macAddress = $(this).prop('value');
          $("#bluetooth_alert").hide();
          app.menu.toggle();
          app.manageConnection();
      });

      div_bt_alert.show();

  },

  serial: function(message){
    ui.div_serial.append($('<div></div>')
      .addClass("serialLine")
      .text(message)
    );
  },

  clearSerial:function(){
    ui.div_serial.text("");
  }


};




