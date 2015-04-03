var d2 = {
	ebbox:0,
	offset:[],
	lines: [], // [layer_id][path_id] = {SVG.Polyline: p, points: []}
	margin:40,
	scale:1,
	circle:null,
	progress:null,
	//line:null,
	ptr: {
		layer: 0,
		step: 0,
		polyline: 0,
		point: 0
	},

	init:function(element){
		console.log("init d2");
		d2.element = element;
		d2.w = element.width();
		d2.h = element.height();

		d2.draw = SVG('renderArea2d');
		d2.group = d2.draw.group();

	},

	loadLines:function(){
		console.log("load ghost");
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
		 	   polylines.push(line);
			}
			d2.lines.push(polylines);
		}

	},

	visited:function(svg){
		svg.attr({stroke: '#000'});
	},
	ghost: function(svg){
		svg.attr({stroke: '#999'});
	},

	plot:function(line, points){
		line.plot(points);
	},

	hide:function(svg){
		svg.remove();
	},

	clearLayerPaths:function(layer_id){
		for(var i in d2.lines[layer_id]){
			d2.hide(d2.lines[layer_id][i].svg);
		}
	},


	// addGhostPaths:function(){
	// 	var last = null;
	// 	var inst = null;	

	// 	for(var i in select_flavor.is[d2.layer]){
	// 		inst = select_flavor.is[d2.layer][i];
	// 		next = d2.getNextInst(d2.layer, i);
	// 		last = d2.getLastInst(d2.layer, i);
	    
	//     if(inst.type == "G1"){
	// 			d2.addGhostPath(inst, last, next);
	// 		}
	// 	}
		
	// 	var g_polylist = [];
	// 	for(var g in d2.ghost_path){
	// 		g_polylist.push(d2.ghost_path[g].join(" "));
	// 	}

	// 	//draw them to screen
	// 	for(var gpl in d2.ghost_polylines){		
	// 		d2.ghost_polylines[gpl].plot(g_polylist[gpl]);
	// 	}
	// },


	// addLayerPaths:function(){
	// 	var last = null;
	// 	var inst = null;	
	//   var next = null;

	// 	for(var i in select_flavor.is[d2.layer]){
	// 		inst = select_flavor.is[d2.layer][i];
	// 		next = d2.getNextInst(d2.layer, i);
	// 		last = d2.getLastInst(d2.layer, i);
	    
	//     if(inst.type == "G1"){ 
	// 			d2.addPath(inst, last, next);
	// 		}	
	// 	}

	// },

	// addGhostPath: function(inst,last, next){
	// 	if(inst.type == "G1" && inst.ext){
	// 		if (last == null || !last.ext){
	// 			var np = [];
	// 			np.push(inst.coord.x+","+inst.coord.y);
	// 			d2.ghost_path.push(np);
	// 			d2.ghost_polylines.push(d2.createPolyline(true));
	// 		}

	//     if(next != null){
	//       d2.ghost_path[d2.ghost_path.length-1].push(next.coord.x+","+next.coord.y);
	//     }

	// 	}

	// },

	// addPath: function(inst,last,next){
	// 	if(inst.type == "G1" && inst.ext){
	// 		if (last == null || !last.ext ||last.coord.z != inst.coord.z){
	// 			var np = [];
	// 			np.push(inst.coord.x+","+inst.coord.y);
	// 			d2.path.push(np);
	// 			d2.polylines.push(d2.createPolyline(false));
	// 		}

	//     if(next != null){
	// 		  d2.path[d2.path.length-1].push(next.coord.x+","+next.coord.y);
	// 	  }
	//   }

	// },

	// removePath:function(inst){
	// 	if(inst.type == "G1" && inst.ext){
			
	// 		var last_ndx = d2.path.length -1;
	// 		var last_coord = d2.path[last_ndx].pop();

	// 		if(d2.path[last_ndx].length == 1){
	// 			d2.path.pop(); 
	// 			var pl = d2.polylines.pop();
	// 			pl.remove();
	// 		}
	// 	}
	// },

	createPolyline:function(ghost){
		var pl = d2.draw.polyline();
		if(!ghost) pl.attr({'stroke-width':2/d2.scale, stroke: '#000'});
		else pl.attr({'stroke-width':2/d2.scale, stroke: '#999'});
		pl.fill('none');
		d2.group.add(pl);
		return pl;	
	},



	add: function(){
		d2.ebbox = select_flavor.bbox;
    	d2.step = 0;
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
			d2.clearLayerPaths(l);
	    }
	    d2.lines = [];

		//load all the new paths
		d2.loadLines();
		

		//draw them to the screen
		if(app.all_layers){
			for(var l = 0; l < d2.lines.length; l++){
				for(p in d2.lines[l]){
					d2.plot(d2.lines[l][p].svg,d2.lines[l][p].points);
					//d2.lines[l][p].plot();
				}
			}
		}else{
			for(p in d2.lines[d2.ptr.layer]){
				d2.plot(d2.lines[d2.ptr.layer][p].svg,d2.lines[d2.ptr.layer][p].points);
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


	nextLayer:function(){
		if(d2.ptr.layer < select_flavor.is.length-1){
			loadLayer(d2.ptr.layer+1);
		}
	},

	loadLayer:function(layer_id){

		if(layer_id < select_flavor.is.length){
		    d2.ptr.layer = layer_id;
			d2.ptr.step = 0;
			d2.ptr.polyline = 0;
			d2.ptr.point = 1;

			//update the polyline colors
			for(var l = 0; l < d2.lines.length; l++){
				for(p in d2.lines[l]){
					if(l < layer_id){
						d2.visited(d2.lines[l][p].svg);
					} 
					if(l >= layer_id) d2.ghost(d2.lines[l][p].svg);
				}
			}


			var pt_from = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point-1];
			var pt_to = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point];
			d2.circle.center(pt_from[0], pt_from[1]);
			d2.circle.animate(10).center(pt_to[0], pt_to[1]);

			d2.updateInterface();
			d2.updatePlane();

		}
	},


	prevLayer: function(){
		if(d2.layer > 0){
			loadLayer(d2.ptr.layer-1);
		}

	},

	nextStep:function(){
		var layer = d2.ptr.layer;
		var polylines = d2.lines[layer];
		var cur_points = polylines[d2.ptr.polyline].points;

		//case 1: move +1 within polyline 
		if(d2.ptr.point < cur_points.length-1){
			d2.ptr.point++;
			var p_to = cur_points[d2.ptr.point];
			d2.progress.plot(cur_points.slice(0, d2.ptr.point));
			d2.progress.front();
			d2.circle.animate(10).center(p_to[0], p_to[1]);
		}else if(d2.ptr.polyline < polylines.length-1){
			//case 2: move to next polyline on same layer
			d2.ptr.polyline++;
			d2.ptr.point = 1;
			var pt_from = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point-1];
			var pt_to = d2.lines[d2.ptr.layer][d2.ptr.polyline].points[d2.ptr.point];


			d2.visited(polylines[d2.ptr.polyline-1].svg);
			d2.circle.center(pt_from[0], pt_from[1]);
			d2.circle.animate(10).center(pt_to[0], pt_to[1]);

		}else if(layer < d2.lines.length -1){
			d2.loadLayer(layer+1);
		}

		d2.updateInterface();
		d2.updatePlane();

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
				d2.step = select_flavor.is[d2.layer].length -1;
				d2.drawStep({fwd: false, reset:false});
				d2.updatePlane();
			}
		}
	},


	getLastInst:function(l, s){
		s = s -1;
		if(s < 0){
			l--;
			if(l < 0) return null;
			s = select_flavor.is[l].length -1;
		}
		return select_flavor.is[l][s];
	},

	getNextInst:function(l, s){
	  s = s + 1;
	  var inst = null;
	  var ins = select_flavor.is;

	  //case inst is at end of layer
	  if(s >= ins[l].length){
	  	l++;
	  	s = 0;
	  	if(l >= ins.length()) return null;
	  }
	  return select_flavor.is[l][s];
	},

	/***
	inc - {next: true/false, forward: true/false, new_layer: true/false}
	*/
	drawStep:function(cause){


		if(select_flavor.is && select_flavor.is.length > 0){
			

			var inst = select_flavor.is[d2.layer][d2.step];
			// var li = d2.getLastInst(d2.layer, d2.step); 
		 //    var ni = d2.getNextInst(d2.layer, d2.step);


			// var d = 0;
			// if(inst.type == "G1" && !cause.reset && cause.fwd){
			// 	d2.addPath(inst, li, ni);
			// 	d = inst.obj.d_traveling;
			// }
		
			// if(!cause.reset && !cause.fwd && (ni != null && ni.type == "G1")){
			// 	d2.removePath(ni);
			// 	d = ni.obj.d_traveling;
			// }

			// var polylist = [];
			// for(var p in d2.path){
			// 	polylist.push(d2.path[p].join(" "));
			// }

				
			// var anitime = d * (10); //20ms/mm

			// for(var pl in d2.polylines){		
			// 	d2.polylines[pl].plot(polylist[pl]);
			// 	d2.polylines[pl].front();
			// }

			//if(ni != null){
			  //if(cause.reset) d2.circle.center(last.to.x,last.to.y);
			   d2.circle.animate(10).center(inst.to.x,inst.to.y);
			//}

		
			d2.circle.front();

			(inst.ext) ? d2.circle.attr({fill: '#0f0'}) :d2.circle.attr({fill: '#f00'});
			d2.updateInterface();

		}
	},

	updateInterface:function(){
		//$("#layerRange").prop('value', d2.layer);
		var show_layer = +d2.ptr.layer+1;
		var show_step = +d2.ptr.step +1;
		var last_layer = select_flavor.is[select_flavor.is.length-1];
		var num_instructions = last_layer[last_layer.length-1].id;

		$("#curLayer").text(show_layer);

		//$("#instRange").prop('value', d2.step);
		$("#curInst").text(d2.step);

		var current_i = select_flavor.is[d2.layer][d2.step].id;
		var p = Math.floor(current_i / num_instructions * 100);
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



