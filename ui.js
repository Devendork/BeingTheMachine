var render_raw = true;
var scene2d = null;
var scene3d = null;


$('#dimension_3d').attr('checked', 'checked');
$('#render_raw').attr('checked', 'checked');


//this will run first 
$('#opt').change(function(evt){
    console.log("UPDATE OPT");

    console.log($('#render_adjusted').prop("checked"));
    console.log($('#render_raw').prop("checked"));

    var m = parseFloat($('#force_height').val());
    var a = parseInt($('#force_angle').val());
    var d = parseInt($('#force_distance').val());
    var ha =  parseInt($('#force_halfangle').val());
    var mi = parseInt($('#layer_min').val());
    var ma = parseInt($('#layer_max').val());

    if($('#render_adjusted').prop("checked")){
      render_raw = false;
    }else{
      render_raw = true;
    }

    if($('#dimension_3d').prop("checked")){
      if(m == 0) m = raw_flavor.material_height;
    }else{
      m = 0;
    }

    updateModel( m, a, d, ha, mi, ma);
      
    $('#force_height').val(select_flavor.material_height); 
    $('#force_angle').val(select_flavor.laser_to_center); 
    $('#force_halfangle').val(select_flavor.half_angle); 
    $('#force_distance').val(select_flavor.laser.z); 
    $('#layer_min').val(select_flavor.range.min); 
    $('#layer_max').val(select_flavor.range.max); 

});

//these two need dynamic updating
$('#force_halfangle').change(function(evt){
   $('#force_distance').val(-1);   
});

//these two need dynamic updating
$('#force_distance').change(function(evt){
   $('#force_halfangle').val(-1); 
});

$('#dimension_2d').click(function (evt){
  console.log("UPDATE DIMENSION");
  $('#force_height').val(0);
});


$('#dimension_3d').click(function (evt){
  console.log("3d clicked");
  var h = $('#force_height').val();
  if(h == 0) h = raw_flavor.material_height;
  $('#force_height').val(h);
});

$('#render_raw').click(function(evt){
  console.log("render_raw");
  render_raw = true;
});


$('#render_adjusted').click(function(evt){
  console.log("render_adjusted");
  render_raw = false;
});

// $('#force_distance').change(function(evt){
//   var d = $('#force_distance').val();
//   console.log("force distance to "+d);
//   updateModel(select_flavor.material_height, select_flavor.laser_to_center, d, -1);

//   var a = $('#force_halfangle').val();
//   console.log("half angle was "+a);

//   //make sure that the half angle is in range for the hardware
//   if(a > 38){
//      updateModel(select_flavor.material_height, select_flavor.laser_to_center, -1, 38);
//       $('#force_distance').val(select_flavor.laser.z);
//   }else{
//     $('#force_halfangle').val(select_flavor.half_angle);
//   }
  
// });

// $('#force_height').change(function(evt){
//   var h = $('#force_height').val();
//   console.log("force height to "+h);
//   updateModel(h, select_flavor.laser_to_center, select_flavor.laser.z, select_flavor.half_angle);
// });



function updateModel(h, a, dist, ha, min, max){

  if(hasGL) scene3d.remove(select_flavor.object); 
  select_flavor = new outputFlavor(raw_flavor.is.slice(0), raw_flavor.diameter, h, a,  render_raw, dist, ha, min, max);   
  
  scene2d.add(select_flavor);
  if(hasGL) scene3d.add(select_flavor.object);

  var m_size = Math.round(select_flavor.diameter* 100 ) / 100; 
  var dist = Math.round(select_flavor.laser.z * 100 ) / 100; 
  $("#model_material_size").text("Material Size: "+m_size+" mm");
  $("#model_laser_distance").text("Distance from Base to Laser: "+dist+" mm");

}

/*
$('#opt ').click(function(evt) {
   var dim = $('input[name=dimension]:checked').val(); 
   var ren = $('input[name=render]:checked').val(); 
   var h = 0;
   var fh = $('#force_height').val();
   console.log("Forcing Height of "+ fh);


   if(dim == "2d"){
     h = 0;
     use_height = false;
     $('#force_height').prop('disabled', true);
   } else{
     if(fh != raw_flavor.height) h = fh;
     else h = raw_flavor.height;
     use_height = true;
     $('#force_height').prop('disabled', false);
   }

  $('#force_height').val(h);
  
  if(dim == "raw") render_raw = true;
  else render_raw= false;

});
*/


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
  file_lines.push("//// Material Diameter "+select_flavor.diameter); 
  file_lines.push("//// Material Height"+select_flavor.material_height); 
  var file = loadFile("Arduino/Template_ArduinoStorage.ino", function(arduino){
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

function sdcard(){
  console.log("sd card");
  var data = getSDInstructions();
  var new_file = data.join("\n");
  window.open('data:text/sd_file.txt;charset=utf-8,' + escape(new_file));
}

function about() {
  $('#aboutModal').modal();
}
$("#optionsModal").on('shown', function() {
  $(this).find("[autofocus]:first").focus();
});

function options(evt) {
  $('#optionsModal').modal()
}

function openDialog() {
  $('#openModal').modal();
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
  if (hasGL && select_flavor != undefined && select_flavor.object) {
    scene3d.remove(select_flavor.object);
  }

  loadFile(path, function(gcode) {
    createGeometryFromGCode(gcode);
    scene2d.add(select_flavor);
    
    if(hasGL){
      scene3d.add(select_flavor.object);
    }

    var path_print = path.slice(path.lastIndexOf("/")+1);
    var m_size = Math.round(select_flavor.material_height * 100 ) / 100; 
    var dist = Math.round(select_flavor.laser.z * 100 ) / 100; 
    $("#model_filename").text("Filename: "+path_print);
    $("#model_material_size").text("Material Size: "+m_size+" mm");
    $("#model_laser_distance").text("Distance from Base to Laser: "+dist+" mm");


    localStorage.setItem('last-loaded', path);
    localStorage.removeItem('last-imported');
  });
}

function openGCodeFromText(name, gcode) {
  $('#openModal').modal('hide');
  if (hasGL && select_flavor && select_flavor.object) {
    scene3d.remove(select_flavor.object);
    }
  
    createGeometryFromGCode(gcode);
    scene2d.add(select_flavor);
  
  if(hasGL){
    scene3d.add(select_flavor.object);
  } 


    var m_size = Math.round(select_flavor.material_height* 100 ) / 100; 
    var dist = Math.round(select_flavor.laser.z * 100 ) / 100; 
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

