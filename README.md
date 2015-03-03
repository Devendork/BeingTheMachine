Being The Machine
===============
This is the web based component of a larger project that guides a human in building something like a 3D printer. It takes gcode files as input and allows someone to visualize and customize their model for "printing" by hand. 

Full instructions available at: http://www.instructables.com/id/Become-Your-Own-3D-Printer/
Catalog of my projects with the system at: beingthemachine.com

The physical portion of this project consists of an Arduino, pan-tilt bracket (made with servo motors), with a laser attached to the bracket. 

The link to "Download for Arduino" converts each gcode position, in order, to angle coordinates (represented in microseconds) so that the laser point essentially "draws" the G-Code instrcutures that are visualized in this interface. In an effort to perserve memory, each position is stored as a relative position + or - 10 degrees from the center point. Position 0 represetns -10 degrees and position 200 represents +10 degrees. This allows for the information to be stored in a single byteand stored on the Ardunio itself. If you are using this version of the code, download the "Template_ArduinoStorage.ino" and upload it to your arduino.  

In Jan 2015 - I updated the Arduino code and hardware to read from an SD card. This allows me to use a greater angle range. The "Download to SD card" link will generate a list of instructions that can be copy and pasted into a file called DATA.TXT on an SD Card. If you are using this version, download the Arduino file "Template_SDCard.ino" and use it to run the code.    

