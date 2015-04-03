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
  count = 0;

  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code

  var layers = [];
  var layer = undefined;


  instructions.push([]); //push an empty layer  

  var has_z = false;
  var lastLine = {x:null, y:null, z:0, e:0, f:0, extruding:false};

  var relative = false;
  function delta(v1, v2) {
    return relative ? v2 : Math.abs(v2 - v1);
  }
  function absolute (v1, v2) {
    return relative ? v1 + v2 : v2;
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

      function isValid(line){
        if(line.x === null) return false;
        if(line.y === null) return false;
        if(line.z === null) return false;
        return true;
      };

 

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
      };


      if(isValid(newLine) && isValid(lastLine)){
        // console.log(newLine);
        // console.log(lastLine);
        var de = delta(lastLine.e, newLine.e);
        var dx = delta(lastLine.x, newLine.x);
        var dy = delta(lastLine.y, newLine.y);
        var dz = delta(lastLine.z, newLine.z);

        if(dx > 0 || dy > 0 || dz > 0){
          if(instructions.length == 0 || dz > 0){
            instructions.push([]); //create a new layer of instructions 
            layer_heights.push(dz);

            //push the first valid instruction twice so we don't loose the starting point since all 
            //the instructions will be referencing their "to" location
            if(instructions.length == 0){
              var instruction = {
                id: count++, //this is a unique id for the instruction
                z: lastLine.z,
                to: {x:lastLine.x, y:lastLine.y},
                ext: (de > 0)
              };
              instructions[instructions.length-1].push(instruction);

            }

          }

          //only add an instruction if there has been some movement in the xy plane
          //if(dx > 0 || dy > 0){
            var instruction = {
              id: count++, //this is a unique id for the instruction
              z: lastLine.z,
              to: {x:newLine.x, y:newLine.y},
              ext: (de > 0)
            };


            instructions[instructions.length-1].push(instruction);
          //}
        }else{
          // console.log("no movement at "+count);
          // console.log(lastLine);
          // console.log(newLine);
          // console.log(dx);
        }
      }else{
        console.log("invalid at "+count);
      }

      lastLine = newLine;

    },


    // G21: function(args) {
    //   // G21: Set Units to Millimeters
    //   // Example: G21
    //   // Units from now on are in millimeters. (This is the RepRap default.)
    //   // No-op: So long as G20 is not supported.
    //   var i = {
    //     text: "G21",
    //     desc: "Set Units to Millimeters (RepRap Default)",
    //     type: "G21",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);
    // },

    G28: function(args) {
      // G28: Return to Origin
      // Example: G28
      // no op at this point
      // var i = {
      //   text: "G28",
      //   desc: "Move To Origin",
      //   type: "G28",
      //   ext: extruder_value,
      //   coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
      //   obj:null};

      //   instructions[instructions.length-1].push(i);
    },


    G90: function(args) {
      // G90: Set to Absolute Positioning
      // Example: G90
      // All coordinates from now on are absolute relative to the
      // origin of the machine. (This is the RepRap default.)
      // var i = {
      //   text: "G90",
      //   desc: "Set to Absolute Positioning (RepRap Default)",
      //   type: "G90",
      //   ext: extruder_value,
      //   coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
      //   obj:null};
      //   //instructions[instructions.length-1].push(i);

        relative = false;
    },

    // G91: function(args) {
    //   // G91: Set to Relative Positioning
    //   // Example: G91
    //   // All coordinates from now on are relative to the last position.

    //   //TODO
    //   var i = {
    //     text: "G91",
    //     desc: "Set to Relative Positioning (not supported by visualization)",
    //     type:"G91",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    //     relative = true;
    // },

    // G92: function(args) { // E0
    //   // G92: Set Position
    //   // Example: G92 E0
    //   // Allows programming of absolute zero point, by reseting the
    //   // current position to the values specified. This would set the
    //   // machine's X coordinate to 10, and the extrude coordinate to 90.
    //   // No physical motion will occur.

    //   // TODO: Only support E0
    //   var newLine = lastLine;
    //   newLine.x= args.x !== undefined ? args.x : newLine.x;
    //   newLine.y= args.y !== undefined ? args.y : newLine.y;
    //   newLine.z= args.z !== undefined ? args.z : newLine.z;
    //   newLine.e= args.e !== undefined ? args.e : newLine.e;

    //   var instruction_text = "G92";
    //   if(args.x !== undefined) instruction_text = instruction_text +" X"+args.x;
    //   if(args.y !== undefined) instruction_text = instruction_text +" Y"+args.y;
    //   if(args.z !== undefined) instruction_text = instruction_text +" Z"+args.z;
    //   if(args.e !== undefined) instruction_text = instruction_text +" E"+args.e;

    //   var i = {
    //     text: instruction_text,
    //     desc: "Set Position: Set Machine Zero Point (not supported by visualization)",
    //     type:"G92",
    //     ext: extruder_value || (delta(lastLine.e, newLine.e) > 0),
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    //     lastLine = newLine;
    // },

    // M82: function(args) {
    //   // M82: Set E codes absolute (default)
    //   // Descriped in Sprintrun source code.

    //   // No-op, so long as M83 is not supported.
    // },

    // M84: function(args) {
    //   // M84: Stop idle hold
    //   // Example: M84
    //   // Stop the idle hold on all axis and extruder. In some cases the
    //   // idle hold causes annoying noises, which can be stopped by
    //   // disabling the hold. Be aware that by disabling idle hold during
    //   // printing, you will get quality issues. This is recommended only
    //   // in between or after printjobs.

    //   // No-op
    // },

    // M101: function(args) {
    //   var i = {
    //     text: "M101",
    //     desc: "Turn Extruder 1 on Forward", 
    //     type:"M101",
    //     ext: true, 
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);
    //     extruder_value = true;

    // },


    // M103: function(args) {
    //   var i = {
    //     text: "M103",
    //     desc: "Turn all extruders off", 
    //     type:"M103",
    //     ext:false,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);
    //     extruder_value = false;

    // },

    // M104: function(args) {
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M104 "+itext,
    //     desc: "Set Extruder Temp to S (Celcius)",
    //     type:"M104",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);
    // },

    // M105: function(args) {
    //   var i = {
    //     text: "M105",
    //     desc: "Get Extruder Temperature", 
    //     type:"M105",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //    // instructions[instructions.length-1].push(i);

    // },

    // M106: function(args) {

    //   var itext = (args.s !== undefined) ? " S"+args.s : "";
    //   var i = {
    //     text: "M106 "+itext, 
    //     desc: "Turn Fan On",
    //     type:"M106",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },

    // M107: function(args) {

    //   var itext = (args.s !== undefined) ? " S"+args.s : "";
    //   var i = {
    //     text: "M107",
    //     desc: "Fan Off (Deprecated)",
    //     type:"M107",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },

    // M108: function(args) {
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M108 "+itext,
    //     desc: "Set Extruder Motor Speed to S (deprecated)",
    //     type:"M108",
    //     ext: false,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    //     //I'm going to assume that this turns the extruder off
    //     //if(args.s !== undefined) extruder_value = args.s/210;
    //     extruder_value = false;

    // },
    // M109: function(args) {
    //   var i = {
    //     text: "M109",
    //     desc: "Set Extruder Temperature and Wait", 
    //     type:"M109",
    //     ext: false,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },


    // M113: function(args) {
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M113 "+itext,
    //     desc: "Set Extruder PWM to S (.1 = 10%)",
    //     type:"M113",
    //     ext: true,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    //     extruder_value = true;
    // },


    // M140: function(args) {
    //   // Example: M140 S55
    //   //Set the temperature of the build bed to 55oC and return control to the host immediately (i.e. before that temperature has been reached by the bed).
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M140 "+itext,
    //     desc: "Set Temperature of Bed to S (Celcius) and return control before it gets to that temp",
    //     type:"M140",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },


    // M141: function(args) {
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M141 "+itext,
    //     desc: "Set Temperature of Chamber to S (Celcius) and return control before it gets to that temp",
    //     type:"M141",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },

    // M142: function(args) {
    //   var itext = (args.s !== undefined) ? "S"+args.s : "";
    //   var i = {
    //     text: "M142 "+itext,
    //     desc: "Set Holding Pressure of Bed to S (bars)",
    //     type:"M142",
    //     ext: extruder_value,
    //     coord: {x:lastLine.x, y:lastLine.y, z:lastLine.z},
    //     obj:null};
    //     //instructions[instructions.length-1].push(i);

    // },
    'default': function(args, info) {
      //console.error('Unknown command:', args.cmd, args, info);
    },
  });

  
  parser.parse(gcode);

  var most = 0;
  var count = 0;
  var material_size = 0;
  var angle = 0;

  material_size = layer_heights.pop();


  // if(layer_heights.length > 0){ 
  //   for(var i in layer_heights){
  //     count++;
  //     console.log(i, layer_heights[i]);
  //     if(layer_heights[i] > most){
  //       most = layer_heights[i];
  //       material_size = i;
  //     }
  //   }
  // }
  


  if(count > 1) 
      console.log("ERROR: Multiple Layer Heights Detected, Using Most Common For Printing");
      console.log("Material size is "+material_size);


 for(var l in instructions){
    for(var i in instructions[l]){
      instructions[l][i].to.y *= -1;
    }
  }



  raw_flavor = new outputFlavor(instructions, material_size, material_size, angle, true, -1, 10, -1, -1);
  select_flavor = new outputFlavor(instructions.slice(0), material_size, material_size, angle, render_raw, raw_flavor.laser.z, raw_flavor.half_angle, 0, raw_flavor.is.length);

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

  console.log("bounding box");
    console.log(bx);
  for(var i in bx){
    var ms  = select_flavor.toMicroseconds(0, bx[i], by[i], flavor.bbox.max.z);
    bx[i] = ms.x;
    by[i] = ms.y;
    console.log(ms);
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

function computeArduinoBounds(){
  var flavor = select_flavor;
  var min_ms = 1500 - select_flavor.half_angle*10;
  var bounds = {
    x: {min: flavor.bbox.min.x, max: flavor.bbox.max.x},
    y: {min: flavor.bbox.min.y, max: flavor.bbox.max.y},
  };

  var ms_min  = select_flavor.toMicroseconds(0, bounds.x.min, bounds.y.min, flavor.bbox.max.z);
  var ms_max  = select_flavor.toMicroseconds(0, bounds.x.max, bounds.y.max, flavor.bbox.max.z);

  bounds.x = {min: ms_min.x, max: ms_max.x};
  bounds.y = {min: ms_min.y, max: ms_max.y};

  return bounds;
}

  

function getArduinoFile(){
  var lines = [];
  var ilist = createArduinoInstructions(); 
  var env = select_flavor.env;
  var dist = Math.round(select_flavor.laser.z * 100 ) / 100; 
  
  console.log("Model Width = "+select_flavor.bbox.dim.x);
  console.log("Model Height= "+select_flavor.bbox.dim.y);
  console.log("Dist To Base = "+dist);
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


