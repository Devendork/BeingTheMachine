var d2 = {
	ebbox:0,
	num_per_layer:[],
	num_instructions:0,
	layer:0,
	offset:[],
	polylines:[],
	ghost_paths:[],
	ghost_polylines:[],
	margin:40,
	step:0,
	scale:1,
	instructions:[],
	circle:null,
	line:null,
	path:[],

	init:function(element){
		console.log("init d2");
		d2.element = element;
		d2.w = element.width();
		d2.h = element.height();

		d2.draw = SVG('renderArea2d');
		d2.group = d2.draw.group();
	},

	clearLayerPaths:function(){
		for(var i in d2.polylines){
			d2.polylines[i].remove();
		}
		d2.polylines = [];
		d2.path = [];

		for(var i in d2.ghost_polylines){
			d2.ghost_polylines[i].remove();
		}
		d2.ghost_polylines = [];
		d2.ghost_path = [];

	},

	addGhostPaths:function(){
		var last = null;
		var inst = null;	

		for(var i in d2.instructions[d2.layer]){
			inst = d2.instructions[d2.layer][i];
			next = d2.getNextGInst(d2.layer, i);
			last = d2.getLastGInst(d2.layer, i);
	    
	    if(inst.type == "G1"){
				d2.addGhostPath(inst, last, next);
			}
		}
		
		var g_polylist = [];
		for(var g in d2.ghost_path){
			g_polylist.push(d2.ghost_path[g].join(" "));
		}

		//draw them to screen
		for(var gpl in d2.ghost_polylines){		
			d2.ghost_polylines[gpl].plot(g_polylist[gpl]);
		}
	},


	addLayerPaths:function(){
		var last = null;
		var inst = null;	
	  var next = null;

		for(var i in d2.instructions[d2.layer]){
			inst = d2.instructions[d2.layer][i];
			next = d2.getNextGInst(d2.layer, i);
			last = d2.getLastGInst(d2.layer, i);
	    
	    if(inst.type == "G1"){ 
				d2.addPath(inst, last, next);
			}	
		}

	},

	addGhostPath: function(inst,last, next){
		if(inst.type == "G1" && inst.ext){
			if (last == null || !last.ext){
				var np = [];
				np.push(inst.coord.x+","+inst.coord.y);
				d2.ghost_path.push(np);
				d2.ghost_polylines.push(d2.createPolyline(true));
			}

	    if(next != null){
	      d2.ghost_path[d2.ghost_path.length-1].push(next.coord.x+","+next.coord.y);
	    }

		}

	},

	addPath: function(inst,last,next){
		if(inst.type == "G1" && inst.ext){
			if (last == null || !last.ext ||last.coord.z != inst.coord.z){
				var np = [];
				np.push(inst.coord.x+","+inst.coord.y);
				d2.path.push(np);
				d2.polylines.push(d2.createPolyline(false));
			}

	    if(next != null){
			  d2.path[d2.path.length-1].push(next.coord.x+","+next.coord.y);
		  }
	  }

	},

	removePath:function(inst){
		if(inst.type == "G1" && inst.ext){
			
			var last_ndx = d2.path.length -1;
			var last_coord = d2.path[last_ndx].pop();

			if(d2.path[last_ndx].length == 1){
				d2.path.pop(); 
				var pl = d2.polylines.pop();
				pl.remove();
			}
		}
	},

	createPolyline:function(ghost){
		var pl = d2.draw.polyline();
		if(!ghost) pl.attr({'stroke-width':2/d2.scale, stroke: '#000'});
		else pl.attr({'stroke-width':2/d2.scale, stroke: '#999'});
		pl.fill('none');
		d2.group.add(pl);
		return pl;	
	},



	add: function(flavor){
		d2.ebbox = flavor.bbox;
    	d2.step = 0;
		//d2.layer = layer;
		d2.instructions = flavor.is;

	    d2.num_per_layer = [];
	    d2.ebbox = flavor.bbox;

		var count = 0;

		for(var i in d2.instructions){
			d2.num_per_layer.push(count);
			count += d2.instructions[i].length + 1;
		}
		d2.num_instructions = count;


		//scale by bounding box
		var sx = d2.ebbox.max.x - d2.ebbox.min.x;
		var sy = d2.ebbox.max.y - d2.ebbox.min.y;

	    if(d2.w > d2.h){
	      window_factor = d2.h-100;
	      box_factor = sy;
	    } else{
	      window_factor = d2.w;
	      box_factor = sx;
	    }


		d2.scale = (window_factor-d2.margin*2) / box_factor; 		
	    d2.offset = {x: d2.scale*-d2.ebbox.min.x+(d2.w - d2.scale*sx)/2, 
	    y:d2.scale*-d2.ebbox.min.y+(d2.h - d2.scale*sy)/2};


		if(d2.line != null) d2.line.remove();
		if(d2.circle != null) d2.circle.remove();

		//create scene elements
		d2.line = d2.group.line(0,0,0,0);
		d2.line.attr({'stroke-width':5/d2.scale, stroke: '#666'});
		d2.circle = d2.group.circle(10/d2.scale).fill('#f00');
		d2.circle.move(0,0);
		
		

	    d2.group.translate(d2.offset.x, d2.offset.y);
	    d2.group.scale(d2.scale, d2.scale);
		d2.clearLayerPaths();
		d2.addGhostPaths();
		d2.drawStep({fwd: true, reset:true});
	},

	resize: function(){

		if(d2.group != null){
			d2.group.translate(-d2.offset.x, -d2.offset.y);
			d2.group.scale(1/d2.scale, 1/d2.scale);
		}

		d2.w = d2.element.width();
		d2.h = d2.element.height()-100;

	  var ebbox = d2.ebbox;
		//scale by bounding box
		var sx = ebbox.max.x - ebbox.min.x;
		var sy = ebbox.max.y - ebbox.min.y;

	    if(d2.w > d2.h){
	      window_factor = d2.h;
	      box_factor = sy;
	    } else{
	      window_factor = d2.w;
	      box_factor = sx;
	    }


	  d2.scale = (window_factor-d2.margin*2) / box_factor; 		
	  d2.offset = {x: d2.scale*-ebbox.min.x+(d2.w - d2.scale*sx)/2, 
	                y:d2.scale*-ebbox.min.y+(d2.h - d2.scale*sy)/2};

		
	  d2.group.translate(d2.offset.x, d2.offset.y);
		d2.group.scale(d2.scale, d2.scale);
		d2.drawStep({fwd:true, reset:true});
	},

	updatePlane:function(){
		if(!hasGL) return;
		var instruction = null;
		var i = 0;

		while(instruction == null && i < d2.instructions[d2.layer].length){
			instruction = d2.instructions[d2.layer][i];
			i++;
		}
		var zpos = (instruction == null)? 0 : -instruction.coord.z;
		var center = new THREE.Vector3(
			d2.ebbox.min.x + ((d2.ebbox.max.x - d2.ebbox.min.x) / 2),
			d2.ebbox.min.y + ((d2.ebbox.max.y - d2.ebbox.min.y) / 2),
			zpos);
		
		d3.updatePlane(center);

	},

	nextLayer:function(){
		if(d2.layer < d2.instructions.length-1){
			d2.clearLayerPaths();
		       	d2.layer++;
			d2.step = 0;
			d2.addGhostPaths();
			d2.drawStep({fwd: true, reset:false});
			d2.updatePlane();
		}
	},

	loadLayer:function(layer_id){
		if(layer_id < d2.instructions.length-1){
			d2.clearLayerPaths();
		    d2.layer = layer_id;
			d2.step = 0;
			d2.addGhostPaths();
			d2.drawStep({fwd: true, reset:false});
			d2.updatePlane();
		}
	},


	prevLayer: function(){
		if(d2.layer > 0){
			d2.clearLayerPaths();
			d2.layer--;
			d2.step = 0;
			d2.addGhostPaths();
			d2.drawStep({fwd:true, reset:false});
			d2.updatePlane();
		}

	},

	nextStep:function(){

		if(d2.step < d2.instructions[d2.layer].length-1){
			d2.step++; 
			d2.drawStep({fwd:true, reset:false});

		}else{
			d2.clearLayerPaths();
			d2.step = 0;
			if(d2.layer < d2.instructions.length-1) d2.layer++;
			d2.addGhostPaths();
			d2.drawStep({fwd:true, reset:false});
			d2.updatePlane();
		}

	},

	prevStep: function(){
		if(d2.step > 0){ 
			d2.step--;
			d2.drawStep({fwd: false, reset:false});

		}else{
		 	if(d2.layer > 0){
				d2.clearLayerPaths();
				d2.layer--;
				d2.addGhostPaths();
				d2.addLayerPaths();
				d2.step = d2.instructions[d2.layer].length -1;
				d2.drawStep({fwd: false, reset:false});
				d2.updatePlane();
			}
		}
	},


	getLastGInst:function(cur_layer, step){
		var ndx = step -1;
		var inst = null;
		while(inst == null){
	    if(ndx < 0){
	      if(cur_layer == 0) return null;
	      cur_layer--;
	      ndx = d2.instructions[cur_layer].length-1; //set index to the last instruction at d2 layer
	    }

			var check = d2.instructions[cur_layer][ndx];
			if(check.type == "G1") inst = check;
			ndx--;	
		} 
		return inst;
	},

	getNextGInst:function(cur_layer, step){
	  var ndx = ++step;
	  var inst = null;

		while(inst == null){
			//if you hit the end of d2 layer, go to the next
	    if(ndx >= d2.instructions[cur_layer].length){
	      cur_layer++;
	      ndx = 0;
	      if(cur_layer == d2.instructions.length) return null;
	    }

	    var check = d2.instructions[cur_layer][ndx];
			if(check.type == "G1") inst = check;
			ndx++;	
		} 
		return inst;
	},

	/***
	inc - {next: true/false, forward: true/false, new_layer: true/false}
	*/
	drawStep:function(cause){


		if(d2.instructions && d2.instructions.length > 0){
			

			var inst = d2.instructions[d2.layer][d2.step];
			var li = d2.getLastGInst(d2.layer, d2.step); 
		  var ni = d2.getNextGInst(d2.layer, d2.step);


			var d = 0;
			if(inst.type == "G1" && !cause.reset && cause.fwd){
				d2.addPath(inst, li, ni);
				d = inst.obj.d_traveling;
			}
		
			if(!cause.reset && !cause.fwd && (ni != null && ni.type == "G1")){
				d2.removePath(ni);
				d = ni.obj.d_traveling;
			}

			var polylist = [];
			for(var p in d2.path){
				polylist.push(d2.path[p].join(" "));
			}

				
			var anitime = d * (10); //20ms/mm
			for(var pl in d2.polylines){		
				d2.polylines[pl].plot(polylist[pl]);
				d2.polylines[pl].front();
			}

			if(ni != null){
			  if(cause.reset) d2.circle.center(inst.coord.x,inst.coord.y);
			  else if(inst.type == "G1") d2.circle.animate(anitime).center(ni.coord.x,ni.coord.y);
			  else d2.circle.animate(anitime).center(inst.coord.x, inst.coord.y);
			}

			if(inst.type == "G1"){
	      $("#gcode_inst").css("color", "#999");
	      $("#instruction").css("color", "#999");
	    
	    }else{
	      $("#gcode_inst").css("color", "red");
	      $("#instruction").css("color", "red");
	    }
		
			d2.circle.front();

			(inst.ext) ? d2.circle.attr({fill: '#0f0'}) :d2.circle.attr({fill: '#f00'});
			d2.updateInterface();
	    //$("#gcode_inst").text(inst.text);
	    //$("#instruction").text(inst.desc);
			// $("#progress").text("layer: "+(d2.layer+1)+" of "+d2.instructions.length
			// 	      +" // instruction "+(d2.num_per_layer[d2.layer]+ d2.step + 1)+" of "+(d2.num_instructions;));

			//d2.text.center(d2.w/2, d2.h - 3*d2.margin/2);
		}else{
			// $("#gcode_inst").text("");
	  //   $("#instruction").text("");
	  //   $("#progress").text("");
		}
	},

	updateInterface:function(){
		//$("#layerRange").prop('value', d2.layer);
		var show_layer = +d2.layer+1;
		var show_step = +d2.step +1;

		$("#curLayer").text(show_layer);

		//$("#instRange").prop('value', d2.step);
		$("#curInst").text(d2.step);

		var current_i = d2.num_per_layer[d2.layer]+ d2.step + 1;
		var p = Math.floor(current_i / d2.num_instructions * 100);
		$("#percent").text(p+"%");
	}
};

var d3 ={
	scene: new THREE.Scene(), 

	init: function(element){
	   if(!app.hasGL) return;
	   console.log("init d3");
	   var element = element,
	   	   w = element.width(),
	       h = element.height();


	   function initRenderer(){
	   		d3.renderer = new THREE.WebGLRenderer({clearColor:0xFFFFFF, clearAlpha: 1, alpha:true});
 	   		d3.renderer.setSize(w, h);
	   		element.append(d3.renderer.domElement);
	   		d3.renderer.clear();
	   };

	   function initLights(){
	   	 [[0,0,1,  0xFFFFCC],
		 [0,1,0,  0xFFCCFF],
		 [1,0,0,  0xCCFFFF],
		 [0,0,-1, 0xCCCCFF],
		 [0,-1,0, 0xCCFFCC],
		 [-1,0,0, 0xFFCCCC]].forEach(function(position) {
		 var light = new THREE.DirectionalLight(position[3]);
		 light.position.set(position[0], position[1], position[2]).normalize();
		 d3.scene.add(light);
		 });
	   }

	   function initCamera(){
	   	 var bbox = select_flavor.bbox;
	   	 var fov    = 45,
	      aspect = w / h,
	      near   = 1;

	     var camera_to_center = (bbox.max_dim) / (Math.tan(fov/2.));
		  var far = 4 * (camera_to_center + bbox.max_dim/2.)

	   
		  d3.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		  d3.camera.name = "camera";

		  d3.camera.position.z -= camera_to_center;
		  d3.camera.position.x -= camera_to_center*Math.cos(45);
		  d3.camera.position.y -= camera_to_center*Math.sin(45);
		  d3.camera.lookAt(new THREE.Vector3(0,0,-bbox.max.z));

	  	  d3.scene.add(d3.camera);
	   }

	   function initControls(){
	   	  d3.controls = new THREE.TrackballControls(d3.camera),
	   	  d3.controls.noPan = true;
  		  d3.controls.dynamicDampingFactor = 0.15;
		}

	   function render() {
	     d3.controls.update();
	     d3.renderer.render(d3.scene, d3.camera);
	     requestAnimationFrame(render); // And repeat...
	   }

	   initRenderer();
	   initLights();
	   initCamera();
	   initControls();
	   render();

	  $(window).on('resize', function() {
	  	var w = element.width();
	  	var h = element.height;
	    d3.renderer.setSize(w, h);
	    d3.camera.aspect = w / h;
	    d3.camera.updateProjectionMatrix();
	    d3.controls.screen.width = w;
	    d3.controls.screen.height = h;
	  });

	   
	},

	updatePlane:function(center){
		if(!app.hasGL) return;
		var plane = d3.scene.getObjectByName("model").getObjectByName("model_info").getObjectByName("plane");
		plane.position = center;
	},


	setControls: function(on){
		if(!app.hasGL) return;
		d3.controls.enabled = on;
	},

	add: function(object){
		if(!app.hasGL) return;
		d3.clear();
		d3.scene.add(object);
	},

	clear: function(){
		if(!app.hasGL) return;
		var model = d3.scene.getObjectByName("model");
		if(model != undefined) d3.scene.remove(model);
	}


}



