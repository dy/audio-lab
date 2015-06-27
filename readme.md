[Audio-lab](http://dfcreative.github.io/audio-lab) is loosely based on web-audio API, in a sense that it uses it deep beneath. That allows to in some way abstract from the specific sound technology: whether it is AudioWorker, ServerHandler, Ajax source, AudioNode, ScriptNode, node-webaudio etc.
Every sound node has a wrapper, or controller, callad _Block_. Each block has a DOM-representation (optionally offable), audio node and simple API. As far any object in lab is Block, context destination is also a block.
Each block can be connected to any other block via _Connection_.


## Generators

* [ ] Source
	* Ajax
	* Upload
	* Microphone
	* Video
* [ ] Noise
* [ ] Oscillator

## Transformers

* [ ] Script block
* [ ] Filter (parametric)
* [ ] Equaliser
* [ ] Compressor (special graph)

## Analysers

* [ ] Waveform
* [ ] Frequency
* [ ] Spectrogram
* [ ] Wavelet spectrogram
* [ ] [Various transforms](https://en.wikipedia.org/wiki/Wigner_distribution_function)
