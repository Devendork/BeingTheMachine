function Scene2D(element){
	this.num_instructions = 0;
	this.num_per_layer = [];
	this.element = element;
	this.layer = 0;
	this.step = 0;
	this.scale = 1; 
	this.ebbox = undefined;
  	this.w = element.width();
	this.h = element.height();
	this.instructions = [];
	this.draw = SVG('renderArea2d');
	this.group= this.draw.group();
	this.path = [];
	this.ghost_path = [];
	this.polylines= [];
	this.ghost_polylines = [];
	this.circle = null;
	this.line = null;
	this.margin = 40;
	this.offset = [];

	var that = this;

	//go through all of the y coordinates and flip them


	$(window).on('resize', function(){
		that.resize();
	});

}

Scene2D.prototype.ebbox = 0;
Scene2D.prototype.num_per_layer= [];
Scene2D.prototype.num_instructions = 0;
Scene2D.prototype.group = null;
Scene2D.prototype.layer = 0;
Scene2D.prototype.offset = [];
Scene2D.prototype.polylines = [];
Scene2D.prototype.ghost_paths = [];
Scene2D.prototype.ghost_polylines = [];
Scene2D.prototype.element = null;
Scene2D.prototype.margin = 40;
Scene2D.prototype.step = 0;
Scene2D.prototype.scale= 1;
Scene2D.prototype.w= 1;
Scene2D.prototype.h= 1;
Scene2D.prototype.instructions = [];
Scene2D.prototype.draw = null;
Scene2D.prototype.circle= null;
Scene2D.prototype.line = null;
Scene2D.prototype.path = [];



Scene2D.prototype.clearLayerPaths = function(){
	for(var i in this.polylines){
		this.polylines[i].remove();
	}
	this.polylines = [];
	this.path = [];

	for(var i in this.ghost_polylines){
		this.ghost_polylines[i].remove();
	}
	this.ghost_polylines = [];
	this.ghost_path = [];

}

Scene2D.prototype.addGhostPaths = function(){
	var last = null;
	var inst = null;	

	for(var i in this.instructions[this.layer]){
		inst = this.instructions[this.layer][i];
		next = this.getNextGInst(this.layer, i);
		last = this.getLastGInst(this.layer, i);
    
    if(inst.type == "G1"){
			this.addGhostPath(inst, last, next);
		}
	}
	
	var g_polylist = [];
	for(var g in this.ghost_path){
		g_polylist.push(this.ghost_path[g].join(" "));
	}

	//draw them to screen
	for(var gpl in this.ghost_polylines){		
		this.ghost_polylines[gpl].plot(g_polylist[gpl]);
	}
}


Scene2D.prototype.addLayerPaths = function(){
	var last = null;
	var inst = null;	
  var next = null;

	for(var i in this.instructions[this.layer]){
		inst = this.instructions[this.layer][i];
		next = this.getNextGInst(this.layer, i);
		last = this.getLastGInst(this.layer, i);
    
    if(inst.type == "G1"){ 
			this.addPath(inst, last, next);
		}	
	}

}

Scene2D.prototype.addGhostPath= function(inst,last, next){
	if(inst.type == "G1" && inst.ext){
		if (last == null || !last.ext){
			var np = [];
			np.push(inst.coord.x+","+inst.coord.y);
			this.ghost_path.push(np);
			this.ghost_polylines.push(this.createPolyline(true));
		}

    if(next != null){
      this.ghost_path[this.ghost_path.length-1].push(next.coord.x+","+next.coord.y);
    }

	}

}

Scene2D.prototype.addPath= function(inst,last,next){
	if(inst.type == "G1" && inst.ext){
		if (last == null || !last.ext ||last.coord.z != inst.coord.z){
			var np = [];
			np.push(inst.coord.x+","+inst.coord.y);
			this.path.push(np);
			this.polylines.push(this.createPolyline(false));
		}

    if(next != null){
		  this.path[this.path.length-1].push(next.coord.x+","+next.coord.y);
	  }
  }

}

Scene2D.prototype.removePath = function(inst){
	if(inst.type == "G1" && inst.ext){
		
		var last_ndx = this.path.length -1;
		var last_coord = this.path[last_ndx].pop();

		if(this.path[last_ndx].length == 1){
			this.path.pop(); 
			var pl = this.polylines.pop();
			pl.remove();
		}
	}
}

Scene2D.prototype.createPolyline = function(ghost){
	var pl = this.draw.polyline();
	if(!ghost) pl.attr({'stroke-width':2/this.scale, stroke: '#000'});
	else pl.attr({'stroke-width':2/this.scale, stroke: '#999'});
	pl.fill('none');
	this.group.add(pl);
	return pl;	
}



Scene2D.prototype.add =function(flavor){
		this.ebbox = flavor.bbox;
    	this.step = 0;
		//this.layer = layer;
		this.instructions = flavor.is;

    this.num_per_layer = [];
    this.ebbox = flavor.bbox;

		var count = 0;

		for(var i in this.instructions){
			this.num_per_layer.push(count);
			count += this.instructions[i].length + 1;
		}
		this.num_instructions = count;


		//scale by bounding box
		var sx = this.ebbox.max.x - this.ebbox.min.x;
		var sy = this.ebbox.max.y - this.ebbox.min.y;

    if(this.w > this.h){
      window_factor = this.h-100;
      box_factor = sy;
    } else{
      window_factor = this.w;
      box_factor = sx;
    }


	  this.scale = (window_factor-this.margin*2) / box_factor; 		
    this.offset = {x: this.scale*-this.ebbox.min.x+(this.w - this.scale*sx)/2, 
                  y:this.scale*-this.ebbox.min.y+(this.h - this.scale*sy)/2};


		if(this.line != null) this.line.remove();
		if(this.circle != null) this.circle.remove();

		//create scene elements
		this.line = this.group.line(0,0,0,0);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
		this.circle = this.group.circle(10/this.scale).fill('#f00');
		this.circle.move(0,0);
		
	

    this.group.translate(this.offset.x, this.offset.y);
    this.group.scale(this.scale, this.scale);
		this.clearLayerPaths();
		this.addGhostPaths();
		this.drawStep({fwd: true, reset:true});
}

Scene2D.prototype.resize =function(){

	if(this.group != null){
		this.group.translate(-this.offset.x, -this.offset.y);
		this.group.scale(1/this.scale, 1/this.scale);
	}

	this.w = this.element.width();
	this.h = this.element.height()-100;

  var ebbox = this.ebbox;
	//scale by bounding box
	var sx = ebbox.max.x - ebbox.min.x;
	var sy = ebbox.max.y - ebbox.min.y;

    if(this.w > this.h){
      window_factor = this.h;
      box_factor = sy;
    } else{
      window_factor = this.w;
      box_factor = sx;
    }


  this.scale = (window_factor-this.margin*2) / box_factor; 		
  this.offset = {x: this.scale*-ebbox.min.x+(this.w - this.scale*sx)/2, 
                y:this.scale*-ebbox.min.y+(this.h - this.scale*sy)/2};

	
  this.group.translate(this.offset.x, this.offset.y);
	this.group.scale(this.scale, this.scale);
	this.drawStep({fwd:true, reset:true});
}

Scene2D.prototype.updatePlane = function(){
	if(!hasGL) return;
	var instruction = null;
	var i = 0;
	var plane = scene3d.getObjectByName("model").getObjectByName("plane");

	while(instruction == null && i < this.instructions[this.layer].length){
		instruction = this.instructions[this.layer][i];
		i++;
	}
	var zpos = (instruction == null)? 0 : -instruction.coord.z;
	var center = new THREE.Vector3(
		this.ebbox.min.x + ((this.ebbox.max.x - this.ebbox.min.x) / 2),
		this.ebbox.min.y + ((this.ebbox.max.y - this.ebbox.min.y) / 2),
		zpos);
	
	plane.position = center;

}

Scene2D.prototype.nextLayer = function(){
	if(this.layer < this.instructions.length-1){
		this.clearLayerPaths();
	       	this.layer++;
		this.step = 0;
		this.addGhostPaths();
		this.drawStep({fwd: true, reset:false});
		this.updatePlane();
	}
}

Scene2D.prototype.loadLayer = function(layer_id){
	if(layer_id < this.instructions.length-1){
		this.clearLayerPaths();
	    this.layer = layer_id;
		this.step = 0;
		this.addGhostPaths();
		this.drawStep({fwd: true, reset:false});
		this.updatePlane();
	}
}


Scene2D.prototype.prevLayer= function(){
	if(this.layer > 0){
		this.clearLayerPaths();
		this.layer--;
		this.step = 0;
		this.addGhostPaths();
		this.drawStep({fwd:true, reset:false});
		this.updatePlane();
	}

}

Scene2D.prototype.nextStep = function(){

	if(this.step < this.instructions[this.layer].length-1){
		this.step++; 
		this.drawStep({fwd:true, reset:false});

	}else{
		this.clearLayerPaths();
		this.step = 0;
		if(this.layer < this.instructions.length-1) this.layer++;
		this.addGhostPaths();
		this.drawStep({fwd:true, reset:false});
		this.updatePlane();
	}

}

Scene2D.prototype.prevStep= function(){
	if(this.step > 0){ 
		this.step--;
		this.drawStep({fwd: false, reset:false});

	}else{
	 	if(this.layer > 0){
			this.clearLayerPaths();
			this.layer--;
			this.addGhostPaths();
			this.addLayerPaths();
			this.step = this.instructions[this.layer].length -1;
			this.drawStep({fwd: false, reset:false});
			this.updatePlane();
		}
	}
}


Scene2D.prototype.getLastGInst = function(cur_layer, step){
	var ndx = step -1;
	var inst = null;
	while(inst == null){
    if(ndx < 0){
      if(cur_layer == 0) return null;
      cur_layer--;
      ndx = this.instructions[cur_layer].length-1; //set index to the last instruction at this layer
    }

		var check = this.instructions[cur_layer][ndx];
		if(check.type == "G1") inst = check;
		ndx--;	
	} 
	return inst;
}

Scene2D.prototype.getNextGInst = function(cur_layer, step){
  var ndx = ++step;
  var inst = null;

	while(inst == null){
		//if you hit the end of this layer, go to the next
    if(ndx >= this.instructions[cur_layer].length){
      cur_layer++;
      ndx = 0;
      if(cur_layer == this.instructions.length) return null;
    }

    var check = this.instructions[cur_layer][ndx];
		if(check.type == "G1") inst = check;
		ndx++;	
	} 
	return inst;
}

/***
inc - {next: true/false, forward: true/false, new_layer: true/false}
*/
Scene2D.prototype.drawStep=function(cause){


	if(this.instructions && this.instructions.length > 0){
		

		var inst = this.instructions[this.layer][this.step];
		var li = this.getLastGInst(this.layer, this.step); 
	  var ni = this.getNextGInst(this.layer, this.step);


		var d = 0;
		if(inst.type == "G1" && !cause.reset && cause.fwd){
			this.addPath(inst, li, ni);
			d = inst.obj.d_traveling;
		}
	
		if(!cause.reset && !cause.fwd && (ni != null && ni.type == "G1")){
			this.removePath(ni);
			d = ni.obj.d_traveling;
		}

		var polylist = [];
		for(var p in this.path){
			polylist.push(this.path[p].join(" "));
		}

			
		var anitime = d * (10); //20ms/mm
		for(var pl in this.polylines){		
			this.polylines[pl].plot(polylist[pl]);
			this.polylines[pl].front();
		}

		if(ni != null){
		  if(cause.reset) this.circle.center(inst.coord.x,inst.coord.y);
		  else if(inst.type == "G1") this.circle.animate(anitime).center(ni.coord.x,ni.coord.y);
		  else this.circle.animate(anitime).center(inst.coord.x, inst.coord.y);
		}

		if(inst.type == "G1"){
      $("#gcode_inst").css("color", "#999");
      $("#instruction").css("color", "#999");
    
    }else{
      $("#gcode_inst").css("color", "red");
      $("#instruction").css("color", "red");
    }
	
		this.circle.front();

		(inst.ext) ? this.circle.attr({fill: '#0f0'}) :this.circle.attr({fill: '#f00'});
		this.updateInterface();
    //$("#gcode_inst").text(inst.text);
    //$("#instruction").text(inst.desc);
		// $("#progress").text("layer: "+(this.layer+1)+" of "+this.instructions.length
		// 	      +" // instruction "+(this.num_per_layer[this.layer]+ this.step + 1)+" of "+(this.num_instructions;));

		//this.text.center(this.w/2, this.h - 3*this.margin/2);
	}else{
		// $("#gcode_inst").text("");
  //   $("#instruction").text("");
  //   $("#progress").text("");
	}
}

Scene2D.prototype.updateInterface = function(){
	//$("#layerRange").prop('value', this.layer);
	var show_layer = +this.layer+1;
	var show_step = +this.step +1;

	$("#curLayer").text(show_layer);

	//$("#instRange").prop('value', this.step);
	$("#curInst").text(this.step);

	var current_i = this.num_per_layer[this.layer]+ this.step + 1;
	var p = Math.floor(current_i / this.num_instructions * 100);
	$("#percent").text(p+"%");
}

function create3DScene(element) {
  console.log("3D scene created");
  // Renderer
  var split_width = element.width();
  var renderer = new THREE.WebGLRenderer({clearColor:0xFFFFFF, clearAlpha: 1, alpha:true});
  renderer.setSize(split_width, element.height());
  element.append(renderer.domElement);
  renderer.clear();

  // Scene
  var scene3d = new THREE.Scene(); 

  // Lights...
  [[0,0,1,  0xFFFFCC],
   [0,1,0,  0xFFCCFF],
   [1,0,0,  0xCCFFFF],
   [0,0,-1, 0xCCCCFF],
   [0,-1,0, 0xCCFFCC],
   [-1,0,0, 0xFFCCCC]].forEach(function(position) {
    var light = new THREE.DirectionalLight(position[3]);
    light.position.set(position[0], position[1], position[2]).normalize();
    scene3d.add(light);
  });

  var fov    = 45,
      aspect = split_width / element.height(),
      near   = 1, 
      far 	 = 1000,
	  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.name = "camera";
  scene3d.add(camera);

  // Fix coordinates up if window is resized.
  $(window).on('resize', function() {
    renderer.setSize(split_width, element.height());
    camera.aspect = split_width / element.height();
    camera.updateProjectionMatrix();
    controls.screen.width = split_width;
    controls.screen.height = element.height();
  });

  controls = new THREE.TrackballControls(camera);
  controls.noPan = true;
  controls.dynamicDampingFactor = 0.15;

    // Action!
  function render() {
    controls.update();
    renderer.render(scene3d, camera);
    requestAnimationFrame(render); // And repeat...
  }
  render();

  return scene3d;
}

function update3DScene(){

  var camera = scene3d.getObjectByName("camera");
  // Camera...
  var bbox = select_flavor.bbox;
  var fov = 45;
  var camera_to_center = (bbox.max_dim) / (Math.tan(fov/2.));
  console.log("d to center ", camera_to_center);
  
  var far = 1.2 * (camera_to_center + bbox.max_dim/2.)
  console.log("far ", far);



  // camera.position = center;
  camera.position.z -= camera_to_center;
  camera.position.x -= camera_to_center*Math.cos(45);
  camera.position.y -= camera_to_center*Math.sin(45);
  camera.lookAt(new THREE.Vector3(0,0,-bbox.max.z));
  console.log(camera.position);
  camera.updateProjectionMatrix();
  


}


