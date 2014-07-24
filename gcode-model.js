var bbbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
var ebbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
var build_env = {
  material_size: 0,
  max_dim: 0,
  height: 0
};
var extruder_value = false;
var instructions = [];

//we need a function that doesn't return object but has the parsing
//2D/3D independent
function createGeometryFromGCode(gcode) {
  instructions = [];
  layer_heights = [];
  bbbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
  ebbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
  extruder_value = false;

  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code


  instructions.push([]); //push an empty layer  


  var has_z = false;
  var lastLine = {x:0, y:0, z:0, e:0, f:0, extruding:false};

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
      coords: {dx: dx, dy:dy, dz:dz},  
      d_traveling: move_distance,
      d_extruding: e,
    }


    bbbox.min.x = Math.min(bbbox.min.x, p2.x);
    bbbox.min.y = Math.min(bbbox.min.y, p2.y);
    bbbox.min.z = Math.min(bbbox.min.z, p2.z);
    bbbox.max.x = Math.max(bbbox.max.x, p2.x);
    bbbox.max.y = Math.max(bbbox.max.y, p2.y);
    bbbox.max.z = Math.max(bbbox.max.z, p2.z);

    if (e>0) {
      ebbox.min.x = Math.min(ebbox.min.x, p2.x);
      ebbox.min.y = Math.min(ebbox.min.y, p2.y);
      ebbox.min.z = Math.min(ebbox.min.z, p2.z);
      ebbox.max.x = Math.max(ebbox.max.x, p2.x);
      ebbox.max.y = Math.max(ebbox.max.y, p2.y);
      ebbox.max.z = Math.max(ebbox.max.z, p2.z);
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
  setupEnvironment(layer_heights);

  for(l in instructions){
    for(i in instructions[l]){
      var inst = instructions[l][i];
      if(inst.type == "G1"){ 
        inst.obj.microseconds = toMicroseconds(l, inst.coord.x, inst.coord.y);
        inst.obj.adj = fromMicroseconds(l, inst.obj.microseconds.x, inst.obj.microseconds.y);
      }
    }
  }

  cleanInstructions(instructions);

}

function setupEnvironment(layer_heights){
  var most = 0
  var count = 0;
  if(layer_heights.length > 1) 
  for(var i in layer_heights){
    count++;
    if(layer_heights[i] > most){
      most = layer_heights[i];
      build_env.material_size = i;
    }
  }
  if(count > 1) 
      console.log("ERROR: Multiple Layer Heights Detected, Using Most Common For Printing");
  console.log("Material size is "+build_env.material_size);

  
  build_env.dim = {x: ebbox.max.x - ebbox.min.x, y: ebbox.max.y - ebbox.min.y};
  build_env.ctr = {x: ebbox.min.x + build_env.dim.x/2., y: ebbox.min.y + build_env.dim.y/2.};
  build_env.max_dim = (build_env.dim.x > build_env.dim.y) ? build_env.dim.x: build_env.dim.y;
  var dist_to_top_layer = (build_env.max_dim/2.) / Math.tan(deg_to_rad(10));
  build_env.height = dist_to_top_layer + build_env.material_size*(instructions.length+1);
  build_env.model_height = build_env.height - dist_to_top_layer;
}

function isValidDistance(p1, p2, d){
  dx = Math.abs(p1.x - p2.x);
  dy = Math.abs(p1.y - p2.y);
  h = dx*dx + dy*dy;
  
  return (h > d);

}

//run this to delete any badly formed or multiple instructions
//when printing to arduino
function cleanInstructions(to_clean){
  instructions = [];
  var mat2 = build_env.material_size*build_env.material_size/4;

  for(var l in to_clean){
    var layer = [];
    var path = [];
    var inst = undefined;
    var last = undefined;
    for(var i in to_clean[l]){
      inst = to_clean[l][i];
      
      if(inst.type == "G1"){
        if(last != undefined){
          //the head is at last and going to inst
          if(!last.ext && inst.ext){
            layer.push(path[0]); //if it isn't extruding and has more than one element, simplify

            path = [];
            path.push(inst);
            
          
          }else if(last.ext && !inst.ext){
            if(isValidDistance(path[0].obj.adj, inst.obj.adj, mat2)){
              layer.push(path[0]);
            }

            path = [];
            path.push(inst);

          }else if(last.ext && inst.ext){
            //check to see if we've moved far enough
            
            if(isValidDistance(inst.obj.adj, path[0].obj.adj, mat2)){
              layer.push(path[0]);
              path = [];
              path.push(inst);
            }
         
          }else{
            path.push(inst);
          }
        }
        
        path.push(inst);
        last = inst;
      }
    }
    layer.push(inst);


    instructions.push(layer);
  }
   
}

function createObjectFromInstructions() {

  var layers = [];
  var layer = undefined;

  function newLayer(z) {
    layer = { type: {}, layer: layers.count(), z: z};
    layers.push(layer);
  }

  function getLineGroup(i, line){

    if(layer == undefined) newLayer(line);	
    var grouptype = (i.ext ? 10000 : 0) + i.speed;
    var color = new THREE.Color(i.ext ? 0xffffff : 0x0000ff);
    if (layer.type[grouptype] == undefined) {
      layer.type[grouptype] = {
        type: grouptype,
        feed: i.obj.d_extruding,	
        extruding: i.ext,
        color: color,
        segmentCount: 0,
        material: new THREE.LineBasicMaterial({
          opacity:0.5,
          transparent:true,
          linewidth:1,
          vertexColors: THREE.FaceColors }),
          geometry: new THREE.Geometry(),
      }
    }
    return layer.type[grouptype];
  }
  function addSegment(i, p1, p2) {
    var group = getLineGroup(i, p2);
    var geometry = group.geometry;


    group.segmentCount++;
    geometry.vertices.push(new THREE.Vector3(p1.x, p1.y, p1.z));
    geometry.vertices.push(new THREE.Vector3(p2.x, p2.y, p2.z));
    geometry.colors.push(group.color);
    geometry.colors.push(group.color);
  }

  for(var l in instructions){
    if(instructions[l].length > 0){
      newLayer(instructions[l][instructions[l].length-1].coord); 
      var last = undefined;
      var inst;
      for(var i in instructions[l]){
        inst = instructions[l][i];
        if(last != undefined){
          var p1 = last.coord; //where it's at
          var p2 = inst.coord; //where it's going once the instruction executes

          if(last.ext) addSegment(inst, p1, p2);
        }
        last = inst;
      }
    }
  }

  console.log("Layer Count ", layers.count());

  var object = new THREE.Object3D();

  for (var lid in layers) {
    var layer = layers[lid];
    for (var tid in layer.type) {
      var type = layer.type[tid];
      object.add(new THREE.Line(type.geometry, type.material, THREE.LinePieces));
    }
  }

  // Center
  var scale = 2; // TODO: Auto size

  var center = new THREE.Vector3(
    ebbox.min.x + ((ebbox.max.x - ebbox.min.x) / 2),
    ebbox.min.y + ((ebbox.max.y - ebbox.min.y) / 2),
    ebbox.min.z + ((ebbox.max.z - ebbox.min.z) / 2));
    console.log("center ", center);

    object.position = center.multiplyScalar(-scale);

    object.scale.multiplyScalar(scale);

    return object;
}


function rad_to_deg(x){
  return  x * 180. / Math.PI;
}


function deg_to_rad(x){
  return  x * Math.PI / 180;
}

//to do figure out why microseconds isn't writing the full range
function fromMicroseconds(layer_id,x, y){ 
  var ms_per_theta = 10;
  var min_ms = 800;
  var adj_height = build_env.height - (layer_id)*build_env.material_size;
  
  var theta = {
    x: (min_ms+x)/ms_per_theta,
    y: (min_ms+y)/ms_per_theta 
  };

  var coord = {
    x: adj_height * Math.tan(deg_to_rad(theta.x - 90)) + build_env.ctr.x,
    y: adj_height * Math.tan(deg_to_rad(theta.y - 90)) + build_env.ctr.y
  }


  return coord;  
}


//to do figure out why microseconds isn't writing the full range
function toMicroseconds(layer_id,x, y){ 
  //make sure to account for material height here. 
  var adj_height = build_env.height - (layer_id)*build_env.material_size;

  if(layer_id == 0 && x == 0 && y == 0){ //assume this is a starting block
    x = ebbox.min.x;
    y = ebbox.min.y;
  }


  var theta = {
    x: rad_to_deg(Math.atan((x - build_env.ctr.x)/adj_height)) +  90,
    y: rad_to_deg(Math.atan((y - build_env.ctr.y)/adj_height)) +  90.
  };  

    if(theta.x > 110 || theta.x < 80){
    console.log("Error - theta out of range: "+theta.x );
    console.log(ebbox.min.x, x);
  }

  var ms_per_theta = 10;
  var min_ms = 800;


  var ms = {
    x: parseInt(theta.x*ms_per_theta - min_ms),
    y: parseInt(theta.y*ms_per_theta - min_ms)
  };
  
  if(ms.x > 200 || ms.x < 0){
    console.log("Error - ms out of range");
  }


  return ms;  
}

function createArduinoInstructions(){
  var last = {x:ebbox.min.x, y:ebbox.min.y,z:ebbox.min.z,  ext:false};
  var ilist = {
    xs:[],
    ys:[],
    ls:[],
    msx:[],
    msy:[],
    layer_ids:[]};

  //go through and make the instructions
  for(var l in instructions){
    for(var i in instructions[l]){
      var inst = instructions[l][i];

      if(inst.type == "G1"){
        ilist.layer_ids.push(l);
        ilist.xs.push(inst.coord.x);
        ilist.ys.push(inst.coord.y);
        ilist.msx.push(inst.obj.microseconds.x);
        ilist.msy.push(inst.obj.microseconds.y);
        if(last.ext == true){
          ilist.ls.push(1);
        }else{
          ilist.ls.push(0);
        }
        
        last.x = inst.coord.x;
        last.y = inst.coord.y;
        last.z = inst.coord.z;
        last.ext = inst.ext;
      } 
    }
  }
   return ilist;
}


function getArduinoFile(){
  var lines = [];
  var ilist = createArduinoInstructions(); 


  
  console.log("Model Width = "+build_env.dim.x);
  console.log("Model Height= "+build_env.dim.y);
  console.log("Dist To Base = "+build_env.height);
  console.log("Material Size = "+build_env.material_size);
  console.log("Model Height = "+build_env.model_height);
  console.log("Model Height from BBOX = "+(ebbox.max.z - ebbox.min.z));

  lines.push("int inst_num = "+ilist.xs.length+";")
  lines.push("const PROGMEM uint8_t xs[] = {"+ilist.msx.join(",")+"};")
  lines.push("const PROGMEM uint8_t ys[] = {"+ilist.msy.join(",")+"};")
  lines.push("const PROGMEM uint8_t ls[] = {"+ilist.ls.join(",")+"};")
  return lines;  
}

function getMachineData(){
  var csv = [];
  var last = {x:0, y:0, ext:false};

  for(var l in instructions){
    for(var i in instructions[l]){
      var inst = instructions[l][i];
      var moved = (last.x != inst.coord.x && last.y != inst.coord.y);

      if(inst.type == "G1"){
        if(moved) csv.push(l+","+i+","+inst.coord.x+","+inst.coord.y+","+last.ext);
        last.x = inst.coord.x;
        last.y = inst.coord.y;
        last.ext = inst.ext;
      } 
    }
  }

    return csv.join("\n");

}

