#include <SD.h>
#include <Servo.h>

////////////////////
//Laura Devendorf
//Being the Machine
//Arduino Uno w/ SD Card for Guided 3D Printing
//Edited 1-11-15

//Servo Range
//MIN  -- 1120 / 38 half angle
//MAX  -- 1880

////////////////

//* SD card attached to SPI bus as follows:
// ** MOSI - pin 11
// ** MISO - pin 12
// ** CLK - pin 13                                             
// ** CS - pin 4

//SD VARS
const int SERIAL_PORT = 9600;
const int CHIP_SELECT = 4;
const int LOOP_DELAY = 100;
const char FILE_NAME[] = "data.txt";
File myFile;


///CHANGE THESE VARIABLES FOR YOUR PARTICULAR PARTS AND SETUP///
///key fob pin mappings (should be the same for all fobs)
const int prev = A5; 
const int next = A4; 
const int bounds = A3; 
const int play = A2; 


const int layer_indicator = 2;
const int play_indicator = 6;
const int rewind_indicator = 5;

//piezo pin
const int speaker = 2;
//laser pin
const int laser = 8;
//servo pins
const int pin_x = 9;
const int pin_y = 10;
const int on = LOW;
const int off = HIGH;
/////////////////////////////////////




//ENVIRONMENT VARS
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
int velocity = 50; //higher number = longer wait
int cur_layer = 0;
int half_angle = 10;
int bx[4];
int by[4];
unsigned long file_pos = 0;

//INPUT
const int num_buttons = 4;
int buttonState = 0;
int low_count[num_buttons];
boolean flags[num_buttons];
boolean interrupt = false;
boolean forward = true;

//OUTPUT
int tones[] = {
  261, 277, 294, 311, 330, 349, 370, 392, 415, 440};


//LASER PARAMS
int fast_blink = 50;
int slow_blink = 100;
int ison = 0;

//SERVO PARAMS
Servo servo_x;
Servo servo_y;

//KEEP A TIMER FOR NOTIFICATIONS
int timer = 0;

void setup(){ 

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
     cardError();
  }

}

void writeProgress(int i_num){
  myFile = SD.open("progress.txt", FILE_WRITE);
  // if the file opened okay, write to it:
  if (myFile) {
    myFile.print(i_num);
    myFile.print(",");
    myFile.println(cur_layer);
    myFile.close();
  } 
  else {
    // if the file didn't open, print an error:
    Serial.println("error opening progress.txt");
     cardError();
  }
}


void cardError(){
  for(int i = 0; i < 10; i++){
    digitalWrite(layer_indicator, HIGH);
    digitalWrite(play_indicator, HIGH);
    digitalWrite(rewind_indicator, HIGH);
    delay(500);
    digitalWrite(layer_indicator, LOW);
    digitalWrite(play_indicator, LOW);
    digitalWrite(rewind_indicator, LOW);
    delay(500);
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
    myDelay(fast_blink);
  }
}

void signalPath() {
//  for(int i = 0; i < 2; i++){
//    tone(speaker, tones[4]);
//    delay(100);
//    noTone(speaker);
//    delay(800);
//  }

  for (int i = 0; i < 3; i++) {
    digitalWrite(laser, on);
    myDelay(500);
    digitalWrite(laser, off);
    myDelay(500);
  }
  digitalWrite(laser, on);

}


void signalLayer(boolean up) {
//  Serial.println("Signal Layer");
//
//  //blink the laser
//  for(int i = 0; i < 6; i++){
//    digitalWrite(laser, on);
//    myDelay(200);
//    digitalWrite(laser, off);
//    myDelay(200);
//  }
//  
//  for(int i = 0; i < (cur_layer+1); i++){
//    digitalWrite(layer_indicator, HIGH);
//    digitalWrite(laser, on);
//    myDelay(1000);
//    digitalWrite(layer_indicator, LOW);
//    digitalWrite(laser, off);
//    myDelay(1000);
//  }
//
//  if (up) {
//
//    for (int i = 6; i < 10; i++)
//    {
//      tone(speaker, tones[i]);
//      delay(100);
//    }
//  } 
//  else {
//    for (int i = 9; i >= 6; i--)
//    {
//      tone(speaker, tones[i]);
//      delay(100);
//    }
//  }
//  noTone(speaker);
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
    y = by[index]; 

    servo_x.writeMicroseconds(x);
    servo_y.writeMicroseconds(y);
    myDelay(2000);
  }

}

void myDelay(int time) {
  int i = 0;
  boolean hasValue = false;
  while (i < time) {
    if (!interrupt) checkFob();
    i += rate;
  }
}

void moveTo(int x, int  y, int lval) {
  Serial.print(x);
  Serial.print(" ");
  Serial.println(y);
  
  if (lval == 1) digitalWrite(laser, on);
  else digitalWrite(laser, off);
  int msx = x;
  int msy = y;
  int distance = 0;

  if(msx < 1120 || msx > 1880){
    Serial.println("MSX Out of Range");
    return;
  }
  
  if(msy < 1120){
    Serial.println("MSY Out of Range");   
    return;  
  }

  if(playing && lval == 0){
    servo_x.writeMicroseconds(msx);
    servo_y.writeMicroseconds(msy);
    myDelay(2000);

  }
  else if(playing && lval == 1){
    int x_vec = 1; 
    int y_vec = 1;
    int mstx = servo_x.readMicroseconds();
    int msty = servo_y.readMicroseconds();
    
    if(msx < mstx) x_vec = -1;
    if(msy < msty) y_vec = -1;

    //incrementally 
    while(mstx != msx || msty != msy){
      if(mstx != msx){
        mstx+=x_vec;
        if(mstx > 1128 && mstx < 1880){
          servo_x.writeMicroseconds(mstx);
        }
      }
      // myDelay(velocity/2);
      if(msty != msy){
        msty+=y_vec;
       if(msty > 1128){
        servo_y.writeMicroseconds(msty);
       }
      }
      myDelay(velocity);
    }

  }
  else{
    servo_x.writeMicroseconds(msx);
    servo_y.writeMicroseconds(msy);
    myDelay(100);
  }
}

void advanceIndex() {
  int i_num = -1;
  int ix;
  int iy;
char c;
  Serial.println(file_pos);
  //    tone(speaker, tones[9]);
  //    delay(20);
  //    noTone(speaker);

  myFile = SD.open("data.txt");
  if (myFile) {
    myFile.seek(file_pos);
      c = myFile.read();

    //fast forward to the first meaningful instruction
    while(myFile.available() && c != 'l' && c != 'g' && c != 'p'){
      c = myFile.read();
      Serial.println(c);
    }

    //move through multiple layers if they were printed in error
    if(c == 'l'){
      cur_layer = myFile.parseInt();
      i_num = cur_layer;
      signalLayer(true);
      ix = myFile.parseInt();
      iy = myFile.parseInt(); 
    }
    else if(c == 'p'){
      Serial.println("new path");
      //move though mulitple paths if neccessary
      //while(myFile.available() && c == 'p'){
        i_num = myFile.parseInt();
        ix = myFile.parseInt();
        iy = myFile.parseInt(); 
        moveTo(ix, iy, 0); //move to this point with the light off
//        c = myFile.peek();
      //}
      signalPath();
    }
    else if(c == 'g'){
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }

    file_pos = myFile.position();
  }
  if(myFile.available() == 0) signalEnd();
  myFile.close();
  
  Serial.print("a: ");
  Serial.print(c);
  Serial.print(" ");  
  Serial.println(i_num);
  writeProgress(i_num);
}

//depends of file format in regex form of 
// h x y p {{g|p}* g l p}* 
void retractIndex() {
  if(file_pos <= 0) return;
  int i_num = -1;
  int ix;
  int iy;

  char c; 
  char next_c; 
  myFile = SD.open("data.txt");


  if (myFile) {
    file_pos--; //rewind one so you don't read the next line, but the end of the last

    myFile.seek(file_pos);

    char c = myFile.peek();
    //this rewinds to the beginnign of the current instruction
    while(file_pos > 0 && c != 'g' && c != 'l' && c != 'y' && c != 'x'  && c != 'p'){
      file_pos--;
      myFile.seek(file_pos);
      c = myFile.peek();
      next_c = c;
    }

    file_pos--;
    myFile.seek(file_pos);
    c = myFile.peek();

    //this rewinds to the beginning of the previous instruction
    while(file_pos > 0 && c != 'g' && c != 'l' && c != 'y' && c != 'x' && c != 'p'){
      file_pos--;
      myFile.seek(file_pos);
      c = myFile.peek();
    }
    

    //do the laser on/off accoding to next_c, c is just for the coordinate
    if(c == 'p' && next_c == 'g'){
      //go to the point listed in the p line with laser on
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }
    else if(c == 'p' && next_c == 'p'){
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
    }
    else if(c == 'g' && next_c == 'p'){
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
      signalPath();
    }
    else if(c == 'g' && next_c == 'g'){
      i_num = myFile.parseInt();
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 1);
    }
    else if(c == 'g' && next_c == 'l'){
      i_num = myFile.parseInt();
      cur_layer--;
      signalLayer(false);
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0); //just in case but this shouldn't have moved at all 
    }
    else if(c == 'l' && next_c == 'p'){
      int prev_layer = myFile.parseInt(); //technically you're at the first instruction on the layer but haven't gone back
      ix = myFile.parseInt();
      iy = myFile.parseInt();
      moveTo(ix, iy, 0);
    }

    file_pos = myFile.position();
    myFile.close();
  }else{
    Serial.println("error opening data.txt");
    cardError();
  }
  Serial.print("r: ");
  Serial.println(i_num);
  writeProgress(i_num);

}

void checkFob() {
  delay(rate);
  int states[num_buttons];
  int reset = 400;
  int setValue = false;
  states[0] = analogRead(next);
  states[1] = analogRead(prev);
  states[2] = analogRead(play);
  states[3] = analogRead(bounds); 
  for (int i = 0; i < num_buttons; i++) {
    if (states[i] == 1023) {
      if (low_count[i] == 0) {
        Serial.print("Setting Flag ");
        Serial.println(i);
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


void checkSerial() {
  while (Serial.available() > 0) {
    int instruction = Serial.parseInt();
    Serial.println(instruction);
    
    if(instruction >= 0){
      int x = 1500; //default to center
      int y = 1500; //default to center
      int i = 0;

      //read through to that instruction number
      //move the laser pointer to the place where the instruction should be read from
      //update the file pointer to sit at the beginning of the instruction line 
      file_pos = 0;
      myFile = SD.open("data.txt");
      if (myFile) {
        while(myFile.available() && i != instruction){
          char c = myFile.read();
          if(c == 'g' || c == 'p'){
            i = myFile.parseInt();
            if(i == instruction){
              moveTo(x, y, 0); //move to the previous position with the light off
              
              //pointer* at g12*, rewind to beginning of line so it's *g12

              file_pos = myFile.position();
              Serial.println("Rewind");
              while(myFile.peek() != c){
                file_pos--;
                myFile.seek(file_pos);
              }

            }
            else{
              x = myFile.parseInt();
              y = myFile.parseInt();
            }      
          }
          else if(c == 'l'){
            cur_layer = myFile.parseInt();
          }  
        }
      }
      myFile.close();
      Serial.println("Instruction Set to");
      Serial.println(i);
      Serial.println("Layer Set To");
      Serial.println(cur_layer);
    } 
    else if (instruction == -1) {
      Serial.println("Center Servos");
      centerServos();
    } 
    else if (instruction == -2) {
      playing_bounds = true;
      interrupt = true;
    }else if(instruction == -3){
      playing = !playing;
    }else if(instruction == -4){
      forward = !forward;
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

     //play forward selected
    if (flags[0]) {
      flags[0] = false;
      Serial.println("n");
      playing = true;
      playing_bounds = false;
      forward = true;
      //advanceIndex(); //this handles the move
    } 
    
    //play backward
    else if (flags[1]) {
      flags[1] = false;
      Serial.println("v");
      playing = true;
      playing_bounds = false;
      forward = false;
      //retractIndex();
    } 
    
    //stop playing
    else if (flags[2]) {
      flags[2] = false;
      Serial.println("p");
      playing = false;
      playing_bounds = false;
      forward = true;
    } 
    else if (flags[3]) {
      flags[3] = false;
      Serial.println("b");
      playing = false;
      playing_bounds = true;
      forward = true;
    }
    interrupt = false;
  }

  if (playing) {
    if(forward){
      digitalWrite(play_indicator, HIGH);  
      digitalWrite(rewind_indicator, LOW);
      advanceIndex();
    }else{
     digitalWrite(play_indicator, LOW);  
     digitalWrite(rewind_indicator, HIGH);
     retractIndex();
    }
    
  }else{
    digitalWrite(play_indicator, LOW);
    digitalWrite(rewind_indicator, LOW);
  }

  if (playing_bounds) {
    moveToBound();    
  }

}




