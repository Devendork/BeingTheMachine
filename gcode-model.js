var extruder_value = false;
var raw_flavor = undefined;
var select_flavor = undefined;

//we need a function that doesn't return object but has the parsing
//2D/3D independent
function createGeometryFromGCode(gcode) {
  raw_flavor = undefined;
  select_flavor = undefined;
  instructions = [];
  layer_heights = [];
   extruder_value = false;

  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code


  instructions.push([]); //push an empty layer  


  var has_z = false;
  var lastLine = {x:null, y:null, z:0, e:0, f:0, extruding:false};

  var layers = [];
  var layer = undefined;


  var relative = false;
  function delta(v1, v2) {
    return relative ? v2 : v2 - v1;
  }
  function absolute (v1, v2) {
    return relative ? v1 + v2 : v2;
  }


  function addMove(p1, p2) {

    var s = p2.f; //units: mm/min	
    var e = delta(p1.e, p2.e); //mm's extruded
    var dx = delta(p2.x, p1.x);
    var dy = delta(p2.y, p1.y);
    var dz = delta(p1.z, p2.z);
    var move_distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

    if(dz > 0){
        dz = Math.round(dz * 10)/10;
        if(layer_heights[dz] == undefined) layer_heights[dz] = 0;
        layer_heights[dz]++;
    }

    var obj = {
      to: p2,
      speed:s,
      //coords: {dx: dx, dy:dy, dz:dz},  
      d_traveling: move_distance,
      d_extruding: e,
    }

    return obj;

  }


  var parser = new GCodeParser({  	
    G1: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G1 X99.9948 Y80.0611 Z15.0 F1500.0 E981.64869
      //          G1 E104.25841 F1800.0
      // Go in a straight line from the current (X, Y) point
      // to the point (90.6, 13.8), extruding material as the move
      // happens from the current extruded length to a length of
      // 22.4 mm.

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
      };

      var instruction_text = "G1";
      if(args.x !== undefined) instruction_text = instruction_text +" X"+args.x;
      if(args.y !== undefined) instruction_text = instruction_text +" Y"+args.y;
      if(args.z !== undefined) instruction_text = instruction_text +" Z"+args.z;
      if(args.f !== undefined) instruction_text = instruction_text +" F"+args.f;
      if(args.e !== undefined) instruction_text = instruction_text +" E"+args.e;

      if(instructions.count() == 0 || 
         ((delta(lastLine.z, newLine.z) > 0) && has_z != false)){
        instructions.push([]); //create a new layer of instructions	
      }

      if(args.z !== undefined) has_z = true;

      var instruction = {
        text: instruction_text,
        desc: "Controlled move: move in straight line to coordinate",
        type: "G1",
        ext: (delta(lastLine.e, newLine.e) > 0) || (extruder_value),
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj: addMove(lastLine, newLine)
      };


      instructions[instructions.count()-1].push(instruction);
      lastLine = newLine;

    },


    G21: function(args) {
      // G21: Set Units to Millimeters
      // Example: G21
      // Units from now on are in millimeters. (This is the RepRap default.)
      // No-op: So long as G20 is not supported.
      var i = {
        text: "G21",
        desc: "Set Units to Millimeters (RepRap Default)",
        type: "G21",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};

        instructions[instructions.count()-1].push(i);
    },

    G28: function(args) {
      // G28: Return to Origin
      // Example: G28
      // no op at this point
      var i = {
        text: "G28",
        desc: "Move To Origin",
        type: "G28",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};

        instructions[instructions.count()-1].push(i);
    },


    G90: function(args) {
      // G90: Set to Absolute Positioning
      // Example: G90
      // All coordinates from now on are absolute relative to the
      // origin of the machine. (This is the RepRap default.)
      var i = {
        text: "G90",
        desc: "Set to Absolute Positioning (RepRap Default)",
        type: "G90",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);


        relative = false;
    },

    G91: function(args) {
      // G91: Set to Relative Positioning
      // Example: G91
      // All coordinates from now on are relative to the last position.

      //TODO
      var i = {
        text: "G91",
        desc: "Set to Relative Positioning (not supported by visualization)",
        type:"G91",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

        relative = true;
    },

    G92: function(args) { // E0
      // G92: Set Position
      // Example: G92 E0
      // Allows programming of absolute zero point, by reseting the
      // current position to the values specified. This would set the
      // machine's X coordinate to 10, and the extrude coordinate to 90.
      // No physical motion will occur.

      // TODO: Only support E0
      var newLine = lastLine;
      newLine.x= args.x !== undefined ? args.x : newLine.x;
      newLine.y= args.y !== undefined ? args.y : newLine.y;
      newLine.z= args.z !== undefined ? args.z : newLine.z;
      newLine.e= args.e !== undefined ? args.e : newLine.e;

      var instruction_text = "G92";
      if(args.x !== undefined) instruction_text = instruction_text +" X"+args.x;
      if(args.y !== undefined) instruction_text = instruction_text +" Y"+args.y;
      if(args.z !== undefined) instruction_text = instruction_text +" Z"+args.z;
      if(args.e !== undefined) instruction_text = instruction_text +" E"+args.e;

      var i = {
        text: instruction_text,
        desc: "Set Position: Set Machine Zero Point (not supported by visualization)",
        type:"G92",
        ext: extruder_value || (delta(lastLine.e, newLine.e) > 0),
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

        lastLine = newLine;
    },

    M82: function(args) {
      // M82: Set E codes absolute (default)
      // Descriped in Sprintrun source code.

      // No-op, so long as M83 is not supported.
    },

    M84: function(args) {
      // M84: Stop idle hold
      // Example: M84
      // Stop the idle hold on all axis and extruder. In some cases the
      // idle hold causes annoying noises, which can be stopped by
      // disabling the hold. Be aware that by disabling idle hold during
      // printing, you will get quality issues. This is recommended only
      // in between or after printjobs.

      // No-op
    },

    M101: function(args) {
      var i = {
        text: "M101",
        desc: "Turn Extruder 1 on Forward", 
        type:"M101",
        ext: true, 
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);
        extruder_value = true;

    },


    M103: function(args) {
      var i = {
        text: "M103",
        desc: "Turn all extruders off", 
        type:"M103",
        ext:false,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);
        extruder_value = false;

    },

    M104: function(args) {
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M104 "+itext,
        desc: "Set Extruder Temp to S (Celcius)",
        type:"M104",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);
    },

    M105: function(args) {
      var i = {
        text: "M105",
        desc: "Get Extruder Temperature", 
        type:"M105",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },

    M106: function(args) {

      var itext = (args.s !== undefined) ? " S"+args.s : "";
      var i = {
        text: "M106 "+itext, 
        desc: "Turn Fan On",
        type:"M106",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },

    M107: function(args) {

      var itext = (args.s !== undefined) ? " S"+args.s : "";
      var i = {
        text: "M107",
        desc: "Fan Off (Deprecated)",
        type:"M107",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },

    M108: function(args) {
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M108 "+itext,
        desc: "Set Extruder Motor Speed to S (deprecated)",
        type:"M108",
        ext: false,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

        //I'm going to assume that this turns the extruder off
        //if(args.s !== undefined) extruder_value = args.s/210;
        extruder_value = false;

    },
    M109: function(args) {
      var i = {
        text: "M109",
        desc: "Set Extruder Temperature and Wait", 
        type:"M109",
        ext: false,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },


    M113: function(args) {
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M113 "+itext,
        desc: "Set Extruder PWM to S (.1 = 10%)",
        type:"M113",
        ext: true,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

        extruder_value = true;
    },


    M140: function(args) {
      // Example: M140 S55
      //Set the temperature of the build bed to 55oC and return control to the host immediately (i.e. before that temperature has been reached by the bed).
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M140 "+itext,
        desc: "Set Temperature of Bed to S (Celcius) and return control before it gets to that temp",
        type:"M140",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },


    M141: function(args) {
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M141 "+itext,
        desc: "Set Temperature of Chamber to S (Celcius) and return control before it gets to that temp",
        type:"M141",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },

    M142: function(args) {
      var itext = (args.s !== undefined) ? "S"+args.s : "";
      var i = {
        text: "M142 "+itext,
        desc: "Set Holding Pressure of Bed to S (bars)",
        type:"M142",
        ext: extruder_value,
        coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
        obj:null};
        instructions[instructions.count()-1].push(i);

    },
    'default': function(args, info) {
      console.error('Unknown command:', args.cmd, args, info);
    },
  });

  
  parser.parse(gcode);

  var most = 0;
  var count = 0;
  var material_size = 0;
  var angle = 0;

  if(layer_heights.length > 1){ 
    for(var i in layer_heights){
      count++;
      if(layer_heights[i] > most){
        most = layer_heights[i];
        material_size = i;
      }
    }
  }else{
    material_size = layer_heights[0];
  }
  


  if(count > 1) 
      console.log("ERROR: Multiple Layer Heights Detected, Using Most Common For Printing");
  console.log("Material size is "+material_size);


 for(var l in instructions){
    for(var i in instructions[l]){
      instructions[l][i].coord.y = instructions[l][i].coord.y * -1;
      //console.log(instructions[l][i]);
    }
  }



  raw_flavor = new outputFlavor(instructions, material_size, material_size, angle, true, -1, 10);


  $("#force_height").val(raw_flavor.material_height);
  $("#force_angle").val(raw_flavor.angle);
  $("#default_height").html(raw_flavor.material_height);
  $("#force_halfangle").val(raw_flavor.half_angle);
  $("#force_distance").val(raw_flavor.env.distance_to_base);

  select_flavor = new outputFlavor(instructions.slice(0), material_size, material_size, angle, render_raw, raw_flavor.env.distance_to_base, raw_flavor.half_angle);

}

function checkUndefined(instructions){
 var udef_count = 0;
  for(var l in instructions){
    for(var i in instructions[l]){
      if(instructions[l][i] == undefined) udef_count++; 
    }
  }
  console.log("There were "+udef_count+" undefined values");
}

function isValidDistance(p1, p2, d){
  dx = Math.abs(p1.x - p2.x);
  dy = Math.abs(p1.y - p2.y);
  h = dx*dx + dy*dy;
  
  return (h > d);

}


function rad_to_deg(x){
  return  x * 180. / Math.PI;
}


function deg_to_rad(x){
  return  x * Math.PI / 180;
}


function getSDInstructions(){
  var flavor = select_flavor;
  var ilist = [];
  var last = {x:flavor.bbox.min.x, y:flavor.bbox.min.y,z:flavor.bbox.min.z,  ext:false};
  
  ilist.push("h"+select_flavor.half_angle);


  var bx = [flavor.bbox.min.x, flavor.bbox.max.x, flavor.bbox.max.x, flavor.bbox.min.x];
  var by = [flavor.bbox.min.y, flavor.bbox.min.y, flavor.bbox.max.y, flavor.bbox.max.y];
  var raw_x;
  var raw_y;

  for(var i in bx){
    var ms  = select_flavor.toMicroseconds(0, bx[i], by[i]);
    bx[i] = ms.x;
    by[i] = ms.y;
  }

  ilist.push("x"+bx.join());
  ilist.push("y"+by.join());

  var i_count = 0;
  var layer_count = 0;

  //go through and make the instructions
  for(var l in flavor.a_is){
    for(var i in flavor.a_is[l]){
      var inst = flavor.a_is[l][i];
        
        raw_x = inst.obj.microseconds.x;
        raw_y = inst.obj.microseconds.y;

        
        if(last.ext == true) ilist.push("g"+i_count+","+raw_x+","+raw_y);
        else ilist.push("p"+i_count+","+raw_x+","+raw_y);
        
        last.ext = inst.ext; 
        i_count++;
    }
    layer_count++;
    ilist.push("l"+layer_count+","+raw_x+","+raw_y);
  }
   return ilist;
}

function createArduinoInstructions(){
  var flavor = select_flavor;
  var last = {x:flavor.bbox.min.x, y:flavor.bbox.min.y,z:flavor.bbox.min.z,  ext:false};
  var min_ms = 1500 - select_flavor.half_angle*10;
  var ilist = {
    ls:[],
    msx:[],
    msy:[],
    layer_ids:[]};


  ilist.bx = [flavor.bbox.min.x, flavor.bbox.max.x, flavor.bbox.max.x, flavor.bbox.min.x];
  ilist.by = [flavor.bbox.min.y, flavor.bbox.min.y, flavor.bbox.max.y, flavor.bbox.max.y];
  
  for(var i in ilist.bx){
    var ms  = select_flavor.toMicroseconds(0, ilist.bx[i], ilist.by[i]);
    ilist.bx[i] = ms.x - min_ms;
    ilist.by[i] = ms.y - min_ms;
  }

  var i_count = 0;

  //go through and make the instructions
  for(var l in flavor.a_is){
    for(var i in flavor.a_is[l]){
      var inst = flavor.a_is[l][i];

        i_count++;
        var raw_x = inst.obj.microseconds.x;
        var raw_y = inst.obj.microseconds.y;
        ilist.msx.push(raw_x - min_ms);
        ilist.msy.push(raw_y - min_ms);
        
        if(last.ext == true){
          ilist.ls.push(1);
        }else{
          ilist.ls.push(0);
        }
        last.ext = inst.ext; 
    }
    ilist.layer_ids.push(i_count+1); //add 1 since we want the id of the first instruction on the next layer
  }
  ilist.layer_ids.push(0); //use this to make sure we don't overshoot the array bounds in arduino

   return ilist;
}

function getArduinoFile(){
  var lines = [];
  var ilist = createArduinoInstructions(); 
  var env = select_flavor.env;

  
  console.log("Model Width = "+env.dim.x);
  console.log("Model Height= "+env.dim.y);
  console.log("Dist To Base = "+env.distance_to_base);
  console.log("Material Height = "+select_flavor.material_height);
  console.log("Material Diameter = "+select_flavor.diameter);
  console.log("Model Height"+select_flavor.bbox.dim.z);

  lines.push("int inst_num = "+ilist.msx.length+";")
    lines.push("const PROGMEM uint8_t xs[] = {"+ilist.msx.join(",")+"};")
    lines.push("const PROGMEM uint8_t ys[] = {"+ilist.msy.join(",")+"};")
    lines.push("const PROGMEM uint8_t ls[] = {"+ilist.ls.join(",")+"};")
    lines.push("const PROGMEM uint8_t bx[] = {"+ilist.bx.join(",")+"};")
    lines.push("const PROGMEM uint8_t by[] = {"+ilist.by.join(",")+"};")
   lines.push("const PROGMEM uint16_t layers[] = {"+ilist.layer_ids.join(",")+"};")
  return lines;  

  return this;
}


