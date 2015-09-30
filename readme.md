[Audio-lab](http://dfcreative.github.io/audio-lab) is a tool to set down, share, work out and test musical and sound ideas.

Audio-lab is a GUI wrapper for underlying mechanism of connected sound nodes, representing a sound graph. In that, sound graph can be viewed and rendered as a plain code, regardless of audio-lab.

Each node in sound graph is represented by a stream instance, able to handle PCM. So basically it is enought to create a Readable or Transform stream and register it in audio-lab.

There are two main types of nodes can be created: real-time and async. Real-time nodes are bound to the current time, it is such nodes as output, synth, midi etc.


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

//Controlling panel
MyPlugin.prototype.createElement = function () {

};

//Serialize as JSON
MyPlugin.prototype.toJSON = function () {

};

//Serialize as Code
MyPlugin.prototype.toCode = function () {

};
```

## Why streams, not web-audio

The first thought was is to build the whole project on web-audio nodes and fill lacking nodes via custom `scriptProcessorNode`s or `audioWorkerNode`s. Thereis polyfill for [audio-worker](https://www.npmjs.com/package/audio-worker-shim) and [web-audio-api](https://www.npmjs.com/package/web-audio-api) for node. But this causes ratifications.

* The significant part of node audio packages is already built on streams, such as [livejs](https://github.com/livejs), [pcm packages](https://www.npmjs.com/search?q=pcm) etc. Using web-audio would mean to significantly complicate integration of them.
* Setting up streams in node costs nothing, whereas setting up web-audio may cause unresolvable issues. In that, an audio code can be rendered independent of browser, if to keep to some precautions, particularly regarding async code such as web-workers.
* Streams can be used independent of node, via such tools as [sox](http://sox.sourceforge.net/). In that, it is possible to compose unix pipelines for audio from separate modules, in browserify-like way, which is completely impossible with web-audio.

In that, in short term web-audio-api wins, providing the variety of audio nodes and easiness of using them. But in long term it is dead-end, as any extra-functionality or side plugin is very expensive and unbearable.


## Similar projects

* [dataglow-webaudio](https://github.com/forresto/dataflow-webaudio)
* [webaudio-playground](https://github.com/cwilso/WebAudio)
* [sound.io](https://github.com/soundio/soundio)