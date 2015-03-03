//// Values generated for Filename: millennium_falcon_middle_solid.gcode
//// Material Diameter 5
//// Material Height5
////////////////////
//Laura Devendorf
//Being the Mahcine
//Arduino Uno or Micro Code for Guided 3D Printing
//Generated: 8/20/14
////////////////

#include <Servo.h>
#include <avr/pgmspace.h>

///**BEGIN INSERTED VALUES/////
Template_ArduinoStorageTemplate_ArduinoStorage
///**END INSERTED VALUES/////

///CHANGE THESE VARIABLES FOR YOUR PARTICULAR PARTS AND SETUP///
///key fob pin mappings (should be the same for all fobs)
const int next = 4; 
const int play = 2; 
const int prev = 5; 
const int bounds = 3; 
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

//ENVIRONMENT VARS
int lastms_x = 100;
int lastms_y = 100;
int last_laser = false;
int i_num = 0;
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
int velocity = 100;
int cur_layer = 0;


//INPUT
const int num_buttons = 4;
int buttonState = 0;
int low_count[num_buttons];
boolean flags[num_buttons];
boolean interrupt = false;

//OUTPUT
int tones[] = {261, 277, 294, 311, 330, 349, 370, 392, 415, 440};


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

void signalPath() {
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
  } else {
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
  unsigned int x = 0;
  unsigned int y = 0;
  int counter = 0;
  int index;

  while (!interrupt) {
    counter++;
    index = counter % 4;
    x = pgm_read_byte_near(bx + index);
    y = pgm_read_byte_near(by + index);
    
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

  if (forward && layer_val != 0 && layer_val == i_num) {
    signalLayer(true);
    cur_layer++;
  }
  if (cur_layer != 0 && !forward && last_layer == i_num) {

    signalLayer(false);
    cur_layer--;
  }


  int dist = distance(xval - lastms_x, yval - lastms_y);

  if (i_num > 0 && last_laser == 0 && lval == 1) {
    signalPath();
    digitalWrite(laser, on);

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
  } else {

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


void advanceIndex() {
//    tone(speaker, tones[9]);
//    delay(20);
//    noTone(speaker);

  if (i_num < inst_num - 1) {
    ++i_num;
  } else {
    signalEnd();
  }
}

void retractIndex() {
  if (i_num > 0) {
    --i_num;
  } else {
    signalEnd();
  }
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
      } else if (low_count[i] == reset) {
        low_count[i] = 0;
      } else {
        low_count[i]++;
      }


    } else {
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
      } else if (low_count[i] == reset) {
        low_count[i] = 0;
      }
      low_count[i]++;


    } else {
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
    } else if (instruction == -1) {
     Serial.println("Center Servos");
      centerServos();
    } else if (instruction == -2) {
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

    } else if (flags[1]) {
      flags[1] = false;

      Serial.println("v");
      playing = false;
      playing_bounds = false;
      retractIndex();
      moveTo(false, false, velocity);

    } else if (flags[2]) {
      flags[2] = false;

      Serial.println("p");
      playing = !playing;
      playing_bounds = false;
    } else if (flags[3]) {
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
