function outputFlavor(instructions, diameter, height, raw){
    this.is = instructions;
    this.diameter = diameter;
    this.height = height;
    this.updateInstructionHeight(this.is, this.height);
    this.bbox = this.boundingBox();
    this.env = this.setupEnvironment(); 
    this.a_is = this.arduinoInstructions();
    
    if(!raw) this.is = this.a_is.slice(0);


    this.object = this.createObjectFromInstructions(this.is);
    this.plane = this.createPlane(this.is);

    console.log("New Flavor Created");
    console.log("Height: "+this.height);
    console.log("Raw?: "+raw);
    console.log("Bbox");
    console.log(this.env);
}

outputFlavor.prototype.is = [];
outputFlavor.prototype.diameter= 0;
outputFlavor.prototype.height = 0;
outputFlavor.prototype.bbox = undefined;
outputFlavor.prototype.env = undefined;
outputFlavor.prototype.a_is = [];
outputFlavor.prototype.plane = undefined;
outputFlavor.prototype.object = undefined;
  
outputFlavor.prototype.updateInstructionHeight = function(is, height){
  for(var l in is){
    for(var i in is[l]){
      inst = is[l][i];
      inst.coord.z = l * height;
    }
  }
} 


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
          ai.coord.z = l * this.height;
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
  
  return bbox;
}


outputFlavor.prototype.setupEnvironment = function(){
  var build_env = [];
  var bbox = this.bbox;
  build_env.material_size= this.diameter;
  build_env.dim = {x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y};
  build_env.ctr = {x: bbox.min.x + build_env.dim.x/2., y: bbox.min.y + build_env.dim.y/2.};
  build_env.max_dim = (build_env.dim.x > build_env.dim.y) ? build_env.dim.x: build_env.dim.y;
  var dist_to_top_layer = (build_env.max_dim/2.) / Math.tan(deg_to_rad(half_range));
  build_env.height = dist_to_top_layer + this.height*(this.is.length+1);
  build_env.model_height = build_env.height - dist_to_top_layer;
  return build_env;
}


outputFlavor.prototype.cleanInstructions = function(a_is){
  var instructions = [];
  var build_env = this.env;
  var mat2 = build_env.material_size*this.diameter/4;

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
         

        //delete if this and last are same point
        
        
        /*
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
        */
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
    bbox.min.z + ((bbox.max.z - bbox.min.z) / 2));
    console.log("center ", center);

    object.position = center.multiplyScalar(-scale);

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
      bbox.min.z);
  
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
        new THREE.Vector3(bbox.min.x, bbox.min.y -5 , bbox.min.z),
        new THREE.Vector3(bbox.max.x, bbox.min.y -5 , bbox.min.z)
      );
    }

    if(i == 1){
      axis = "y";
      dimension = bbox.max.y - bbox.min.y;
      line_objects[i].vertices.push(
        new THREE.Vector3(bbox.min.x-5, bbox.min.y, bbox.min.z),
        new THREE.Vector3(bbox.min.x-5, bbox.max.y, bbox.min.z)
      );
    }

    if(i == 2){
      axis = "z";
      dimension = bbox.max.z - bbox.min.z;
      line_objects[i].vertices.push(
        new THREE.Vector3(bbox.min.x-5, bbox.min.y -5 , bbox.min.z),
        new THREE.Vector3(bbox.min.x-5, bbox.min.y -5 , bbox.max.z)
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
      text.position.z = z;
    }

    if(i == 1){
      text.position.x = bbox.min.x - 10;
      text.position.y = bbox.min.y + (dimension * 0.5) + centerOffset;
      text.position.z = z;
      text.rotation.z = Math.PI * 0.5;
    }

    if(i == 2){
      text.position.x = bbox.min.x-5;
      text.position.y = bbox.min.y-10; 
      text.position.z = bbox.min.z + (dimension * 0.5)- centerOffset;
      text.rotation.y = Math.PI * 0.5;
    }

    this.object.add(text);	
    this.object.add(line);	


  }
  return plane;
}


outputFlavor.prototype.toMicroseconds = function(layer_id,x, y){ 

  var build_env = this.env;
  var adj_height = build_env.height - (layer_id)*this.height;
  var byte_adj = half_range / 10;


  if(layer_id == 0 && x == 0 && y == 0){ //assume this is a starting block
    x = this.bbox.min.x;
    y = this.bbox.min.y;
  }


  var theta = {
    x: rad_to_deg(Math.atan((x - build_env.ctr.x)/adj_height)) +  90,
    y: rad_to_deg(Math.atan((y - build_env.ctr.y)/adj_height)) +  90.
    //hx: rad_to_deg(Math.atan((x - build_env.ctr.x)/build_env.height)) +  90,
    //hy: rad_to_deg(Math.atan((y - build_env.ctr.y)/build_env.height)) +  90.
  };  

    var low = 90 - half_range;
    var high = 90 + half_range;

    if(theta.x > high || theta.x < low){
    console.log("Error - theta out of range: "+theta.x );
    console.log(this.bbox.min.x, x);
    console.log(x, y);
  }

  var ms_per_theta = 10;
  var min_ms = (1500 - half_range*10) - 600;

  var ms = {
    x: parseInt(theta.x*ms_per_theta - min_ms),
    y: parseInt(theta.y*ms_per_theta - min_ms)
  };

  ms.x = parseInt(ms.x / byte_adj);
  ms.y = parseInt(ms.y / byte_adj);

  if(ms.x > 200 || ms.x < 0){
    console.log("Error - ms out of range - for one byte");
  }


  return ms;  
}

//to do figure out why microseconds isn't writing the full range
outputFlavor.prototype.fromMicroseconds = function(layer_id,x, y){ 
  var ms_per_theta = 10;
  var build_env = this.env;
  var byte_adj = half_range/10;

  
  //var min_ms = 800;
  var min_ms = (1500 - half_range*10) - 600;
  var adj_height = build_env.height - (layer_id)*this.height;
  
  var theta = {
    x: (min_ms+x*byte_adj)/ms_per_theta,
    y: (min_ms+y*byte_adj)/ms_per_theta 
  };

  var coord = {
    x: adj_height * Math.tan(deg_to_rad(theta.x - 90)) + build_env.ctr.x,
    y: adj_height * Math.tan(deg_to_rad(theta.y - 90)) + build_env.ctr.y
  }


  return coord;  
}

