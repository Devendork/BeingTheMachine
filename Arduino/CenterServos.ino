#include <Servo.h>

Servo servo_x;
Servo servo_y;

//change these values to match your servo specifications
const int servo_min = 600; 
const int servo_max = 2400;
const int servo_center = 1500;

void setup() {
  servo_x.attach(9, servo_min, servo_max);
  servo_y.attach(10, servo_min, servo_max);
  servo_x.writeMicroseconds(servo_center);
  servo_y.writeMicroseconds(servo_center);
}

void loop() {

}
