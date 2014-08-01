//////////////////
//Laura Devendorf
//Being the Mahcine
//Arduino Uno Code for Guided 3D Printing
//Generated: 8/1/14
////////////////

#include <Servo.h>
#include <avr/pgmspace.h>

///**BEGIN INSERTED VALUES/////
int inst_num = 8;
const PROGMEM uint8_t xs[] = {0, 200, 200, 0, 0, 200, 200, 0,};
const PROGMEM uint8_t ys[] = {0, 0, 200, 200, 0, 0, 200, 200};
const PROGMEM uint8_t ls[] = {0, 1, 1, 1, 1, 1, 1, 1};
///**END INSERTED VALUES/////


//ENVIRONMENT VARS
int lastms_x = 100;
int lastms_y = 100;
int last_laser = false;
int i_num = 0;
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
int velocity = 100;
int current_layer = 0;


//INPUT
const int next = 3;
const int play = 5;
const int prev = 4;
const int num_buttons = 3;
int buttonState = 0;
int low_count[num_buttons];
boolean flags[num_buttons];
boolean interrupt = false;


//LASER PARAMS
int fast_blink = 50;
int slow_blink = 100;
int ison = 0;
const int laser = 12;



//SERVO PARAMS
int minPulse = 1400;
Servo servo_x;
Servo servo_y;


void setup()
{

  // Attach each Servo object to a digital pin
  servo_x.attach(9, 600, 2400);
  servo_y.attach(10, 600, 2400);


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
  digitalWrite(laser, HIGH);
  servo_x.writeMicroseconds(1500);
  servo_y.writeMicroseconds(1500);
}

void signalEnd() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(laser, LOW);
    myDelay(fast_blink);
    digitalWrite(laser, HIGH);
    myDelay(slow_blink);
  }
}

void signalPath() {
  for (int i = 0; i < 4; i++) {
    digitalWrite(laser, LOW);
    myDelay(slow_blink);
    digitalWrite(laser, HIGH);
    myDelay(slow_blink);
  }
}


void signalLayer() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(laser, LOW);
    myDelay(fast_blink);
    digitalWrite(laser, HIGH);
    myDelay(fast_blink);
  }
}

void moveToBound() {
  int ms_x = 0;
  int ms_y = 0;
  int counter = 0;
  int index;

  while (!interrupt) {
    counter++;
    index = counter % 4;

    if (index == 0) {
      ms_x = minPulse;
      ms_y = minPulse;
    } else if (index == 1) {
      ms_x = minPulse + 200;
      ms_y = minPulse;
    } else if (index == 2) {
      ms_x = minPulse + 200;
      ms_y = minPulse + 200;
    } else {
      ms_x = minPulse;
      ms_y = minPulse + 200;
    }

    digitalWrite(laser, LOW);
    servo_x.writeMicroseconds(ms_x);
    servo_y.writeMicroseconds(ms_y);
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
    if (!interrupt) checkButtons();
    i += rate;
  }
}

double msToTheta(int ms) {
  double theta = 90 + ((ms - 100) / 10.);
  return (theta * PI / 180.);
}

int calcTime(int start, int last) {
  double theta_start = msToTheta(start);
  double theta_end = msToTheta(start);
  double s = theta_start;
  double e = theta_end;

  if (theta_start > theta_end) {
    s = theta_end;
    e = theta_start;
  }

  double radian = PI / 180.;

  //total time is a function of sin
  double sum = 0;
  for (double i = s; i < e; i += radian) {
    sum += sin(i);
  }

  return int(sum);

}


void moveTo(boolean forward, boolean smooth, int velocity) {
  Serial.println(i_num);
  
  unsigned int lval = pgm_read_byte_near(ls + i_num);
  unsigned int xval = pgm_read_byte_near(xs + i_num);
  unsigned int yval = pgm_read_byte_near(ys + i_num);
  unsigned int layer_val = pgm_read_byte_near(ys + cur_layer);
  int dist = distance(xval - lastms_x, yval - lastms_y);
  
  if(layer_val != 0 && layer_val == i_num){
      signalLayer();
      cur_layer++;
   }

  if (i_num > 0 && last_laser == 0 && lval == 1) {
    signalPath();
    digitalWrite(laser, LOW);
    
    //hold at this step
    if (forward) i_num--;
    else i_num++;
    last_laser = lval;
    return;
  }


  if (lval == 1) digitalWrite(laser, LOW);
  else digitalWrite(laser, HIGH);


  if (!smooth || lval == 0) {
    servo_x.writeMicroseconds(xval + minPulse);
    servo_y.writeMicroseconds(yval + minPulse);
  } else {
    //get time relative to wall speed
    int dx = abs(lastms_x - xval);
    int dy = abs(lastms_y - yval);
    int x_step = 1;
    int y_step = 1;

    if (lastms_x > xval) x_step = -1;
    if (lastms_y > xval) y_step = -1;

    int max_d = (xval > yval) ? xval : yval;
    
    for(int i = 0; i < max_d; i++){
      if(i < dx) servo_x.writeMicroseconds(minPulse + lastms_x + i*x_step);
      if(i < dy) servo_y.writeMicroseconds(minPulse + lastms_y + i*y_step);
      delay(velocity);
    }

    servo_x.writeMicroseconds(xval + minPulse);
    servo_y.writeMicroseconds(yval + minPulse);
  }

  lastms_x = xval;
  lastms_y = yval;
  last_laser = lval;
  return dist;

}


void advanceIndex() {
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

void checkButtons() {


  delay(rate);
  int states[num_buttons];
  int reset = 200;
  int setValue = false;
  states[0] = analogRead(next);
  states[1] = analogRead(prev);
  states[2] = analogRead(play);

  for (int i = 0; i < num_buttons; i++) {
    //see if any are zero and return if
    if (states[i] == 0) {

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
    } else if (instruction == -1) {
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
    checkButtons();

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








