var d2 = {
	ebbox:0,
	offset:[],
	lines: [], // [layer_id][path_id] = {SVG.Polyline: p, points: []}
	margin:40,
	scale:1,
	circle:null,
	progress:null,
	all_layers:false,
	step_counts:[],
	total_steps:0,
	profile: null,
	image:null,
	//line:null,
	ptr: {
		layer: 0, //layer id
		step: 0,  // absolute layer position, relative to start
		polyline: 0, //which polyline it is located in
		point: 0 //which point within the polyline
	},

	init:function(element){
		console.log("init d2");
		d2.element = element;
		d2.w = element.width();
		d2.h = element.height();

		d2.draw = SVG('renderArea2d');
		d2.group = d2.draw.group();




	},

	checkLayerSteps:function(){
		console.log(select_flavor.is);
		console.log(d2.lines);
	},

	loadLines:function(){
		// update this function to delete empty lines
		var last = null;
		var inst = null;
		var paths = [];
		var first = true;


		for(var l = 0; l < select_flavor.is.length; l++){
			paths = [];
			first = true;

			for(var i in select_flavor.is[l]){
				inst = select_flavor.is[l][i];

		    	if(last != null && inst.ext){
		    		//this represents the beginning of a new polyline
					if (first || !last.ext){
						var np = [];
						np.push([last.to.x,last.to.y]); //push the current location
						paths.push(np);
						first = false;
					}
					paths[paths.length-1].push([inst.to.x, inst.to.y]);
				}
				last = inst;
			}
		
		

			var polylines = [];
			for(var p in paths){
		 	    var line = {
		 	   		points: paths[p], //[x, y], [x, y]
		 	   		svg: d2.createPolyline(true)
		 		};
		 	   
			 	if(line.points.length > 1){
			 	  line.svg.plot(line.points);
			 	  polylines.push(line);
			 	}
			}

			if(polylines.length > 0) d2.lines.push(polylines);
		}

		var total = 0;
		for(var l in d2.lines){
			d2.step_counts[l] = d2.totalPolylineSteps(d2.lines[l], d2.lines[l].length-1);
			total += d2.step_counts[l];
		}
		d2.total_steps = total;

		ui.updateModelStats();


	},

	visited:function(svg){
		svg.attr({stroke: '#999999'});
	},
	ghost: function(svg){
		svg.attr({stroke: '#99ff66'});
	},

	plot:function(line, points){
		line.plot(points);
	},

	// show:function(svg){
	// 	svg.show();
	// },

	// hide:function(svg){
	// 	svg.hide();
	// },

	hideLayer:function(layer_id){
		for(var i in d2.lines[layer_id]){
			d2.lines[layer_id][i].svg.hide();
		}
	},

	removeLayer:function(layer_id){
		for(var i in d2.lines[layer_id]){
			d2.lines[layer_id][i].svg.remove();
		}
	},


	createPolyline:function(ghost){
		var pl = d2.draw.polyline();
		if(!ghost) pl.attr({'stroke-width':2/d2.scale, stroke: '#000'});
		else pl.attr({'stroke-width':2/d2.scale, stroke: '#99ff66'});
		pl.fill('none');
		d2.group.add(pl);
		return pl;	
	},

	addImage:function(path){
		var image = d2.group.image(path);
        image.size(650, 650).y(-50)
	},

	add: function(){
		d2.ebbox = select_flavor.bbox;
    	//d2.step = 0;
		d2.layer = 0;

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
	    d2.offset = {
	    	x: d2.scale*-d2.ebbox.min.x+(d2.w - d2.scale*sx)/2, 
	    	y:d2.scale*-d2.ebbox.min.y+(d2.h - d2.scale*sy)/2};


		//if(d2.line != null) d2.line.remove();
		if(d2.circle != null) d2.circle.remove();
		if(d2.progress != null) d2.progress.remove();


		//d2.line.attr({'stroke-width':5/d2.scale, stroke: '#666'});
		d2.circle = d2.group.circle(10/d2.scale).fill('#f00');
		d2.circle.move(0,0);
		d2.progress = d2.createPolyline(false);

		

	    d2.group.translate(d2.offset.x, d2.offset.y);
	    d2.group.scale(d2.scale, d2.scale);
		
		//clear all the old paths
	    for(l in d2.lines){
			d2.removeLayer(l);
	    }
	    d2.lines = [];

		//load all the new paths
		d2.loadLines();
		

		//draw them to the screen
		if(!d2.all_layers){
			for(var l = 1; l < d2.lines.length; l++){
				for(p in d2.lines[l]){
					d2.lines[l][p].svg.hide();
				}
			}
		}
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

	},

	updatePlane:function(){
		if(!hasGL) return;
		var instruction = null;
		var i = 0;

		while(instruction == null && i < select_flavor.is[d2.layer].length){
			instruction = select_flavor.is[d2.layer][i];
			i++;
		}
		var zpos = (instruction == null)? 0 : -instruction.coord.z;
		var center = new THREE.Vector3(
			d2.ebbox.min.x + ((d2.ebbox.max.x - d2.ebbox.min.x) / 2),
			d2.ebbox.min.y + ((d2.ebbox.max.y - d2.ebbox.min.y) / 2),
			zpos);
		
		d3.updatePlane(center);

	},




	loadLayer:function(layer_id, forward){
		console.log("load "+layer_id);

	    d2.ptr.layer = layer_id;
		
		if(forward){
			d2.ptr.polyline = 0;
			d2.ptr.point = 0;
			d2.ptr.step = 0;
		}else{
			d2.ptr.polyline = d2.lines[layer_id].length-1;
			d2.ptr.point = d2.lines[layer_id][d2.ptr.polyline].points.length -1;
			d2.ptr.step = d2.totalPolylineSteps(d2.lines[layer_id], d2.ptr.polyline);
		}

		//update the polyline colors
		for(var l = 0; l < d2.lines.length; l++){
			if(d2.all_layers){
				for(p in d2.lines[l]){
					if(l < layer_id){
						d2.visited(d2.lines[l][p].svg);
					} 
					if(l >= layer_id){
						if(forward) d2.ghost(d2.lines[l][p].svg);
						else d2.visited(d2.lines[l][p].svg);
					} 
				}
			
			}else{
				if(l != layer_id) d2.hideLayer(l);
				else{
					for(p in d2.lines[l]){
						if(forward)	d2.ghost(d2.lines[l][p].svg);
						else d2.visited(d2.lines[l][p].svg);
						d2.lines[l][p].svg.show();
					}
					
				}
				
			}
		}


		//var pt_from = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point-1];
		var pt_to = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point];
		//d2.circle.center(pt_from[0], pt_from[1]);
		d2.circle.animate(10).center(pt_to[0], pt_to[1]);
	    
		if(forward) d2.progress.hide();
		else{ 
			d2.progress.show();
			d2.progress.plot(d2.lines[d2.ptr.layer][d2.ptr.polyline].points.slice());
		}

		ui.updateModelStats();
		d2.updatePlane();

		return pt_to;
	},

	getMicroseconds:function(layer_id, x, y){ 

	  //var adj_height = build_env.distance_to_base - (layer_id)*this.material_height; //distance from laser to current laser (
	  var adj_height = select_flavor.laser.z - (layer_id * select_flavor.material_height); //distance from laser to current laser (


	  if(layer_id == 0 && x == 0 && y == 0){ //assume this is a starting block
	    x = select_flavor.bbox.min.x;
	    y = select_flavor.bbox.min.y;
	  }

	    var theta = {
	      x: rad_to_deg(Math.atan((x - select_flavor.laser.x)/adj_height)) +  90,
	      y: rad_to_deg(Math.atan((y - select_flavor.laser.y)/adj_height)) +  90.
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
	  
	  	console.log(ms);
	  	return ms;  
	},

	nextStep:function(){
		var layer = d2.ptr.layer;
		var polylines = d2.lines[layer];
		var cur_points = polylines[d2.ptr.polyline].points;
		var move_info = [];
		var pt_to = [];

		//case 1: move +1 within polyline 
		if(d2.ptr.point < cur_points.length-1){
			d2.ptr.point++;
			d2.ptr.step++;

			console.log("in line", d2.ptr);
			pt_to = cur_points[d2.ptr.point];

			d2.progress.plot(cur_points.slice(0, d2.ptr.point+1));
			d2.progress.show();
			d2.progress.front();
			d2.circle.animate(10).center(pt_to[0], pt_to[1]);
			d2.circle.front();

			move_info.l = 1;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);


		}else if(d2.ptr.polyline < polylines.length-1){
			//case 2: move to next polyline on same layer
			//var pt_from = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point-1];

			d2.ptr.polyline++;
			d2.ptr.point = 0;
			d2.ptr.step++;

			console.log("next poly", d2.ptr);

			pt_to = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point];

			d2.progress.hide();
			d2.visited(polylines[d2.ptr.polyline-1].svg);
			//d2.circle.center(pt_from[0], pt_from[1]);
			d2.circle.animate(10).center(pt_to[0], pt_to[1]);
			d2.circle.front();

			move_info.l = 0;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);

		}else if(layer < d2.lines.length -1){
			//case 3: moving to the next layer
			console.log("next layer", d2.ptr);
			pt_to = d2.loadLayer(layer+1, true);
			
			move_info.l = 0;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);
		}else{
			//case 4: your at the last instruction 
			console.log("last inst", d2.ptr);
			move_info.l = 0;
			pt_to = d2.lines[layer][d2.ptr.polyline].points[d2.ptr.point];
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);

		}


		ui.updateModelStats();
		d2.updatePlane();

		return move_info;

	},

	totalPolylineSteps:function(polylines, p_id){
			//total all the previous polyline steps to get the current step
			var steps = 0;
			for(var i = 0; i <= p_id; i++){
				steps += polylines[i].points.length;
			}
			return (steps -1);	
	},


	prevStep: function(){
		var layer = d2.ptr.layer;
		var polylines = d2.lines[layer];
		var cur_points = polylines[d2.ptr.polyline].points;
		var pt_to = [];
		var move_info = [];


		if(d2.ptr.point > 0){
			//case 1: moving within a polyline
			//var pt_from = d2.lines[layer][d2.ptr.polyline].points[d2.ptr.point];
			d2.ptr.point--;
			d2.ptr.step--;
			console.log("in line", d2.ptr);

			pt_to = d2.lines[layer][d2.ptr.polyline].points[d2.ptr.point];

			//pop the last point off of cur points and plot the polyline
			if(d2.ptr.point > 0){
				d2.progress.plot(cur_points.slice(0, d2.ptr.point));
				d2.progress.front();
			} 
			else d2.progress.hide();

			d2.circle.animate(10).center(pt_to[0], pt_to[1]);
			d2.circle.front();

			move_info.l = 1;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);

		}else if(d2.ptr.polyline > 0){
			//case 2: moving to a new polyline on the same layer

			d2.ptr.polyline--;
			cur_points = polylines[d2.ptr.polyline].points;
			d2.ptr.point = cur_points.length-1;

			d2.ptr.step = d2.totalPolylineSteps(polylines, d2.ptr.polyline);		
			// d2.ghost(polylines[d2.ptr.polyline].svg);
			// d2.progress.plot(cur_points.slice());
			// d2.progress.front();

			console.log("new poly", d2.ptr);
			pt_to = d2.lines[layer][d2.ptr.polyline].points[d2.ptr.point];
			
			d2.circle.animate(10).center(pt_to[0], pt_to[1]);
			d2.circle.front();
			
			move_info.l = 0;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);

		}else if(layer > 0){
			//case 3: moving to a new layer
			pt_to = d2.loadLayer(layer-1);
			console.log("new layer", d2.ptr);

			move_info.l = 0;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);
		}else{
			//case 4: you're at the first instruction
			console.log("at beginning", d2.ptr);
			pt_to = d2.lines[0][0].points[0];
			move_info.l = 0;
			move_info.ms = d2.getMicroseconds(layer, pt_to[0], pt_to[1]);
		}


		ui.updateModelStats();
		d2.updatePlane();

		return move_info;
		

	},

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

	updateLayer:function(layer){
		// var lines = d3.scene.getObjectByName("model").getObjectByName(""+layer+"");

		// var color = new THREE.Color(0,0,0);
		// var colors = lines.geometry.colors;

		// for(var i in colors){
		// 	colors[i] = color;
		// } 

		// lines.colorsNeedUpdate = true;
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



