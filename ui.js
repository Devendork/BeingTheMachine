

function error(msg) {
  alert(msg);
}




function loadFile(path, callback /* function(contents) */) {
  $.get(path, null, callback, 'text')
    .error(function() { error() });
}

function arduino(){
	var data = getArduinoFile();
  var file_lines = [];
  file_lines.push("//// Values generated for "+$("#model_filename").text());
  var file = loadFile("Arduino/Template/Template.ino", function(arduino){
  var lines = arduino.split('\n');
   console.log("num lines "+lines.length);

    var deleting = false;

      for (var i = 0; i < lines.length; i++) {
        if(lines[i].indexOf("///**END") != -1){
          deleting = false
        }
        if(!deleting) file_lines.push(lines[i]);

        if(lines[i].indexOf("///**BEGIN") != -1){
          for(var j = 0; j < data.length; j++){
            file_lines.push(data[j]);
          }
          deleting = true;
        }    
      }  
   
    var new_file = file_lines.join("\n");
    window.open('data:text/something.ino;charset=utf-8,' + escape(new_file));
  });

  

}

function about() {
  $('#aboutModal').modal();
}

function openDialog() {
  $('#openModal').modal();
}

var scene2d = null;
var scene3d = null;
var object = null;
var plane = null;

function createPlane(){
  var z;
	if(instructions != null){
		var inst = null;
		var i = 0;
		while(inst == null && i < instructions[0].count()){
			inst = instructions[0][i].obj;
		}
		
		z = (inst == null) ? 0 : inst.to.z;
	}else z = 0;


  var material = new THREE.MeshBasicMaterial( {color: "#005B66", side: THREE.DoubleSide} );
	var geometry = new THREE.PlaneGeometry(ebbox.max.x - ebbox.min.x, ebbox.max.y - ebbox.min.y);

	plane = new THREE.Mesh( geometry, material );
	
	var center = new THREE.Vector3(
  		ebbox.min.x + ((ebbox.max.x - ebbox.min.x) / 2),
  		ebbox.min.y + ((ebbox.max.y - ebbox.min.y) / 2), 
		  ebbox.min.z);
  
	plane.position = center;
	object.add(plane);	

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
      dimension = ebbox.max.x - ebbox.min.x;
      line_objects[i].vertices.push(
        new THREE.Vector3(ebbox.min.x, ebbox.min.y -5 , ebbox.min.z),
        new THREE.Vector3(ebbox.max.x, ebbox.min.y -5 , ebbox.min.z)
      );
    }

    if(i == 1){
      axis = "y";
      dimension = ebbox.max.y - ebbox.min.y;
      line_objects[i].vertices.push(
        new THREE.Vector3(ebbox.min.x-5, ebbox.min.y, ebbox.min.z),
        new THREE.Vector3(ebbox.min.x-5, ebbox.max.y, ebbox.min.z)
      );
    }

    if(i == 2){
      axis = "z";
      dimension = ebbox.max.z - ebbox.min.z;
      line_objects[i].vertices.push(
        new THREE.Vector3(ebbox.min.x-5, ebbox.min.y -5 , ebbox.min.z),
        new THREE.Vector3(ebbox.min.x-5, ebbox.min.y -5 , ebbox.max.z)
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
      text.position.x =  ebbox.min.x + 0.5*dimension + centerOffset;
      text.position.y =  ebbox.min.y - 10;
      text.position.z = z;
    }

    if(i == 1){
      text.position.x = ebbox.min.x - 10;
      text.position.y = ebbox.min.y + (dimension * 0.5) + centerOffset;
      text.position.z = z;
      text.rotation.z = Math.PI * 0.5;
    }

    if(i == 2){
      text.position.x = ebbox.min.x-5;
      text.position.y = ebbox.min.y-10; 
      text.position.z = ebbox.min.z + (dimension * 0.5)- centerOffset;
      text.rotation.y = Math.PI * 0.5;
    }

    object.add(text);	
    object.add(line);	


  }

}


function checkKey(e){


    e = e || window.event;
    if (e.keyCode == '37') {
		    // left arrow
		   scene2d.prevStep();
		}
	else if (e.keyCode == '39') {
		    //right arrow
		scene2d.nextStep();	
	}
	else if(e.keyCode == '38'){
		//up arrow
		scene2d.nextLayer();
	}else if(e.keyCode == '40'){
		//down arrow
		scene2d.prevLayer();
	}

}



function openGCodeFromPath(path) {
  $('#openModal').modal('hide');
  if (hasGL && object) {
    scene3d.remove(object);
  }

  loadFile(path, function(gcode) {
    createGeometryFromGCode(gcode);
    scene2d.add(instructions);
    
    if(hasGL){
      object = createObjectFromInstructions();
      createPlane();
      scene3d.add(object);
    }

    var ard_env = getArduinoData();
    var path_print = path.slice(path.lastIndexOf("/")+1);
    var m_size = Math.round(ard_env.material_size * 100 ) / 100; 
    var dist = Math.round(ard_env.height * 100 ) / 100; 
    $("#model_filename").text("Filename: "+path_print);
    $("#model_material_size").text("Material Size: "+m_size+" mm");
    $("#model_laser_distance").text("Distance from Base to Laser: "+dist+" mm");

    localStorage.setItem('last-loaded', path);
    localStorage.removeItem('last-imported');
  });
}

function openGCodeFromText(name, gcode) {
  $('#openModal').modal('hide');
  if (hasGL && object) {
    scene3d.remove(object);
    }
  
  createGeometryFromGCode(gcode);
  scene2d.add(instructions);
  
  if(hasGL){
  	object = createObjectFromInstructions();
  	createPlane();
	  scene3d.add(object);
  }	

    var m_size = Math.round(build_env.material_size * 100 ) / 100; 
    var dist = Math.round(build_env.height * 100 ) / 100; 
    $("#model_filename").text("Filename: "+name);
    $("#model_material_size").text("Material Size: "+m_size+" mm");
    $("#model_laser_distance").text("Distance from Base to Laser: "+dist+" mm");

    

    localStorage.setItem('last-imported', gcode);
    localStorage.setItem('last-filename', name);
    localStorage.removeItem('last-loaded');
}

var hasGL = true;
$(function() {


  if (!Modernizr.webgl) {
    alert('You need a WebGL capable browser to view the 3D portion of this.\n\nGet the latest Chrome or FireFox.');
    hasGL = false;  
}

  if (!Modernizr.localstorage) {
    alert('You need a WebGL capable browser to view the 3D portion of this.\n\nGet the latest Chrome or FireFox.');
    hasGL = false;
  }

  // Show 'About' dialog for first time visits.
  if (!localStorage.getItem("not-first-visit")) {
    localStorage.setItem("not-first-visit", true);
    setTimeout(about, 500);
  }

  
  // Drop files from desktop onto main page to import them.
  $('body').on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'copy'
  }).on('drop', function(event) {
    event.stopPropagation();
    event.preventDefault();
    var files = event.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      var reader = new FileReader();
      reader.onload = function() {
        openGCodeFromText(files[0].name, reader.result);
      };
      reader.readAsText(files[0]);
    }
  });

  scene2d = new Scene2D($('#renderArea2d'));
  if(hasGL) scene3d = create3DScene($('#renderArea3d'));

  var lastImported = localStorage.getItem('last-imported');
  var lastLoaded = localStorage.getItem('last-loaded');
  var lastFilename = localStorage.getItem('last-filename');


  if (lastImported) {
    openGCodeFromText(lastFilename, lastImported);
  } else {
    openGCodeFromPath(lastLoaded || 'examples/octocat.gcode');
  }
  
  
});

