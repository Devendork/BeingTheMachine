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
    ui.but_connect = $("#connect");

    ui.range_layer = $("#layerRange");
    ui.cur_layer = $("#curLayer");
    ui.cur_layer.text(1);

    ui.range_layer.prop('min', 1);
    ui.range_layer.prop('value', 1);


    ui.range_inst = $("#instRange");
    ui.range_inst.prop('min', 1);
    ui.range_layer.prop('value', 1);

    ui.cur_inst = $("#curInst");
    ui.cur_inst.text(1);


    ui.percent = $("#percent");

    var render_layers = $("#render_layers");

    var but_increment = $("#increment");
    var but_decrement = $("#decrement");
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
      
    // render_layers.change(function(){
    //   all_layers = this.checked;
    // });


    ui.range_layer.change(function(){
      var i =  parseInt($(this).prop('value'));
      var id = +i-1;
      d2.loadLayer(id, true);
      d3.updateLayer(id); 
      ui.updateModelStats();

    });

    ui.range_inst.change(function(){
      var i =  parseInt($(this).prop('value'));
      var id = i-1;

      if(id < 0) id = 0;
      if(id >= d2.step_counts[d2.ptr.layer]) id = d2.step_counts[d2.ptr.layer]-1;

      while(d2.ptr.step < id){
        d2.nextStep();
      }
      while(d2.ptr.step > id){
        d2.prevStep();
      }

    });

    //figure out how to use touch start /end for equivalent
    if(!app.has_bt){
    var interval;
    but_increment.mousedown(function() {
        interval = setInterval(function(){
          d2.nextStep();
          bt.sendData('m'); 
        }, 100);
    }).mouseup(function() {
        clearInterval(interval);  
    })
    

    but_decrement.mousedown(function() {
        interval = setInterval(function(){
          d2.prevStep();
          bt.sendData('m'); 
        }, 100);
    }).mouseup(function() {
        clearInterval(interval);  
    });
  }else{
    but_increment.click(function() {
          d2.nextStep();
          bt.sendData('m'); 
    });

    but_decrement.click(function() {
          d2.prevStep();
          bt.sendData('m'); 
    });
  }
    
  ui.but_connect.click(function(){
        if(app.has_bt){
          if(bt.macAddress != undefined) bt.manageConnection();
          else{
              app.menu.toggle();
              bt.listPorts();
          } 
        } 
        else{
          var temp = [];
          temp.push({name:"BTM_BT1",address: "00:00:01"});
          temp.push({name:"BTM_BT2",address: "00:00:02"});
          ui.bluetoothAlert(temp);
        } 

    });


    but_bt_close.click(function(){
          ui.serial("removing connection");
          ui.div_bt_alert.hide();
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

  updateModelStats:function(){
      var showLayer = d2.ptr.layer + 1;
      var showInst = d2.ptr.step +1;


      ui.range_layer.prop('max', d2.lines.length);
      ui.range_layer.prop('value', showLayer);
      ui.cur_layer.text(showLayer);

      ui.range_inst.prop('max', d2.step_counts[d2.ptr.layer]);
      ui.range_inst.prop('value', showInst);
      ui.cur_inst.text(showInst);
    
      var steps_taken = 0;
      for(var i = 0; i < d2.ptr.layer; i++){
        steps_taken += d2.step_counts[i];
      }
      steps_taken += d2.ptr.step;

     var p = Math.floor(steps_taken / d2.total_steps * 100);
     ui.percent.text(p+"%");
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
      $('.bt_select').remove(); //clear the list
      
      for(var i in list){
         ui.div_bt_menu.prepend($('<button></button>')
              .addClass("alert-dialog-button")
              .addClass("bt_select")
              .prop("value", list[i].address)
              .text(list[i].name)
          );
          
      }

      $('.bt_select').click(function(){
          bt.macAddress = $(this).prop('value');
          ui.serial("selected: "+bt.macAddress);
          ui.div_bt_alert.hide();
          app.menu.toggle();
          if(app.has_bt) bt.manageConnection();
      });

      ui.div_bt_alert.show();

  },

  serial: function(message){
    ui.div_serial.prepend($('<div></div>')
      .addClass("serialLine")
      .text(message)
    );
  },

  clearSerial:function(){
    //ui.div_serial.text("");
  }


};




