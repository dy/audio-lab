[Audio-lab](http://dfcreative.github.io/audio-lab) is loosely based on web-audio API, in a sense that it uses it deep beneath. That allows to abstract from the specific sound technology: whether it is AudioWorker, ServerHandler, Ajax source, AudioNode, ScriptNode, node-webaudio etc.

Every sound node has a wrapper, or controller, called _Block_. Each block has a DOM-representation (optionally offable), audio node and simple API. As far any object in lab is Block, context destination is also a block.

Each block can be connected to any other block via _Connection_.


## Use cases

* Save a melodic motive, in abstract form (dependless of specific sound). To share it later or to use in a track.
* Export/import midi-files
* Save/load projects, ideally as a github repo. Because each project may consist of multiple lab files, like grooves, synth preset etc.
* Import/export web-audio setup

## Principles

* Keep blocks atomic, in that separate midi/piano blocks are better than single compound one. Ideally, scheme of generated sound should be clear from the [satellite view].
* No modes of blocks (consequence of previous principle).
* No time concept. Everything sounds just as project loads. There is no trigger in real synthesis.
* Factually any block can be based off a script processor block, putting calculations to any stream/async mode