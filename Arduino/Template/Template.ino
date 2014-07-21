//////////////////
//Laura Devendorf
//Being the Mahcine
//Arduino Uno Code for Guided 3D Printing
////////////////
#include <Servo.h>
#include <avr/pgmspace.h>

///**BEGIN INSERTED VALUES///// 
///**END INSERTED VALUES/////


//ENVIRONMENT VARS
int lastms_x = 100;
int lastms_y = 100;
int last_laser = false;
int i_num = 0;
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
boolean flags[5];
boolean interrupt = false;


//INPUT
const int bounding = 1;
const int instructions = 2;
const int next = 5;
const int play = 3;
const int prev = 0;
int buttonState = 0; 
int highCount[4];

//LASER PARAMS
int fast_blink = 50;
int slow_blink = 100;
int ison = 0;
const int laser = 12;

//RING PARAMS
int led = 2;

//SERVO PARAMS
int minPulse = 1400;
Servo servo_x;
Servo servo_y;


void setup() 
{ 

  // Attach each Servo object to a digital pin
  servo_x.attach(9, 600, 2400);
  servo_y.attach(10, 600, 2400);


  for(int i =  0; i < 5; i++){
    highCount[i] = 0;
  }

  pinMode(play, INPUT);
  pinMode(next, INPUT);
  pinMode(prev, INPUT);
  pinMode(bounding, INPUT);


  pinMode(laser, OUTPUT);
  centerServos();
  Serial.begin(9600);
}


void centerServos(){
  digitalWrite(laser, LOW);  
  servo_x.writeMicroseconds(1500);
  servo_y.writeMicroseconds(1500);
}

void signalEnd(){
  for(int i = 0; i < 10; i++){
    digitalWrite(laser,LOW);  
    myDelay(fast_blink);
    digitalWrite(laser,HIGH);  
    myDelay(slow_blink);
  }
}

void signalPath(){
  for(int i = 0; i < 4; i++){
    digitalWrite(laser,LOW);  
    myDelay(slow_blink);
    digitalWrite(laser,HIGH);  
    myDelay(slow_blink);
  }
}


void signalLayer(){
  for(int i = 0; i < 3; i++){
    digitalWrite(laser,LOW);  
    myDelay(fast_blink);
    digitalWrite(laser,HIGH);  
    myDelay(fast_blink);
  }
}

void moveToBound(){
  int ms_x = 0;
  int ms_y = 0;
  int counter = 0;
  int index;
  
  while(!interrupt){
    counter++;
    index = counter % 4;
    
    if(index == 0){
      ms_x = minPulse;
      ms_y = minPulse;
    }else if(index == 1){
      ms_x = minPulse+200;
      ms_y = minPulse;
    }else if(index == 2){
       ms_x = minPulse+200;
       ms_y = minPulse+200;
    }else{
      ms_x = minPulse;
      ms_y = minPulse+200;
    }
    
    digitalWrite(laser, LOW);
    servo_x.writeMicroseconds(ms_x);
    servo_y.writeMicroseconds(ms_y);
    myDelay(1000);
  }
 
}

int dsquared(int x, int y){
  return sqrt(x*x  + y*y);
}

void myDelay(int time){
  int i = 0;
  boolean hasValue = false;
  while(i < time){
    if(!interrupt) checkButtons();
    delay(1);
    i++;
  }
}

int moveTo(boolean forward){   
  Serial.println(i_num);
  
  unsigned int lval = pgm_read_byte_near(ls + i_num);
  unsigned int xval = pgm_read_byte_near(xs + i_num);
  unsigned int yval = pgm_read_byte_near(ys + i_num);
  int dist = dsquared(xval - lastms_x, yval - lastms_y);  
  
  if(i_num > 0 && last_laser == 0 && lval == 1) signalPath();

  //skim through duplicate values
  if(dist == 0 && lval == last_laser){

    advanceIndex();
    lastms_x = xval;
    lastms_y = yval;
    last_laser = lval;
    dist = moveTo(forward);
    return dist;
  } 


   
  if(lval == 1) digitalWrite(laser, LOW);  
  else digitalWrite(laser, HIGH);
  
  servo_x.writeMicroseconds(xval+minPulse);
  servo_y.writeMicroseconds(yval+minPulse);

  myDelay(dist*10);

 
  
  lastms_x = xval;
  lastms_y = yval;
  last_laser = lval;
  return dist;
 
}


void advanceIndex(){
    if(i_num < inst_num -1){
      ++i_num;
    }else{
      signalEnd();
    }
}

void retractIndex(){
    if(i_num > 0){
       --i_num;
    }else{
      signalEnd();
    }
}


//flags signals in this order
//0: next
//1: previous
//2: play
//3: bounding box
void checkButtons(){
  int states[4];
  int threshold = 100;
  int reset = 300;
  int setValue = false;

  states[0] = analogRead(next);
  states[1] = analogRead(prev);
  states[2] = analogRead(play);
  states[3] = analogRead(bounding);
  //the signal is really noisy so clean it
  for(int i = 0; i < 4; i++){
    flags[i] = false;
    if(states[i] > 660){
      highCount[i]++;
    }
    else{
      highCount[i]= 0;
    }
  }
  

  for(int i = 0; i < 4; i++){
    if(highCount[i] == threshold){
      flags[i] = true;
      interrupt = true;
    }else if(highCount[i] == reset){
      highCount[i] = 0;
    }
  }  
}

void checkSerial(){
   while (Serial.available() > 0) {
     int instruction = Serial.parseInt();
     if(instruction >= 0 && instruction < inst_num){
       i_num = instruction;
       Serial.println("Instruction Set to");
       Serial.println(i_num);
     }else if(instruction == -1){
       centerServos();
     }
   }
}

void loop(){
  int dist = 0;
  checkSerial();
  
  if(!interrupt){
    checkButtons();
  }

    

  if(interrupt){
    
    if(flags[0]){
      Serial.println("n");
      playing = false;
      playing_bounds = false;
      advanceIndex();
      dist = moveTo(true);


    }else if(flags[1]){
      Serial.println("v");
      playing = false;
      playing_bounds = false;
      retractIndex();
      dist = moveTo(false);
    }else if(flags[2]){
      Serial.println("p");
      playing = true;
      playing_bounds = false;
    }else if(flags[3]){
      Serial.println("b");
      playing = false;
      playing_bounds = true;
    }


   interrupt = false;
  }
  
  if(playing){
      advanceIndex();
      dist = moveTo(true);
      myDelay(dist*100);
   }
   
   if(playing_bounds){
     moveToBound();
   } 
  
}













