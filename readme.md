[Audio-lab](http://dfcreative.github.io/audio-lab) is a tool to set down, share, work out and test musical and sound ideas.


## Create plugin

Audio-lab is just a GUI constructor for underlying mechanism of connected sound nodes, representing a sound graph. Sound graph can be rendered regardless of audio-lab.

Each node in sound graph is represented by a stream instance, able to handle PCM. So basically it is enought to create a Readable or Transform stream and register it in audio-lab.

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


## Similar projects

* [dataglow-webaudio](https://github.com/forresto/dataflow-webaudio)
* [webaudio-playground](https://github.com/cwilso/WebAudio)
* [sound.io](https://github.com/soundio/soundio)