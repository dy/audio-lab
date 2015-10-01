* Add saving projects
* Add code export
* Test node rendering of a sound
* Use worker thread to calc data, use it’s events to provide streams. It’s too difficult for mixer to handle’em all, takes all the processor time
* Ensure format of PCM stream used
* Implement channels: from mono to 5.1
* Add online sharing

* Rhythm node
* Analyser node
* Normalize graphical view of graph
* Frequency representation of a sound
* Make output node show progress of a stream (soundwaves?)
* (youtube source stream node)[https://github.com/JamesKyburz/youtube-audio-stream]
* Stop by window unfocus


* Make iPhone start button main start button, ie implement start/stop API

* MVP - cover basic use-cases
	* Saving project
		* Short URL
			* github gist API?
			* Meteor own server?
			* jsfiddle code export?
		* Github account?
	* MIDI-in - record songs
		* Piano roll display
		* Piano roll player
		* Notes renderer
	* Import midi/vextab files
	* Script processor block
		* + Generator, basically, is script processor block: it gets time and sample
		* + Perfectize code editing
		* Separate functions blocks - share functional scope/fn banks
	* Piano block - write notes
	* Convenient popups - critical UX
		* + Resize
		* + Drag
		* Stick

* Shoulds
	* Make connections drop-in, so that if a new block is placed over a connection, than the connection gets sectioned in between and a new block takes it’s place.
	* The same way the deletion of blocks should work - instead of removing block along with connections, it is better to keep connection, especially in case of 1in 1out.
	* Processor block should get only input value.
	* Time generation should be moved out, in that input param forms a time value as well.
	* Processor blocks have to have multiple inputs.

* Plugins infrastructure
* All default web-audio nodes wrappers
	* Oscillator
	* Effects
	* Script processor
	* Functional source
* Audio-lab box node
* Poppyify dialogs

* Plugins architecture, as postcss does
* Default web-audio-node wrappers
* iPhone
* Automatically connect new block to prev one
* Rope analysers
* Hide analyser block
* Poppy
* Make app a block to reuse
* Replace dialog w/poppy
* Oscillators interface
* for source code generator - add list of substack’s studio codes
* Rotate inputs always so to be closer to mouse; rotate outputs vv.
* Drag back end of connection
* Drag connection = drag both ends
* Audio weighting block
* Make resizable blocks
* History (ctrl + z)
* Add node-version, with radio station blocks etc
* Add buffering to avoid glitches
* Audio fiddle
* Show current time
* Think up a better serialization system, ideally 2-3 symbols per block or alike.
* Write all favorite tracks synths
* Write all ideas sound/melodies
* Store projects as gists/github repos
* Sound bank functions repos
* Name functional blocks


# Compress UI

* Make graphs on connections
* Make connected connections replaceable instantly
* Make volume regulators on connections
* Show simple eqs on connections
* Show mute on connections
* Infinite number of inputs instead of mixer
* FXes as feature of connection


* Export as a code for substack’s studio, basically, fully programmed sound, dependless of specific nodes.


//TODO: Gain: add value as dB
//TODO: remove any kind of jitter on connection/disconnection
//TODO: test output on long delayed async generator