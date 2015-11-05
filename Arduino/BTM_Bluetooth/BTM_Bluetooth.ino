#include <string.h>
#include <stdio.h>
#include <Servo.h>
#include <SoftwareSerial.h>
#define BUFFER_SIZE 64
#define TX false
#define RX true
////////////////////
//Laura Devendorf
//Being the Machine
//Arduino Uno w/ Sparkfun BlueSMiRF Mobule
//Edited 3-19-15
// all instructions are served to the arduino via bluetooth

//Servo Range
//MIN  -- 1120 / 38 half angle
//MAX  -- 1880

////////////////


//BLUETOOTH VARS
const int bluetoothTx = 3;  // TX-O pin of bluetooth mate, Arduino D3
const int bluetoothRx = 4;  // RX-I pin of bluetooth mate, Arduino D4
SoftwareSerial bluetooth(bluetoothTx, bluetoothRx);

///key fob pin mappings (should be the same for all fobs of same model)
const int prev = A0;
const int next = A1;
const int bounds = A2;
const int play = A3;


//laser pin
const int laser = 12;
//servo pins
const int pin_x = 11;
const int pin_y = 10;
const int on = LOW;
const int off = HIGH;


//ENVIRONMENT VARS
boolean initialized = false;
boolean playing = false;
boolean playing_bounds = false;
int velocity = 100; //higher number = longer wait
int cur_layer = 0;
int half_angle = 10;
int bx[4];
int by[4];

int ctr_x = 1477;
int ctr_y = 1225;

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
  261, 277, 294, 311, 330, 349, 370, 392, 415, 440
};


//LASER PARAMS
int fast_blink = 50;
int slow_blink = 100;
int ison = 0;

//SERVO PARAMS
Servo servo_x;
Servo servo_y;

void setup() {

  Serial.begin(9600);
  setupBluetooth();


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

  Serial.println("Waiting for Android Ping...");

  //wait for Android to send the initialization ping
  while (!initialized) {
    checkBluetooth();
    delay(100);
  }
  Serial.println("Bluetooth connection established");
}

char tx_buf[BUFFER_SIZE] = {0};
char rx_buf[BUFFER_SIZE] = {0};
int tx_len = 0;
int rx_len = 0;


void centerServos() {
  digitalWrite(laser, on);
  servo_x.writeMicroseconds(ctr_x);
  servo_y.writeMicroseconds(ctr_y);
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

  for (int i = 0; i < 3; i++) {
    digitalWrite(laser, on);
    myDelay(500);
    digitalWrite(laser, off);
    myDelay(500);
  }
  digitalWrite(laser, on);

}

//update this to read actual bounds
void moveToBound() {
//  int x = 0;
//  int y = 0;
//  int counter = 0;
//  int index;
//
//  while (!interrupt) {
//    counter++;
//    index = counter % 4;
//    x = bx[index];
//    y = by[index];
//
//    servo_x.writeMicroseconds(x);
//    servo_y.writeMicroseconds(y);
//    myDelay(2000);
//  }

}

void myDelay(int time) {
  int i = 0;
  while (i < time) {
    if (!interrupt) checkFob();
    i ++;
  }
}

void moveTo(int x, int  y, int lval) {

   //calculate as offsets from center
   x -= 1500;
   y -= 1500;
   
   
  

  if (lval == 1) digitalWrite(laser, on);
  else digitalWrite(laser, off);
  int msx = x + ctr_x;
  int msy = y + ctr_y;
  int distance = 0;

  if (msx < 1120 || msx > 1880) {
    Serial.println("MSX Out of Range");
    return;
  }

  if (msy < 1120) {
    Serial.println("MSY Out of Range");
    return;
  }

  Serial.print(x);
  Serial.print(" ");
  Serial.println(y);

    if(playing && lval == 0){
      servo_x.writeMicroseconds(msx);
      servo_y.writeMicroseconds(msy);
      Serial.println("playing laser off");
      myDelay(2000);
  
    }
    else if(playing && lval == 1){
       Serial.println("playing laser on");
  
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
    
    //add an additional delay here for the sculpting example
    myDelay(100000);
}


void checkFob() {
  delay(50);
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

void checkBluetooth() {
  //receive incoming data
  if (bluetooth.available()) {
    while (bluetooth.available()) {
      char c = bluetooth.read();
      if (c == 0xA || c == 0xD) { // \n or \r
        //add the NULL character as EOF
        bufferData(NULL, RX);
        digestData();
      } else {
        bufferData(c, RX);
      }
    }
  }

}


void checkSerial() {
  while (Serial.available() > 0) {

    unsigned char c = Serial.read();

    if (c == 0xA || c == 0xD) { // \n or \r
      sendData();
    } else {
      bufferData(c, TX);
    }
  }
}

void loop() {

  int dist = 0;

  //  checkBluetooth();
  //  checkSerial();
  //send data from serial monitor out to arduino


  if (!interrupt) {
    checkFob();
  }

  if (interrupt) {
    //play forward selected
    if (flags[0]) {
      Serial.println("play forward");
      flags[0] = false;
      playing = true;
      playing_bounds = false;
      forward = true;
      bufferData('n', TX); //get next instruction
      sendAndReceiveData();

    }

    //play backward
    else if (flags[1]) {
      Serial.println("play backward");
      flags[1] = false;
      playing = true;
      playing_bounds = false;
      forward = false;
      bufferData('p', TX); //get next instruction
      sendAndReceiveData();
    }

    //stop playing
    else if (flags[2]) {
      Serial.println("stop");
      flags[2] = false;
      playing = false;
      playing_bounds = false;
    }
    else if (flags[3]) {
      Serial.println("bounding box");

      flags[3] = false;
      playing = false;
      playing_bounds = true;
      forward = true;
    }
    interrupt = false;
  }

//  if (playing) {
//    if (forward) {
//      bufferData('n', TX); //get next instruction
//    } else {
//      bufferData('p', TX); //get prev instruction
//    }
//
//    sendAndReceiveData();
//
//  }

//  if (playing_bounds) {
//    moveToBound();
//  }


}

void bufferData(char c, boolean rx) {
  if (rx) {
    if (rx_len < BUFFER_SIZE) {
      rx_buf[rx_len++] = c;
    } // TODO warn, or send data
  } else {
    if (tx_len < BUFFER_SIZE) {
      tx_buf[tx_len++] = c;
    } // TODO warn, or send data
  }
}

//parse the command and trigger action
void digestData() {
  
  interrupt = true;

  const char s[2] = " ";
  int vals[4];
  int i = 0;

  Serial.write("<- ");
  for (int i = 0; i < rx_len; i++) {
    Serial.write(rx_buf[i]);
  }
  Serial.println();

  //break the input into tokens
  char* token = strtok(rx_buf, s);
  char* c = token;
  while ( token != NULL ) {
    token = strtok(NULL, s);
    vals[i] = atoi(token);
    i++;
  }
  
   Serial.print(*c);


  if (*c == 'i') {
//  	//initialize i xmin xmax ymin ymax
//  	int x_min = vals[0];
//  	int x_max = vals[1];
//  	int y_min = vals[2];
//  	int y_max = vals[3];
//
//  	bx[0] = x_min;
//  	by[0] = y_min;
//
//  	bx[1] = x_max;
//  	by[1] = y_min;
//
//  	bx[2] = x_max;
//  	by[2] = y_max;
//
//  	bx[3] = x_min;
//  	by[3] = y_max;

  	initialized = true;

  } else if (*c == 'm') {
    playing_bounds = false;

    //m x y l: move to x y position with laser on (1) or off (0)
    int x = vals[0];
    int y = vals[1];
    int l = vals[2];

    moveTo(x, y, l);


    //  }else if(*c == 'b'){
    //  	//b: draw bounding box
    //  	playing_bounds = true;
    //
    //
    //  }else if(*c == 'c'){
    //  	 playing_bounds = false;
    //  	 centerServos();
    //
    //  }else if(*c == 'p'){
    //  	//p: signal path
    //  	 playing_bounds = false;
    //  	 signalPath();
    //
    //  }else if(*c == 'e'){
    //  	playing_bounds = false;
    //  	playing = false;
    //  }else if(*c == 's'){
    //  	playing_bounds = false;
    //  	playing = true;

  } else {
    Serial.println("ERROR: unknown code");
  }

  rx_len = 0;
  bluetooth.flush();

}

//this function just sends data
void sendData() {


  Serial.write("-> ");
  for (int i = 0; i < tx_len; i++) {
    bluetooth.write(tx_buf[i]);
    Serial.write(tx_buf[i]);
  }

  bluetooth.write(0xA);
  Serial.write(0xA); // TODO test on windows

  tx_len = 0;
  bluetooth.flush();

}

//this sends data and waits for a response before moving on
void sendAndReceiveData() {
  servo_x.detach();
  servo_y.detach();
  Serial.println("servos detatched");
  sendData();
  interrupt = false;
  Serial.println("Waiting for acceptance...");
  while (!interrupt) {
    checkBluetooth();
  }
  interrupt = false;
  servo_x.attach(pin_x, 600, 2400);
  servo_y.attach(pin_y, 600, 2400);
  Serial.println("servos attached");

}


void setupBluetooth() {
  bluetooth.begin(115200);  // The Bluetooth Mate defaults to 115200bps
  bluetooth.print("$$$");  // Enter command mode
  delay(100);  // Short delay, wait for the Mate to send back CMD
  bluetooth.println("U,9600,N");  // Temporarily Change the baudrate to 9600, no parity
  // 115200 can be too fast at times for NewSoftSerial to relay the data reliably
  bluetooth.begin(9600);  // Start bluetooth serial at 9600
}





