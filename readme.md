# Audio-lab

[Audio-lab](http://dfcreative.github.io/audio-lab) is a tool to set down, share, work out and test musical and sound ideas.

Audio-lab is a GUI wrapper for underlying mechanism of connected sound nodes, representing a sound graph. In that, sound graph can be viewed and rendered as a plain code, regardless of audio-lab.

Each node in sound graph is represented by a stream instance, able to handle PCM. So basically it is enought to create a Readable or Transform stream and register it in audio-lab.

There are two main types of nodes can be created: real-time and async. Real-time nodes are bound to the current time, it is such nodes as output, synth, midi etc. Async nodes can render data ahead or be stopped at all. It is such nodes as generator, timer etc. Basically these nodes are fully independent of user control.


## Plugins

### Input

* [x] generator
* [ ] Sequencer
* [ ] Midi
* [ ] piano

### Source

* [ ] mp3 file - as PDJ player or vynil
* Upload/url
* [ ] Sampler box with beatbox interface
* [ ] Radio station with tuner interface
* [ ] Microphone/video interface
* [ ] Noise generator
* [ ] Kinds of noise
* [ ] Oscillator
* [ ] Shape of wave
* [ ] WebRTC stream
* [ ] microphone
* [ ] youtube

### Synthesis

* [ ] sample-based
* [ ] additive
* [ ] subtractive
* [ ] fm
* [ ] phase distortion
* [ ] modulation
* [ ] [granular](https://en.wikipedia.org/wiki/Granular_synthesis)
* [ ] physical modelling
* [ ] sample-based
* [ ] resynthesis, [LPC](https://en.wikipedia.org/wiki/Linear_predictive_coding)
* [ ] [essynth](https://en.wikipedia.org/wiki/Essynth)

### Output

* [ ] speaker
* [ ] recorder

## Transformers

* [ ] Script block
* [ ] Filter (parametric)
* [ ] Equaliser
* [ ] Compressor (special graph)
* [ ] Harmonizer

## Effects

* [ ] Delay
* [ ] Reverb
* ... from pioneer

## Analysers

* [ ] Waveform
* [ ] Frequency
* [ ] Spectrogram
* [ ] Wavelet spectrogram
* [ ] [Various transforms](https://en.wikipedia.org/wiki/Wigner_distribution_function)

## Other

* [ ] Worker
* [ ] Server
* [ ] Factorizer
* [ ] Side-chain compressor
* [ ] processor
* [x] mixer
* [x] gain
* [ ] nested-lab



## Creating plugin

```js
import {Transform} from 'stream';

MyPlugin extends Transform {
	_transform: function (data, encoding, callback) {
		this.process(data, function (data) {
			this.push(data);
			callback();
		});
	},

	//custom processing function
	process: function (data) {

	}
}

export default MyPlugin;
```

```js
import Lab from 'audio-lab';
import MyPlugin from 'my-plugin';

var lab = new Lab();
lab.use(MyPlugin);
```

It will create basic plugin representation in audio-lab.
You can set additional options to define custom presentation of plugin on the graph.

```js
//Label to use as a default
MyPlugin.title = 'MyPlugin';

//Thumbnail of a node
MyPlugin.thumbnail = '';


//Number of inputs/outputs, redefinable via options
MyPlugin.prototype.numberOfInputs = 1;
MyPlugin.prototype.numberOfOutputs = 0;


//Create interface for the audio-lab
//This function will not be called from within node environment
MyPlugin.prototype.createElement = function () {
	var element = document.createElement('div');
	return element;
};

//Serialize as JSON
MyPlugin.prototype.toJSON = function () {

};

//Serialize as Code
MyPlugin.prototype.toCode = function () {

};
```

## Why streams, not web-audio

The first thought was to build the whole project on web-audio nodes and fill lacking nodes via custom `scriptProcessorNode`s or `audioWorkerNode`s. There is a polyfill for [audio-worker](https://www.npmjs.com/package/audio-worker-shim) and [web-audio-api](https://www.npmjs.com/package/web-audio-api) for node. But that would cause ratifications:

* The significant part of node audio packages is already built on streams, such as [livejs](https://github.com/livejs), [pcm packages](https://www.npmjs.com/search?q=pcm) etc. Using web-audio would mean to significantly complicate integration of them.
* Setting up streams in node costs nothing, whereas setting up web-audio may cause unresolvable issues. In that, any audio code on streams can be rendered in node, independent of browser, if to keep to some precautions regarding compatability of packages, such as web-workers.
* Streams can be used independent of node, via such tools as [sox](http://sox.sourceforge.net/). In that, it is possible to compose unix pipelines for audio from separate modules, in browserify-like way, which is completely impossible with web-audio.

All in all, in short term _web-audio-api_ wins, providing the variety of audio nodes and easiness of using them. But in long term it is a dead-end, as any extra-functionality or side plugin is very expensive and unbearable.


## Similar projects

* [dataglow-webaudio](https://github.com/forresto/dataflow-webaudio)
* [webaudio-playground](https://github.com/cwilso/WebAudio)
* [sound.io](https://github.com/soundio/soundio)