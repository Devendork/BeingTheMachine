//a new output flavor is created everytime an option changes in the options panel
function outputFlavor(instructions, diameter, height, laser_to_center, raw, distance_to_wall, half_angle, min, max){
    //MODEL PARAMS
    this.a_is = [];                              //arduino instructions
    this.bbox = [];                             //this will store the bounding box of the model
    this.range = {min: min, max: max};
    var layer_id = 0;

    //this.is = instructions;                     //raw instrutions
    this.is = [];                     //raw instrutions
    for(var l in instructions){
      if((l >= this.range.min && l <= this.range.max) || (min == -1 && max == -1)){
        this.is[layer_id] = [];
        inst_id = 0;
        for(var i in instructions[l]){
            this.is[layer_id].push(instructions[l][i]);
        }
        layer_id++;
      }
    }


   // //go through and delete instructions
    // for(var i = 0;  i < 1869; i++){
    //   this.is[6].pop();
    // }

    //  for(var i = 0;  i < 1243; i++){
    //   this.is[8].pop();
    // }

    //     for(var i = 0;  i < 367; i++){
    //   this.is[12].pop();
    //}
    // //go through and delete instructions
    // for(var i = 0;  i < 1535; i++){
    //   this.is[8].pop();
    // }

    // for(var i = 0;  i < 1538; i++){
    //   this.is[10].pop();
    // }


    // for(var i = 0;  i < 488; i++){
    //   this.is[16].pop();
    // }

    //MATERIAL PARAMS
    this.diameter = diameter;                   // material diameter
    this.material_height = height;              // material height

    //HARDWARE PARAMS
    this.laser_to_center = parseInt(laser_to_center);                         // tilt of the system off the y-axis
    this.half_angle = half_angle;               // half of the full range of the system (wider range = shorter distance to wall)
   

    this.updateInstructionHeights();            //updates instructions based on material height
 
    //ENVIRONMENT PARAMS
    this.bbox = this.boundingBox();  
    this.laser = {
      x: this.bbox.ctr.x,
      y: this.bbox.ctr.y
    };

    if(distance_to_wall == -1){
      if(this.half_angle == -1) console.log("ERROR: both distance and half angle undefined");
      var dist_to_top_layer = (this.bbox.max_dim/2.) / Math.tan(deg_to_rad(this.half_angle));
      this.laser.z = parseInt(dist_to_top_layer + this.bbox.dim.z); 

    }else{
      this.laser.z = distance_to_wall;
      var opp = this.bbox.max_dim/2.;
      var dist_to_top_layer = this.laser.z - this.bbox.dim.z;
      this.half_angle = parseInt(rad_to_deg(Math.atan(opp/dist_to_top_layer)));
    }



    this.updateInstructionOffsets();

    this.a_is = this.arduinoInstructions();     //store instructions as arduino sees them
    if(!raw) this.is = this.a_is.slice(0);      //if we want to display arduino instructions, copy the array and store as instrucitons

    //RENDER PARAMS
    this.object = this.createObjectFromInstructions(this.is);
    //this.createLaser(this.laser);
    console.log("NEW FLAVOR CREATED");
    console.log(this);
}

outputFlavor.prototype.is = [];
outputFlavor.prototype.diameter= 0;
outputFlavor.prototype.material_height = 0;
outputFlavor.prototype.half_angle = 10;
outputFlavor.prototype.laser_to_center = 0;//added 1-5-15
outputFlavor.prototype.bbox = undefined;
outputFlavor.prototype.laser = undefined;
outputFlavor.prototype.plane = undefined;
outputFlavor.prototype.object = undefined;
outputFlavor.prototype.a_is = undefined;
outputFlavor.prototype.range = undefined;



// outputFlavor.prototype.updateInstructionAngle = function(){
//   if(this.laser_to_center == 0) return;
//   var t_diff = deg_to_rad(-this.half_angle + this.angle); 
  
//   for(var l in this.is){
//     for(var i in this.is[l]){
//       inst = this.is[l][i];
//       var adj_height = this.env.distance_to_base - inst.coord.z;
//       var dy = inst.coord.y - this.bbox.min.y;
//       var y_new_min = adj_height*Math.atan(t_diff) + this.bbox.ctr.y;
//       var new_y = y_new_min + dy;
//       this.is[l][i].coord.y = new_y;
//     }
//   }
   
//   var oldbbox = this.bbox;
//   this.bbox = this.boundingBox();             
//   this.env = this.setupEnvironment(this.env.distance_to_base, this.half_angle); 
//   console.log("bbox offset", oldbbox.min.y - this.bbox.min.y);



// }


//If I'm not mistaken this will just run once everytime an option is changed  
outputFlavor.prototype.updateInstructionHeights = function(){
  console.log("Update heights to :", this.material_height);
  for(var l in this.is){
    for(var i in this.is[l]){
      inst = this.is[l][i];
      inst.coord.z = l * this.material_height;
    }
  }
} 

//If I'm not mistaken this will just run once everytime an option is changed  
outputFlavor.prototype.updateInstructionOffsets = function(){
  if(this.laser_to_center == 0) return;
  for(var l in this.is){
    for(var i in this.is[l]){
      inst = this.is[l][i];
      inst.coord.y += this.laser_to_center; //+ moves down
    }
  }

  this.bbox.min.y += this.laser_to_center;
  this.bbox.max.y += this.laser_to_center;
  this.bbox.ctr.y += this.laser_to_center;

  var adj_height = this.laser.z - this.bbox.max.z;
  var theta = {
      min: rad_to_deg(Math.atan((this.bbox.min.y - this.laser.y)/adj_height)) +  90,
      max: rad_to_deg(Math.atan((this.bbox.max.y - this.laser.y)/adj_height)) +  90.
    };  

  console.log(theta);

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
        
          inst.obj.microseconds = this.toMicroseconds(l, inst.coord.x, inst.coord.y, inst.coord.z);
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
    y: bbox.min.y + bbox.dim.y/2.,
    z: bbox.min.z + bbox.dim.z/2.
  };

  //store the greater of the x or y dimension - used to calcuate system distance
  bbox.max_dim = (bbox.dim.x > bbox.dim.y) ? bbox.dim.x: bbox.dim.y;
  bbox.max_dim = (bbox.max_dim > bbox.dim.z) ? bbox.max_dim: bbox.dim.z;

  return bbox;
}



outputFlavor.prototype.cleanInstructions = function(a_is){
  var instructions = [];
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
  console.log("create object ", this.material_height);
  var layers = [];
  var layer = undefined;
  var bbox = this.bbox;

  function newLayer(z) {
    layer = { type: {}, layer: layers.length, z: z};
    layers.push(layer);
  }

  function getLineGroup(i, line){

    if(layer == undefined) newLayer(line);	
    var grouptype = (i.ext ? 10000 : 0) + i.speed;
    var color = new THREE.Color(i.ext ? 0x000000: 0x0000ff);
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
          linewidth:5,
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

  console.log("Layer Count ", layers.length);

  var object = new THREE.Object3D();
  object.name = "model";

  for (var lid in layers) {
    var layer = layers[lid];
    for (var tid in layer.type) {
      var type = layer.type[tid];
      var line = new THREE.Line(type.geometry, type.material, THREE.LinePieces);
      line.name = lid;
      object.add(line);
    }
  }

  var center = new THREE.Vector3(
    (bbox.dim.x / 2.),
    (bbox.dim.y / 2.),
    (-bbox.dim.z / 2.)
    );

  var min = new THREE.Vector3(
  bbox.min.x,
  bbox.min.y,
  -bbox.min.z
  );

  center.add(min);
  console.log(center);

  object.position = center.multiplyScalar(-1); //center this model
  object.add(this.createPlane());

  return object;
}

// outputFlavor.prototype.createLaser = function(laser){
//   console.log("laser");
//   var geometry = new THREE.BoxGeometry( 10, 10, 10 );
//   var material = new THREE.MeshBasicMaterial( {color: "#FF5B66", side: THREE.DoubleSide} );
//   var cube = new THREE.Mesh( geometry, material );
//     var laser_pos = new THREE.Vector3(
//       laser.x,
//       laser.y, 
//       laser.z);

//   cube.position = laser_pos;
//   this.object.add(cube); 

// }

outputFlavor.prototype.createPlane = function (instructions){
  var z;
  var bbox = this.bbox;
   z = 0;

  var info_obj = new THREE.Object3D();
  info_obj.name = "model_info"

  var material = new THREE.MeshBasicMaterial( {color: "#005B66", side: THREE.DoubleSide} );
  // material.transparent = true;
  // material.opacity = 0.7;
  var geometry = new THREE.PlaneGeometry(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
  var plane = new THREE.Mesh( geometry, material );
  
  var center = new THREE.Vector3(
      bbox.min.x + ((bbox.max.x - bbox.min.x) / 2),
      bbox.min.y + ((bbox.max.y - bbox.min.y) / 2), 
      -bbox.min.z);
  
  plane.position = center;
  plane.name = "plane";
  info_obj.add(plane);

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

    info_obj.add(text);	
    info_obj.add(line);	


  }
  return info_obj;
}


//updated 1-10 - no longer adjusting parameters to the size of a byte
outputFlavor.prototype.toMicroseconds = function(layer_id, x, y, z){ 

  //var adj_height = build_env.distance_to_base - (layer_id)*this.material_height; //distance from laser to current laser (
  var adj_height = this.laser.z - z; //distance from laser to current laser (


  if(layer_id == 0 && x == 0 && y == 0){ //assume this is a starting block
    x = this.bbox.min.x;
    y = this.bbox.min.y;
  }

    var theta = {
      x: rad_to_deg(Math.atan((x - this.laser.x)/adj_height)) +  90,
      y: rad_to_deg(Math.atan((y - this.laser.y)/adj_height)) +  90.
    };  

    var low = 90 - 35;
    var high = 90 + 35;

      if(theta.x > high || theta.x < low){
      console.log("Error - theta out of max range: "+theta.x );
      console.log(x, y);
    }

    var ms_per_theta = 10; //this is hardware dependent (2400 - 600 = 1800 1800/180 = 10)

    var ms = {
      x: parseInt(theta.x*ms_per_theta + 600),
      y: parseInt(theta.y*ms_per_theta + 600)
    };
  

  return ms;  
}

//to do figure out why microseconds isn't writing the full range
outputFlavor.prototype.fromMicroseconds = function(layer_id,x, y){ 
  var ms_per_theta = 10; //this is hardware dependent (2400 - 600 = 1800 1800/180 = 10)
  
  //var min_ms = (1500 - half_range*ms_per_theta) - 600;
  var adj_height = this.laser.z - (layer_id)*this.material_height;
  
  var theta = {
    x: (x - 600) /ms_per_theta,
    y: (y - 600) /ms_per_theta 
  };

  var coord = {
    x: adj_height * Math.tan(deg_to_rad(theta.x - 90)) + this.laser.x,
    y: adj_height * Math.tan(deg_to_rad(theta.y - 90)) + this.laser.y
  }

  return coord;  
}

