In order to efficiently achieve the goal of the project, it should meet principles restricting undesired behaviour, and at the same time cover basic use-cases.


## Use cases

* Save a melodic motive playing in the head
	* as fast and real as possible
	* dive into creative environment to empower and develop the idea, as reason does, as if I am in luxurious studio/elegant classical environment
		* do not force instrumentary, as reason does
	* with abstract presentation behind - to tune & precise the sound later
* Share the link to a musical piece
	* Or musical experiment. To share musical ideas instead of soundcloud/vk/etc, just easily let musicians show what they have. E.g. that spiral frequency movement to share w/tanya.
* Create versions of a block setting, of a track
* Render the sound to wav/mp3
	* highest quality
	* faster than realtime
* Analyse/visualise sound
* Experiment with audio
* Record audiochunk


## Wishes

* Every music project is a github project, and a link is a gh-pages branch.
* `cat source.wav | lab -s 0:120 index.js | audio-compressor | audio-mastering preset.js > result.wav`
	* easily create broadcast
	* render to a file
* `npm start` → `lab | sax` to fastly preview file by default
* Pipe blocks via CLI
* Have blocks as a separate packages, dependless of audio-lab, working with PCM
* Broadcast project to internet-radio
* Export/import midi-files
* Import/export web-audio code setup
* Humanize MIDI-file
* Collaborative simultanious work on a project, as if two or more DJs work together
* Record musicians live
* Tune voice
* Generate labfile as an output.



## Principles

* [u]sers over [a]uthors over [i]mplementors over [s]pecifiers over [t]heoretical purity. Everything else derives from that.
* [u] Touch-oriented interface. iPhones and iPads are important, for fast-sketch or read/comment ideas, mb even more than desktop.
* [u] Increased interface density. Fx-es, gain and stats should be available on blocks and on connections; creating/replacing actions should be one-action, like drop a new block on connection.
* [a] Project should be able to be rendered via CLI, as browserify does.
* [i] Blocks are streams.
* [i] Blocks are separate atomic packages.
* [i] Audio-lab is just a GUI-wrapper on underlying scheme of sound-generation.
* [s] PCM format is used to convey the audio data. Needed for compatability.
	* ndarray?
	* buffer?
	* audiobuffer?
	* specific PCM compatible w/other libs like mp3, ogg etc?
* [t] No time concept: only sequence of bytes. System is a phenomenon, time is measure.
* [t] Every music composition is a program project, with it’s production, development stages, buildfile.
* [t] Lab manages blocks, blocks manage connections. Though connections and blocks are self-sufficient units. Blocks and connections know nothing about lab (as people about god).