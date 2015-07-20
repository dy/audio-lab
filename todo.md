* MVP - cover basic use-cases
	* Plugin infrastructure
	* Sharing by url
		* → github gist API
	* Script processor block
	* Piano block

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
* Loose couple blocks and lab
	* As far lab defines specifics of how blocks should behave,
	* Make lab blocks creation methods
	* Make lab manage dragging
	* Make lab manage appending/deleting nodes
	* Make lab manage active block
	* Make lab manage creation/deletion
	* Make lab manage saving/instance tracking
	* Create blocks over options the same way as over `fromJSON`
	* Avoid `lab` reference within blocks - ideally, they should be a separate unit with no lab environment.


# Compress UI

* Make graphs on connections
* Make connected connections replaceable instantly
* Make volume regulators on connections
* Show simple eqs on connections
* Show mute on connections
* Infinite number of inputs instead of mixer
* FXes as feature of connection


## Blocks

### Input

* Sequencer
* Midi

### Source

* mp3 file - as PDJ player or vynil
	* Upload/url
* Sampler box with beatbox interface
* Radio station with tuner interface
* Microphone/video interface
* Noise generator
	* Kinds of noise
* Oscillator
	* Shape of wave
* WebRTC stream

## Transformers

* [ ] Script block
* [ ] Filter (parametric)
* [ ] Equaliser
* [ ] Compressor (special graph)
* Harmonizer

## Effects

* Delay
* Reverb
* ... from pioneer

## Analysers

* [ ] Waveform
* [ ] Frequency
* [ ] Spectrogram
* [ ] Wavelet spectrogram
* [ ] [Various transforms](https://en.wikipedia.org/wiki/Wigner_distribution_function)

## Other

* Nested audio-lab subproject
* Worker
* Server
* Factorizer
* Side-chain compressor