//a new output flavor is created everytime an option changes in the options panel
function outputFlavor(instructions, diameter, height, angle, raw, distance_to_wall, half_angle){
    //MODEL PARAMS
    this.is = instructions;                     //raw instrutions
    this.a_is = [];                              //arduino instructions
    this.bbox = [];                             //this will store the bounding box of the model

    //MATERIAL PARAMS
    this.diameter = diameter;                   // material diameter
    this.material_height = height;              // material height

    //HARDWARE PARAMS
    this.angle = angle;                         // tilt of the system off the y-axis
    this.half_angle = half_angle;               // half of the full range of the system (wider range = shorter distance to wall)
    
    //ENVIRONMENT PARAMS
    this.env = [];
    
    //order matters here
    this.updateInstructionHeight(this.is, this.material_height);  //updates based on material_height
    this.bbox = this.boundingBox();             
    this.env = this.setupEnvironment(distance_to_wall, half_angle); 
    

    this.a_is = this.arduinoInstructions();     //store instructions as arduino sees them
    if(!raw) this.is = this.a_is.slice(0);      //if we want to display arduino instructions, copy the array and store as instrucitons

    //RENDER PARAMS
    this.object = this.createObjectFromInstructions(this.is);
    this.plane = this.createPlane(this.is);

    console.log("NEW FLAVOR CREATED");
    console.log(this);
}

outputFlavor.prototype.is = [];
outputFlavor.prototype.diameter= 0;
outputFlavor.prototype.material_height = 0;
outputFlavor.prototype.half_angle = 10;
//outputFlavor.prototype.distance_to_wall = 0;
outputFlavor.prototype.angle = 0;//added 1-5-15
outputFlavor.prototype.bbox = undefined;
outputFlavor.prototype.env = undefined;
outputFlavor.prototype.plane = undefined;
outputFlavor.prototype.object = undefined;
outputFlavor.prototype.a_is = undefined;




//If I'm not mistaken this will just run once everytime an option is changed  
outputFlavor.prototype.updateInstructionHeight = function(is, material_height){
  for(var l in is){
    for(var i in is[l]){
      inst = is[l][i];
      inst.coord.z = l * material_height;
    }
  }
} 


//instructions in arduino format for output
outputFlavor.prototype.arduinoInstructions = function(){
  var a_is = [];

  for(var l in this.is){
      a_is.push([]);
      for(var i in this.is[l]){
        var inst = this.is[l][i];   
       

       if(inst.type == "G1"){ 
         var ai = {
            text: inst.text,
            desc: inst.desc, 
            type: inst.type,
            coord: {x: inst.coord.x, y:inst.coord.y, z:inst.coord.z},
            ext: inst.ext,
            obj: inst.obj
          };
        
          inst.obj.microseconds = this.toMicroseconds(l, inst.coord.x, inst.coord.y);
          ai.coord = this.fromMicroseconds(l, inst.obj.microseconds.x, inst.obj.microseconds.y);
          ai.coord.z = l * this.material_height;
          a_is[l].push(ai);
         }
      }
  }
  return this.cleanInstructions(a_is);
}

outputFlavor.prototype.boundingBox = function(){
  var bbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };

  for(var l in this.is){
    for(var i in this.is[l]){
      inst = this.is[l][i];
      if(inst.type == "G1" && inst.ext){
  
      bbox.min.x = Math.min(bbox.min.x, inst.coord.x);
      bbox.min.y = Math.min(bbox.min.y, inst.coord.y);
      bbox.min.z = Math.min(bbox.min.z, inst.coord.z);
      bbox.max.x = Math.max(bbox.max.x, inst.coord.x);
      bbox.max.y = Math.max(bbox.max.y, inst.coord.y);
      bbox.max.z = Math.max(bbox.max.z, inst.coord.z);

      }
    }
  }
  
  for(var l in this.is){
    for(var i in this.is[l]){
      inst = this.is[l][i];
      if(inst.coord.x == null) inst.coord.x = bbox.min.x; 
      if(inst.coord.y == null) inst.coord.y = bbox.min.y; 
    }
  }

  bbox.dim = {
    x: Math.abs(bbox.max.x - bbox.min.x), 
    y: Math.abs(bbox.max.y - bbox.min.y), 
    z: Math.abs(bbox.max.z - bbox.min.z)
  };

  //calculate center of box based on instructions
  bbox.ctr = {
    x: bbox.min.x + bbox.dim.x/2., 
    y: bbox.min.y + bbox.dim.y/2.
  };

  //store the greater of the x or y dimension - used to calcuate system distance
  bbox.max_dim = (bbox.dim.x > bbox.dim.y) ? bbox.dim.x: bbox.dim.y;

  return bbox;
}

//the building environment stores the state of the 
outputFlavor.prototype.setupEnvironment = function(distance_to_wall, half_angle){
  var build_env = [];
  var bbox = this.bbox;
  var dist_to_top_layer = -1;

  // build_env.model_height = this.material_height*(this.is.length+1);
  // console.log("CHECK: model_height vs. bbox.dim.z", build_env.model_height, bbox.dim.z);

  if(distance_to_wall == -1){
    if(this.half_angle == -1) console.log("ERROR: both distance and half angle undefined");
    var dist_to_top_layer = (bbox.max_dim/2.) / Math.tan(deg_to_rad(half_angle));
    build_env.distance_to_base = parseInt(dist_to_top_layer + this.bbox.dim.z); 

  }else{
    build_env.distance_to_base = distance_to_wall;
    var opp = bbox.max_dim/2.;
    var dist_to_top_layer = build_env.distance_to_base - this.bbox.dim.z;
    this.half_angle = parseInt(rad_to_deg(Math.atan(opp/dist_to_top_layer)));
  }

  return build_env;
}


outputFlavor.prototype.cleanInstructions = function(a_is){
  var instructions = [];
  var build_env = this.env;
  var last = undefined;
  for(var l in a_is){
    var layer = [];
    var path = [];
    var inst = undefined;
    for(var i in a_is[l]){
      inst = a_is[l][i];
      
      if(inst.type == "G1"){
        if(last != undefined){
          
           
          if(inst.obj.microseconds.x == last.obj.microseconds.x && inst.obj.microseconds.y == last.obj.microseconds.y  && inst.ext == last.ext){
          
           }else if(!inst.ext && !last.ext){
          
          }else{
            layer.push(inst);
          }
        }else{
          layer.push(inst);
        }
         
        last = inst;
        }

      }

    instructions.push(layer);
  }
    return instructions; 

}


outputFlavor.prototype.createObjectFromInstructions = function(instructions) {

  var layers = [];
  var layer = undefined;
  var bbox = this.bbox;

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
        feed: true,
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
    geometry.vertices.push(new THREE.Vector3(p1.x, p1.y, -p1.z));
    geometry.vertices.push(new THREE.Vector3(p2.x, p2.y, -p2.z));
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

          if(last.ext && inst.type == "G1") addSegment(inst, p1, p2);
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
    bbox.min.x + ((bbox.max.x - bbox.min.x) / 2),
    bbox.min.y + ((bbox.max.y - bbox.min.y) / 2),
    bbox.min.z + ((bbox.max.z - bbox.min.z) / 2)
    );
    object.rotation.z = Math.PI;
    object.position = center.multiplyScalar(scale);
    object.scale.multiplyScalar(scale);

    return object;
}

outputFlavor.prototype.createPlane = function (instructions){
  var z;
  var bbox = this.bbox;
   z = 0;


  var material = new THREE.MeshBasicMaterial( {color: "#005B66", side: THREE.DoubleSide} );
  var geometry = new THREE.PlaneGeometry(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);

  plane = new THREE.Mesh( geometry, material );
  
  var center = new THREE.Vector3(
      bbox.min.x + ((bbox.max.x - bbox.min.x) / 2),
      bbox.min.y + ((bbox.max.y - bbox.min.y) / 2), 
      -bbox.min.z);
  
  plane.position = center;
  this.object.add(plane);	

  var color_rand = 0.7549;
  var textMaterial = new THREE.MeshBasicMaterial( { color: "#CB1300", overdraw: 0.5 } );
  var lineMaterial = new THREE.LineBasicMaterial( { color: "#CB1300"} );
  var text_objects = [];
  var line_objects = [];
  var i;
  var dimension;
  for(i = 0; i< 3; i++){
    line_objects[i] = new THREE.Geometry();
    
    if(i == 0){
      axis = "x";
      dimension = bbox.max.x - bbox.min.x;
      line_objects[i].vertices.push(
        new THREE.Vector3(bbox.min.x, bbox.min.y -5 , -bbox.min.z),
        new THREE.Vector3(bbox.max.x, bbox.min.y -5 , -bbox.min.z)
      );
    }

    if(i == 1){
      axis = "y";
      dimension = bbox.max.y - bbox.min.y;
      line_objects[i].vertices.push(
        new THREE.Vector3(bbox.min.x-5, bbox.min.y, -bbox.min.z),
        new THREE.Vector3(bbox.min.x-5, bbox.max.y, -bbox.min.z)
      );
    }

    if(i == 2){
      axis = "z";
      dimension = bbox.max.z - bbox.min.z;
      line_objects[i].vertices.push(
        new THREE.Vector3(bbox.min.x-5, bbox.min.y -5 , -bbox.min.z),
        new THREE.Vector3(bbox.min.x-5, bbox.min.y -5 , -bbox.max.z)
      );

    }

    dimension = Math.round(dimension * 10) / 10; 
    text_objects[i] = new THREE.TextGeometry(dimension+" mm", {
    size:4,
    height: 1,
    curveSegments: 2, 
    font: "helvetiker"  
    });
   
    text_objects[i].computeBoundingBox();

    var centerOffset = -0.5 * ( text_objects[i].boundingBox.max.x - text_objects[i].boundingBox.min.x );
    var text = new THREE.Mesh( text_objects[i], textMaterial );
    var line = new THREE.Line(line_objects[i], lineMaterial);

    if(i == 0){
      text.position.x =  bbox.min.x + 0.5*dimension + centerOffset;
      text.position.y =  bbox.min.y - 10;
      text.position.z = -z;
      text.rotation.x = Math.PI;
    }

    if(i == 1){
      text.position.x = bbox.min.x - 10;
      text.position.y = bbox.min.y + (dimension * 0.5) + centerOffset;
      text.position.z = -z;
      text.rotation.z = Math.PI * 0.5;
      text.rotation.y = Math.PI;
    }

    if(i == 2){
      text.position.x = bbox.min.x-5;
      text.position.y = bbox.min.y-10; 
      text.position.z = -1 * (bbox.min.z + (dimension * 0.5)- centerOffset);
      text.rotation.y = Math.PI * 0.5;
      text.rotation.x = Math.PI;
    }

    this.object.add(text);	
    this.object.add(line);	


  }
  return plane;
}


//updated 1-10 - no longer adjusting parameters to the size of a byte
outputFlavor.prototype.toMicroseconds = function(layer_id, x, y){ 

  var build_env = this.env;
  var adj_height = build_env.distance_to_base - (layer_id)*this.material_height; //distance from laser to current laser (


  if(layer_id == 0 && x == 0 && y == 0){ //assume this is a starting block
    x = this.bbox.min.x;
    y = this.bbox.min.y;
  }

    var theta = {
      x: rad_to_deg(Math.atan((x - this.bbox.ctr.x)/adj_height)) +  90,
      y: rad_to_deg(Math.atan((y - this.bbox.ctr.y)/adj_height)) +  90.
    };  

    var low = 90 - this.half_range;
    var high = 90 + this.half_range;

      if(theta.x > high || theta.x < low){
      console.log("Error - theta out of range: "+theta.x );
      console.log(this.bbox.min.x, x);
      console.log(x, y);
    }

    var ms_per_theta = 10; //this is hardware dependent (2400 - 600 = 1800 1800/180 = 10)

    var ms = {
      x: parseInt(theta.x*ms_per_theta + 600),
      y: parseInt(theta.y*ms_per_theta + 600)
    };

    if(this.angle != 0){
      //recalculates the y values if there is an angle offset (which assumes y direction)
      var dy = y - this.bbox.min.y;
      var t_diff = deg_to_rad(-this.half_angle + this.angle); 
      var y_new_min = adj_height*Math.atan(t_diff + 90) + this.bbox.ctr.y;
      var new_y = y_new_min + dy;

      theta.y = rad_to_deg(Math.tan((new_y - this.bbox.ctr.y)/adj_height));
      theta.y = theta.y + 90;

    }
  

  return ms;  
}

//to do figure out why microseconds isn't writing the full range
outputFlavor.prototype.fromMicroseconds = function(layer_id,x, y){ 
  var ms_per_theta = 10; //this is hardware dependent (2400 - 600 = 1800 1800/180 = 10)
  var build_env = this.env;
  
  //var min_ms = (1500 - half_range*ms_per_theta) - 600;
  var adj_height = build_env.distance_to_base - (layer_id)*this.material_height;
  
  var theta = {
    x: (x - 600) /ms_per_theta,
    y: (y - 600) /ms_per_theta 
  };

  var coord = {
    x: adj_height * Math.tan(deg_to_rad(theta.x - 90)) + this.bbox.ctr.x,
    y: adj_height * Math.tan(deg_to_rad(theta.y - 90)) + this.bbox.ctr.y
  }

  if(this.angle != 0){
    var dy = y - this.bbox.min.y;
    var t_diff = deg_to_rad(-this.half_angle + this.angle); 
    var y_new_min = adj_height*Math.atan(t_diff) + this.bbox.ctr.y;
    var new_y = y_new_min + dy;
    coord.y =  adj_height * Math.atan(deg_to_rad(theta.y -90)) + this.bbox.ctr.y;

  }

  return coord;  
}

