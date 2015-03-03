#include <SD.h>
#include <Servo.h>

////////////////////
//Laura Devendorf
//Being the Machine
//Arduino Uno or Micro Code for Guided 3D Printing
//Generated: 8/20/14
////////////////

//* SD card attached to SPI bus as follows:
// ** MOSI - pin 11
// ** MISO - pin 12
// ** CLK - pin 13
// ** CS - pin 4


///CHANGE THESE VARIABLES FOR YOUR PARTICULAR PARTS AND SETUP///
///key fob pin mappings (should be the same for all fobs)
const int next = A3; 
const int play = A5; 
const int prev = A2; 
const int bounds = A4; 
//piezo pin
const int speaker = 7;
//laser pin
const int laser = 8;
//servo pins
const int pin_x = 9;
const int pin_y = 10;
//laser params (some lasers turn on when low, use this to customize for 
//your particular laser)
const int on = LOW;
const int off = HIGH;
/////////////////////////////////////

//SD VARS
const int SERIAL_PORT = 9600;
const int CHIP_SELECT = 4;
const int LOOP_DELAY = 100;
const char FILE_NAME[] = "data.txt";
File myFile;


//ENVIRONMENT VARS
int lastms_x = 100;
int lastms_y = 100;
int last_laser = false;
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
int velocity = 100;
int cur_layer = 0;
int half_angle = 10;
int bx[4];
int by[4];
int file_pos = 0;

//store the current instruction locaiton globally
int i_num = 0;
int ix = 0;
int iy = 0; 
int il = 0;

//INPUT
const int num_buttons = 4;
int buttonState = 0;
int low_count[num_buttons];
boolean flags[num_buttons];
boolean interrupt = false;

//OUTPUT
int tones[] = {
  261, 277, 294, 311, 330, 349, 370, 392, 415, 440};


//LASER PARAMS
int fast_blink = 50;
int slow_blink = 100;
int ison = 0;

//SERVO PARAMS
int minPulse = 1400;
Servo servo_x;
Servo servo_y;


void setup()
{ 

  // Open serial communications and wait for port to open:
  Serial.begin(SERIAL_PORT);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo only
  }

  Serial.print("Initializing SD card...");
  // make sure that the default chip select pin is set to
  // output, even if you don't use it:
  pinMode(10, OUTPUT);

  // see if the card is present and can be initialized:
  if (!SD.begin(CHIP_SELECT)) {
    Serial.println("Card failed, or not present");
    // don't do anything more:
    return;
  }
  Serial.println("card initialized.");

  // Attach each Servo object to a digital pin
  servo_x.attach(pin_x, 600, 2400);
  servo_y.attach(pin_y, 600, 2400);


  for (int i =  0; i < num_buttons; i++) {
    low_count[i] = 0;
  }

  pinMode(next, INPUT);
  pinMode(prev, INPUT);
  pinMode(play, INPUT);
  pinMode(laser, OUTPUT);

  centerServos();
  Serial.begin(9600);

  //read the initializaiton data from the file
  myFile = SD.open("data.txt");
  boolean header_read = false;

  if (myFile) {    
    while(myFile.available() && !header_read){
      int c = myFile.read();

      if(c == 'h'){
        half_angle = myFile.parseInt();
        Serial.print("half angle: ");
        Serial.println(half_angle); 
        min_pulse = 1500 - half_angle*10;
      }

      if(c == 'x'){
        Serial.println("x bounds");
        for(int i = 0; i < 4; i++){
          bx[i] = myFile.parseInt();
          Serial.println(bx[i]);
        }
      }

      if(c == 'y'){
        Serial.println("y bounds");
        for(int i = 0; i < 4; i++){
          by[i] = myFile.parseInt();
          Serial.println(by[i]);
        }
        file_pos = myFile.position();
        header_read = true;

      }
    }
    myFile.close();
  } 
  else {
    // if the file didn't open, print an error:
    Serial.println("error opening data.txt");
  }

}



void centerServos() {
  digitalWrite(laser, on);
  servo_x.writeMicroseconds(1500);
  servo_y.writeMicroseconds(1500);
}

void signalEnd() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(laser, on);
    myDelay(fast_blink);
    digitalWrite(laser, off);
    myDelay(slow_blink);
  }
}

void signalPath(boolean forward) {
  for(int i = 0; i < 2; i++){
    tone(speaker, tones[4]);
    delay(100);
    noTone(speaker);
    delay(800);
  }

  for (int i = 0; i < 4; i++) {
    digitalWrite(laser, on);
    myDelay(slow_blink);
    digitalWrite(laser, off);
    myDelay(slow_blink);
  }
}


void signalLayer(boolean up) {
  Serial.println("Signal Layer");
  if (up) {
    for (int i = 6; i < 10; i++)
    {
      tone(speaker, tones[i]);
      delay(100);
    }
  } 
  else {
    for (int i = 9; i >= 6; i--)
    {
      tone(speaker, tones[i]);
      delay(100);
    }
  }
  noTone(speaker);
  delay(800);
}

//update this to read actual bounds
void moveToBound() {
  int x = 0;
  int y = 0;
  int counter = 0;
  int index;

  while (!interrupt) {
    counter++;
    index = counter % 4;
    x = bx[index]; 
    y = bx[index]; 

    servo_x.writeMicroseconds(minPulse+x);
    servo_y.writeMicroseconds(minPulse+y);
    myDelay(1000);
  }

}

int distance(int x, int y) {
  return sqrt(x * x  + y * y);
}

void myDelay(int time) {
  int i = 0;
  boolean hasValue = false;
  while (i < time) {
    if (!interrupt) checkFob();
    i += rate;
  }
}


void moveTo(boolean forward, boolean smooth, int velocity) {
  Serial.println(i_num);

  unsigned int lval = pgm_read_byte_near(ls + i_num);
  unsigned int xval = pgm_read_byte_near(xs + i_num);
  unsigned int yval = pgm_read_byte_near(ys + i_num);
  unsigned  layer_val = pgm_read_word_near(layers + cur_layer);
  unsigned  last_layer = pgm_read_word_near(layers + cur_layer - 1);



  //int dist = distance(xval - lastms_x, yval - lastms_y);

  if (i_num > 0 && last_laser == 0 && lval == 1) {
    signalPath();

    //hold at this step
    if (forward) i_num--;
    else i_num++;
    last_laser = lval;
    return;
  }

  if (lval == 1) digitalWrite(laser, on);
  else digitalWrite(laser, off);


  if (!smooth || lval == 0) {
    servo_x.writeMicroseconds(xval + minPulse);
    servo_y.writeMicroseconds(yval + minPulse);
    if (lval == 0 && smooth) myDelay(2000);
    else myDelay(100);
  } 
  else {

    int dx = lastms_x - xval;
    dx = abs(dx); //arduino doesn't like subtraction in absolute value brackets
    int dy = lastms_y - yval;
    dy = abs(dy);
    int x_step = 1;
    int y_step = 1;

    if (lastms_x > xval) x_step = -1;
    if (lastms_y > xval) y_step = -1;

    int max_d = dx;
    if (dx < dy) max_d = dy;

    //    for (int i = 0; i < max_d; i++) {
    //      if (i < dx) servo_x.writeMicroseconds(minPulse + lastms_x + i * x_step);
    //      if (i < dy) servo_y.writeMicroseconds(minPulse + lastms_y + i * y_step);
    //      delay(velocity);
    //    }

    servo_x.writeMicroseconds(xval + minPulse);
    servo_y.writeMicroseconds(yval + minPulse);
    myDelay(velocity * max_d);
  }

  lastms_x = xval;
  lastms_y = yval;
  last_laser = lval;


}


boolean advanceIndex() {
  //    tone(speaker, tones[9]);
  //    delay(20);
  //    noTone(speaker);
  boolean run_again = false;
  myFile = SD.open("data.txt");
  if (myFile) {
    myFile.seek(file_pos);
    char c = myFile.read();

    //move through multiple layers if they were printed in error
    while(c == 'l'){
      cur_layer = myFile.parseInt();
      signalLayer(true);
      c = myFile.read();
    }
    
    boolean had_p = false;
    while(c == 'p'){
      had_p = true;
      ix = myFile.parseInt();
      iy = myFile.parseInt(); 
      moveTo(ix, iy, 0); //move to this point with the light off
      c = myFile.read();
    }
    if(had_p) signalPath(); //if we moved through a dark spot alert that we're beginning again
    
    if(c == 'g'){
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }

    file_pos = myFile.position();
  }
  if(myFile.available() == 0) signalEnd();
  myFile.close();
  
}

//depends of file format in regex form of 
// h x y p {{g|p}* g l p}* 
void retractIndex() {
  if(file_pos <= 0) return;
  
  char c; 
  char next_c; 
  myFile = SD.open("data.txt");
  
  
  if (myFile) {
    file_pos--; //rewind one so you don't read the next line, but the end of the last
    myFile.seek(file_pos);
    
    char c = myFile.peek();
    //this rewinds to the beginnign of the current instruction
    while(c != 'g' || c != 'l' || c != 'y' || c != 'x'  || c != 'p'){
      file_pos--;
      c = myFile.peek();
      next_c = c;
    }
    
    //this rewinds to the beginning of the previous instruction
    while(c != 'g' || c != 'l' || c != 'y' || c != 'x' || c != 'p'){
      file_pos--;
      c = myFile.peek();
    }
    
    //do the laser on/off accoding to next_c, c is just for the coordinate
    if(c == 'p' && next_c == 'g'){
      //go to the point listed in the p line with laser on
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }else if(c == 'p' && next_c == 'p'){
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
    }else if(c == 'g' && next_c == 'p'){
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
      signalPath();
    }else if(c == 'g' && next_c == 'g'){
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }else if(c == 'g' && next_c == 'l'){
      cur_layer--;
      signalLayer(false);
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0); //just in case but this shouldn't have moved at all 
    }else if(c == 'l' && next_c == 'p'){
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
    }
    
    file_pos = myFile.position();  
  }
  myFile.close();
}

void checkFob() {

  delay(rate);
  int states[num_buttons];
  int reset = 400;
  int setValue = false;
  states[0] = digitalRead(next);
  states[1] = digitalRead(prev);
  states[2] = digitalRead(play);
  states[3] = digitalRead(bounds);


  for (int i = 0; i < num_buttons; i++) {
    if (states[i] == 1) {
      if (low_count[i] == 0) {
        flags[i] = true;
        interrupt = true;
      } 
      else if (low_count[i] == reset) {
        low_count[i] = 0;
      } 
      else {
        low_count[i]++;
      }


    } 
    else {
      low_count[i] = 0;
    }
  }
}

void checkButtons() {


  delay(rate);
  int states[num_buttons];
  int reset = 200;
  int setValue = false;
  states[0] = analogRead(next);
  states[1] = analogRead(prev);
  states[2] = analogRead(play);
  int lowest = 0;
  int low_val = states[0];

  //get the lowest value of the buttons
  for (int i = 1; i < num_buttons; i++) {
    if (states[i] < low_val) {
      low_val = states[i];
      lowest = i;
    }
  }

  for (int i = 0; i < num_buttons; i++) {
    if (i == lowest && low_val < 1) {

      if (low_count[i] == 0) {
        flags[i] = true;
        interrupt = true;
      } 
      else if (low_count[i] == reset) {
        low_count[i] = 0;
      }
      low_count[i]++;


    } 
    else {
      low_count[i] = 0;
    }
  }
}

void checkSerial() {
  while (Serial.available() > 0) {
    int instruction = Serial.parseInt();
    if (instruction >= 0 && instruction < inst_num) {
      i_num = instruction;
      Serial.println("Instruction Set to");
      Serial.println(i_num);

      Serial.println("Layer Set To");
      cur_layer = 0;
      unsigned  layer_val = pgm_read_word_near(layers + cur_layer);
      while(layer_val != 0 && i_num > layer_val){
        cur_layer++;
        layer_val = pgm_read_word_near(layers + cur_layer);
      }
      Serial.println(cur_layer);

      moveTo(true, false, velocity);
    } 
    else if (instruction == -1) {
      Serial.println("Center Servos");
      centerServos();
    } 
    else if (instruction == -2) {
      playing_bounds = true;
      interrupt = true;
    }
  }
}

void loop() {
  int dist = 0;
  checkSerial();

  if (!interrupt) {
    checkFob();
  }

  if (interrupt) {


    if (flags[0]) {
      flags[0] = false;
      Serial.println("n");
      playing = false;
      playing_bounds = false;
      advanceIndex();
      moveTo(true, false, velocity);

    } 
    else if (flags[1]) {
      flags[1] = false;

      Serial.println("v");
      playing = false;
      playing_bounds = false;
      retractIndex();
      moveTo(false, false, velocity);

    } 
    else if (flags[2]) {
      flags[2] = false;

      Serial.println("p");
      playing = !playing;
      playing_bounds = false;
    } 
    else if (flags[3]) {
      flags[3] = false;

      Serial.println("b");
      playing = false;
      playing_bounds = true;
    }


    interrupt = false;
  }

  if (playing) {
    advanceIndex();
    moveTo(true, true, velocity);
  }

  if (playing_bounds) {
    moveToBound();
  }

}

