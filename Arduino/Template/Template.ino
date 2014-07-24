//// Generated 7-23-14
//////////////////
//Laura Devendorf
//Being the Mahcine
//Arduino Uno Code for Guided 3D Printing
////////////////
#include <Servo.h>
#include <avr/pgmspace.h>

///**BEGIN INSERTED VALUES///// 
int inst_num = 1559;
PROGMEM prog_uchar xs[] = {39,72,79,85,94,103,108,117,122,126,130,132,132,131,128,125,121,116,109,102,97,91,87,82,77,73,70,68,69,71,85,115,85,63,63,63,65,68,72,78,84,90,95,101,107,113,118,125,130,134,137,139,140,139,137,133,127,123,118,112,102,94,87,82,77,73,69,66,64,72,72,73,76,81,88,93,99,105,111,116,122,128,131,130,128,125,119,114,109,103,95,89,84,78,73,72,61,60,60,63,68,73,78,85,90,98,106,111,120,125,132,137,140,143,144,142,140,137,133,126,120,115,109,103,96,91,84,77,69,65,61,118,127,123,136,131,139,133,127,120,115,105,98,92,85,78,71,66,62,59,55,55,55,56,58,61,67,73,77,82,88,97,104,112,118,123,130,135,139,143,147,148,147,144,139,131,127,119,114,107,98,92,81,76,72,68,65,64,65,67,71,79,84,89,101,111,117,122,127,134,137,139,135,132,127,130,124,126,133,139,145,148,151,152,152,151,148,146,141,137,131,126,120,115,105,97,90,85,80,74,69,63,57,54,51,50,50,52,54,59,66,70,78,83,89,95,101,107,114,119,125,123,128,135,139,142,143,141,138,133,130,124,117,106,97,92,86,78,71,67,61,59,59,61,66,72,76,81,87,92,98,103,109,114,122,136,131,125,138,133,128,124,119,113,105,100,94,88,83,77,72,66,60,56,52,49,47,46,45,46,48,50,54,58,62,71,80,85,89,94,99,105,111,116,122,127,135,142,148,151,154,156,156,154,152,148,144,139,133,128,123,119,114,107,100,94,87,82,75,68,61,58,56,55,56,59,63,68,75,82,88,95,103,108,114,120,126,133,138,143,145,147,145,143,139,134,127,123,118,113,108,100,94,89,83,77,73,66,65,65,69,74,80,84,94,102,109,116,121,126,131,136,137,134,130,128,121,126,115,119,126,132,138,147,152,155,158,160,159,158,157,154,151,149,147,142,138,132,125,119,112,106,101,92,86,82,76,68,62,53,47,44,43,42,42,43,45,48,53,56,61,66,72,77,83,89,97,105,114,120,125,131,137,143,147,149,150,148,145,142,140,137,133,128,123,119,114,108,103,96,91,87,80,72,64,58,53,52,52,53,55,59,64,69,75,83,91,97,102,110,114,119,125,131,141,139,136,134,133,131,127,123,117,110,104,99,94,89,84,75,70,62,62,62,66,72,77,81,90,97,102,115,119,124,128,71,71,84,88,92,98,103,108,111,117,121,126,131,137,144,152,156,160,162,163,162,161,159,156,154,151,148,145,141,132,127,123,118,110,102,95,90,85,81,74,69,64,58,53,45,41,38,38,37,38,41,45,50,57,66,73,77,83,78,82,87,92,98,107,112,117,120,124,128,133,138,143,149,152,153,152,150,146,145,142,140,137,127,121,112,103,98,90,87,82,76,70,64,59,53,48,48,47,47,50,57,63,70,77,72,77,83,90,98,104,110,120,123,126,129,133,140,143,141,137,135,133,130,121,117,110,105,98,93,88,80,73,67,62,57,57,56,61,71,68,64,68,72,77,89,104,123,132,132,113,114,116,119,123,132,137,144,150,155,160,164,166,166,165,163,160,157,155,153,152,150,147,144,134,128,123,118,112,105,98,90,85,80,75,68,61,56,53,48,41,37,34,33,34,34,35,39,45,52,59,64,68,73,77,81,85,89,94,99,104,109,112,122,123,124,125,128,132,139,144,151,155,156,155,152,149,147,145,143,142,139,136,128,120,114,106,98,89,85,80,72,65,59,53,46,43,44,44,45,48,54,61,66,71,79,84,89,94,99,104,109,116,121,131,135,140,149,144,132,132,137,133,132,128,123,117,112,102,83,83,100,105,112,118,124,131,79,54,53,67,75,80,86,92,101,107,112,116,117,120,121,123,125,130,136,141,148,153,159,164,167,168,168,166,162,157,153,152,151,150,149,146,143,137,130,125,119,114,108,99,91,85,81,77,71,65,60,54,50,44,38,33,30,31,32,34,38,44,50,57,66,60,68,73,80,86,93,101,108,115,120,125,127,128,130,131,133,137,143,148,153,158,158,156,152,148,144,143,141,140,139,137,134,130,123,118,111,104,91,86,80,72,65,59,56,51,47,39,41,42,46,53,59,57,59,68,89,103,126,135,140,141,128,129,130,133,138,146,153,160,166,169,171,169,167,163,158,152,147,147,147,147,146,145,143,141,137,133,128,122,114,108,102,93,86,80,76,72,68,62,53,47,45,42,38,33,32,32,31,33,38,46,51,57,61,64,68,73,80,85,93,99,105,114,121,124,126,127,128,139,141,150,162,160,154,147,136,139,138,137,136,134,132,128,122,116,108,102,92,86,83,79,73,66,61,56,54,52,48,42,42,41,51,55,59,66,73,81,90,97,104,110,116,121,136,116,91,62,62,136,136,136,137,142,147,152,158,163,167,169,169,167,160,153,147,138,132,137,142,144,144,142,139,136,131,125,113,103,97,88,82,76,73,71,67,62,56,51,48,47,46,45,43,38,34,31,31,32,36,46,48,50,52,54,57,60,64,69,77,83,89,96,104,115,123,131,128,134,134,132,129,124,116,110,103,97,89,82,78,66,82,88,94,102,108,114,126,126,114,108,97,87,58,55,42,158,160,167,167,159,154,148,142,140,142,147,152,158,163,166,52,50,48,41,32,32,33,37,42,47,52,57,63,70,77,82,89,94,99,107,118,124,130,135,141,144,144,141,137,131,123,116,109,102,96,87,81,75,73,70,66,60,55,49,47,48,56,76,90,106,92,84,82,76,58,108,119,108,121,133,121,151,152,150,144,142,144,149,156,162,165,166,160,152,56,53,49,31,36,39,43,53,56,55,61,70,74,79,84,90,96,105,114,120,129,137,142,144,142,138,131,124,118,109,102,97,93,87,80,75,71,71,71,68,63,57,49,45,44,47,53,52,52,58,67,82,82,86,133,154,156,62,59,54,46,46,48,54,67,63,144,148,155,161,166,168,165,159,151,146,143,132,138,143,146,143,139,131,127,125,130,64,57,50,42,42,45,51,57,60,63,74,80,86,92,93,92,88,82,75,69,69,74,80,80,147,147,147,150,157,164,168,165,160,149,140,148,147,144,141,135,129,127,128,138,58,54,47,42,41,45,54,58,73,81,86,90,88,83,75,68,66,71,71,151,151,151,157,162,167,165,161,152,144,150,150,148,142,134,130,129,142,55,52,46,40,38,40,54,56,56,74,80,85,87,85,80,72,62,66,72,72,153,156,159,169,168,162,154,145,151,150,145,138,131,130,136,143,54,49,42,38,39,44,51,55,55,71,78,83,84,81,75,68,62,64,68,69,52,45,40,40,44,55,55,55,53,132,139,146,152,152,148,140,135,133,82,81,77,71,65,61,64,69,81,81,51,41,41,43,51,56,53,138,144,151,152,148,141,137,81,81,77,69,61,63,74,78,48,43,44,44,56,57,49,128,154,152,129,129,79,79,77,69,65,72,77,79,78,76,63,64,67,75,77,78,78,71,62,65,68,77,77,77};
PROGMEM prog_uchar ys[] = {39,59,54,52,52,54,55,58,60,62,64,70,75,80,86,90,92,94,95,95,94,94,92,91,87,84,79,73,67,61,73,75,72,77,72,65,60,56,52,48,47,47,48,49,50,52,53,55,57,59,63,68,75,80,85,92,97,99,100,102,101,99,98,96,94,91,89,84,78,76,69,64,60,56,56,56,58,59,60,62,64,66,73,79,83,88,91,92,93,92,91,89,87,84,78,77,79,74,67,60,53,48,45,44,44,47,50,51,52,53,55,59,63,69,75,84,89,93,97,101,104,106,105,104,103,102,100,98,93,89,80,98,64,60,69,90,97,102,106,110,111,109,108,107,105,103,100,96,93,89,81,76,71,66,61,57,51,46,43,41,41,44,47,49,49,50,52,53,56,60,68,74,80,89,96,92,96,100,102,100,99,97,94,92,89,86,81,76,70,64,60,54,50,51,56,58,58,59,60,63,67,74,85,91,86,73,66,48,49,52,55,60,65,71,76,81,87,92,101,105,110,113,115,116,115,114,113,111,109,107,105,101,95,91,87,80,75,67,62,55,49,46,43,41,42,44,46,47,48,48,48,57,57,60,63,68,74,81,88,96,100,103,107,105,104,104,102,99,95,92,86,78,73,68,61,56,53,51,51,53,55,56,57,57,57,71,72,95,112,115,118,121,122,122,121,120,120,119,116,114,112,109,105,102,99,94,88,83,78,72,67,62,58,54,51,47,44,44,47,49,51,51,51,49,48,47,47,50,53,57,63,70,77,82,88,97,106,111,104,107,110,113,112,111,111,111,108,106,103,99,94,90,84,77,71,67,63,59,55,53,57,59,60,60,60,58,56,56,59,61,66,72,79,84,93,103,96,99,102,103,102,101,101,98,96,94,91,86,81,75,69,66,63,66,69,70,70,69,68,66,66,68,73,80,90,95,92,73,53,50,47,47,47,51,54,58,63,69,74,80,85,91,99,106,111,116,119,122,127,129,128,127,126,127,126,123,119,116,113,107,103,99,93,87,82,75,70,66,61,57,54,52,50,50,54,59,61,60,54,61,58,56,57,60,63,68,73,81,88,96,102,107,111,114,117,120,119,118,117,117,118,115,111,107,103,99,95,90,84,78,72,68,64,61,59,67,71,71,71,68,65,62,69,66,70,77,84,89,95,100,103,106,110,108,107,107,108,105,102,99,95,90,85,80,75,70,74,77,81,80,81,77,73,70,87,84,84,69,72,75,76,75,67,62,56,52,50,48,47,49,52,55,60,65,70,75,81,87,95,101,109,116,120,124,130,133,137,137,135,134,134,134,133,129,125,123,121,117,114,109,106,99,91,84,77,71,67,64,60,58,59,62,68,77,81,85,85,86,84,80,72,67,62,59,58,57,59,62,66,71,76,83,92,98,106,111,115,122,126,126,124,124,125,121,118,115,113,109,105,102,99,94,88,83,76,71,68,69,76,84,89,94,95,95,95,93,87,81,76,71,68,68,75,80,88,96,102,107,114,117,115,115,114,114,110,106,103,99,96,93,87,82,80,83,90,86,90,94,97,103,105,101,83,83,80,72,66,59,54,50,49,49,51,54,57,62,67,72,77,83,89,95,101,108,113,118,123,129,136,141,144,144,143,142,141,141,140,136,132,128,126,123,119,116,113,110,105,100,92,86,81,75,71,68,68,69,72,76,80,84,87,90,91,91,90,88,81,84,79,74,68,64,61,59,59,62,66,71,77,82,88,94,100,105,110,118,122,128,134,133,132,131,131,127,123,119,117,112,107,104,99,94,89,84,80,78,79,83,88,95,99,100,101,101,100,99,94,85,87,70,69,68,77,87,89,91,105,110,116,120,124,123,121,121,112,111,110,109,106,101,90,105,97,97,84,91,97,101,104,105,105,103,99,94,84,74,64,59,55,52,51,51,53,56,58,63,69,75,81,87,94,99,104,112,117,124,131,136,142,148,151,151,150,149,149,149,148,144,140,136,133,132,129,125,118,114,110,103,96,89,83,78,75,74,76,83,91,99,104,110,112,114,115,115,113,110,103,97,92,86,76,67,63,61,62,64,66,72,78,83,89,94,99,106,116,121,126,131,135,141,140,139,139,139,135,129,125,122,121,116,111,107,103,98,90,85,86,90,102,104,113,124,128,125,99,83,83,81,75,69,63,58,55,55,57,59,64,70,77,82,86,90,94,101,108,115,122,129,135,141,146,152,156,158,157,155,154,154,155,155,154,149,143,139,136,132,127,120,114,108,105,99,93,86,80,74,70,75,80,85,90,96,102,108,110,112,114,114,114,110,103,96,90,83,77,69,65,68,73,80,85,93,79,109,121,127,135,140,147,146,145,144,144,144,145,140,135,130,126,124,122,115,110,105,99,93,81,89,95,101,110,115,119,122,124,125,125,124,122,110,134,134,117,117,91,84,78,72,66,61,58,57,59,63,68,74,79,85,88,89,91,122,124,128,134,140,149,155,160,162,161,157,156,157,159,160,158,150,145,140,137,133,131,125,118,112,106,99,92,88,83,77,71,67,60,65,71,78,83,88,93,98,104,111,114,118,121,121,122,122,122,132,133,139,145,152,150,147,146,146,146,148,144,137,124,126,129,131,132,131,132,132,142,139,139,139,137,119,103,80,73,73,71,77,82,84,84,82,76,68,62,60,60,64,70,61,68,73,76,79,70,64,58,55,52,60,104,105,111,116,120,124,126,128,127,127,127,129,131,135,141,148,155,160,162,160,156,155,156,158,162,162,158,153,145,138,133,131,126,120,111,105,130,136,142,148,151,146,131,120,135,135,135,147,143,147,74,73,82,79,73,64,61,61,63,68,77,81,83,52,57,61,69,57,51,47,39,50,109,111,118,122,126,129,132,134,135,134,134,135,138,143,151,157,161,162,158,153,150,152,156,160,164,164,161,155,148,142,136,132,131,129,125,117,112,109,118,118,123,125,140,140,153,151,71,71,38,43,47,48,40,34,30,22,36,68,61,60,61,65,72,78,82,82,79,69,143,144,147,153,160,165,164,160,153,143,126,128,128,125,117,112,108,110,115,124,145,144,145,147,154,161,165,167,166,162,156,146,156,158,80,74,67,61,61,64,68,76,81,81,147,151,158,163,168,168,163,156,149,147,121,126,125,122,114,108,105,119,151,150,153,160,167,171,171,168,161,152,153,81,74,67,60,63,67,75,81,81,151,152,158,164,169,168,163,154,151,118,124,125,122,116,110,102,111,117,153,153,159,165,171,175,175,170,163,155,155,88,71,53,54,73,91,89,154,159,166,170,171,163,156,154,154,116,121,119,112,106,101,98,104,114,157,157,162,169,175,178,179,174,168,161,160,113,110,106,99,93,91,98,105,112,158,155,155,159,165,171,173,169,159,168,174,180,183,181,174,167,163,164,168,101,99,92,86,82,88,100,158,156,157,164,170,170,160,165,172,181,180,176,170,164,166,101,85,76,66,76,84,100,159,155,169,169,161,164,171,181,179,174,163,165,166,174,180,179,171,163,163,166,168,176,178,175,167,161,163,168,169};
PROGMEM prog_uchar ls[] = {0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0};
///**END INSERTED VALUES/////


//ENVIRONMENT VARS
int lastms_x = 100;
int lastms_y = 100;
int last_laser = false;
int i_num = 0;
boolean playing = false;
boolean playing_bounds = false;
int rate = 50;
boolean flags[4];
boolean interrupt = false;


//INPUT
const int bounding = 1;
const int next = 0;
const int play = 2;
const int prev = 5;
int buttonState = 0; 
int highCount[4];
int threshold[4];

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

  pinMode(next, INPUT);
  pinMode(prev, INPUT);
  pinMode(play, INPUT);
  pinMode(bounding, INPUT);

  for(int i = 0; i < 4; i++){
    threshold[i] = 800;
  }

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

void checkButtons(){
  int states[4];
  int trigger_press = 60;
  int reset = 200;
  int setValue = false;
  int threshold = 660;
  states[0] = analogRead(next);
  states[1] = analogRead(prev);
  states[2] = analogRead(play);
  states[3] = analogRead(bounding);
  
  //get the highest of the four
  int highest_ndx = 0;
  int highest_value = states[0];
  for(int i = 1; i < 4; i++){
    if(states[i] > highest_value){
      highest_ndx = i;
      highest_value = states[i];
    } 
  }
  
  for(int i = 0; i < 4; i++){
    if(i == highest_ndx && states[i] > threshold){
      highCount[i]++;
      if(highCount[i] == trigger_press){
        
        flags[i] = true;
        interrupt = true;
      }else if(highCount[i] == reset){
        highCount[i] = 0;
      }
    }else{
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
     }else if(instruction == -2){
       //bounding = true;
       //interrupt = true;
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
      flags[0] = false;
      Serial.println("n");
      playing = false;
      playing_bounds = false;
      advanceIndex();
      dist = moveTo(true);



    }else if(flags[1]){
      flags[1] = false;

      Serial.println("v");
      playing = false;
      playing_bounds = false;
      retractIndex();
      dist = moveTo(false);

    }else if(flags[2]){
      flags[2] = false;

      Serial.println("p");
      playing = !playing;
      playing_bounds = false;
    }else if(flags[3]){
     flags[3] = false;

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








