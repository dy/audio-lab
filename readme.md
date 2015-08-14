[Audio-lab](http://dfcreative.github.io/audio-lab) is a sound design & music ideas sharing application.


## Use cases

* Save a melodic motive, in abstract form (dependless of specific sound). To share it later or to use in a track.
* Export/import midi-files
* Save/load projects, ideally as a github repo. Because each project may consist of multiple lab files, like grooves, synth preset etc.
* Import/export web-audio code setup
* Share musical pieces easily


## Principles

* Each block is a stream.
* As far blocks might be rendered in background, server-side etc, they might have no representation. Block === model, it has view+controller (js). It may not have them.

* Keep blocks atomic, in that separate midi/piano blocks are better than single compound one. Ideally, scheme of generated sound should be clear from the bird’s eye view.
* No modes of blocks (consequence of previous principle).
* No time concept. Everything sounds just as project loads. There is no trigger in reality. Time/trigger are a separate blocks.
* ~~Any block can be based off a script processor/audioworker block, putting calculations to any stream/async mode.~~
* ~~Any block can be "rendered" to audio-buffer block to enhance performance.~~
	* Actually implementation of blocks should be hidden not to bind to a specific API, e. g. it is impossible to make mixer node in web-audio API.
* Increased interface density. Fx-es, gain and stats should be available on blocks and on connections.
* Touch-oriented interface.
* Lab manages blocks, blocks manages connections. Though connections and blocks are self-sufficient units. Blocks and connections know nothing about lab (as people about god).
* Blocks are streams ticked by input events. Event gets a chunk of audio data to process.
* As far debugging is very difficult, separate values should be able to be caught and plotted.


## Docs

### Init lab

```js
var Lab = require('audio-lab');

var lab = new Lab({
	element: document.querySelector('.lab-container'),
	context: audioContext,
	channels: 2,
	autosave: false
});
```

### Create block plugin

```js
var Lab = require('audio-lab');

class Piano extends Lab.Block {
	constructor (options) {
		super(options);

		//init here

		this.state = 'ready';
	}
}

//name to use as a node name
Piano.displayName = 'Piano';

Piano.prototype.numberOfInputs = 0;
Piano.prototype.numberOfOutputs = 1;
```

### Use plugin

```js
var Lab = require('audio-lab');
var Piano = require('audio-lab-piano');

var lab = new Lab();
lab.use(Piano);
```


## Similar attempts

* [dataglow-webaudio](https://github.com/forresto/dataflow-webaudio)
* [webaudio-playground](https://github.com/cwilso/WebAudio)