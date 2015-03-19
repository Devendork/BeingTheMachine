****** BTM Internal Storage ***********


****** BTM SD Card ***********


****** BTM Bluetooth ***********
Parts:
1 x Arduino Uno
2 x HiTec HS-55 Servo Motors
1 x Sparkfun Laser Module
1 x Sparkfun BlueSMiRF Module - RN42
1 x Adafruit 4 Button Momentary RF Momentary Reciever
3 x LEDS

Bluetooth Command List:

	Sending to Android (TX)
		s: start playing
		e: end playing
		n: send next instruction
		p: send previous instruction
		i x: go to instruction number x
		l x: go to layer number x
		f: play forward (give next instruction)
		b: play backward (give prev instruciton)

	Sending to Arduino (RX)
		i xmin xmax ymin ymax: initializes by sending the bounding box positions of the model
		m x y l: move to x y position with laser on (1) or off (0)
		b: draw bounding box
		c: center servos
		p: signal path
		l x : signal layer x
		s: start playing
		e: end playing

Flow: 
On Arduino start, will repeatedly send the "i" command until Android hears the command and responds with information about the and bounding box positions. After that, controls from the RF buttons will trigger Arduino to request information from Android. 

When "play" is triggered from the key fob, it will change the arduino interface to play AND send the command for serving multiple instruction to 