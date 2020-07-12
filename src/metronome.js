import MetronomeNode from './metronome-node.js'

document.head.appendChild(document.createElement('style')).innerHTML = `
  a-metronome {
    min-width: 300px;
    min-height: 200px;
    display: inline-flex;
    flex-direction: row;
    border-radius: 8px;
    padding: 8px;
    background: #fafafb;
    box-sizing: border-box;
    box-shadow: 0 3px 12px -2px rgba(120,120,120,.5);
  }
`

export default class MetronomeElement extends HTMLElement {
  constructor(options){
    super()
    Object.assign(this, options)
    this.shadow = this.attachShadow({mode: 'open'})
    this.shadow.innerHTML = `<form onclick="return false">
      <div>
        <input name="tempo" type="number" value="${this.tempo}">
        <button name="start">Start</button>
      </div>
      <div>
        <label>Acclerate</label>
        <input title="Acclerate" name="accleration" type="range" min=0 max=100 value=10>
      </div>
    </form>
    <style>
      form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-family: sans-serif;
      }
      form > div {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
    </style>
    `
    this.elements = this.shadow.children[0].elements
    this.elements.start.onclick = () => {
      if (this.metronome.playing) this.stop()
      else this.start()
    }

    // bind events
    this.elements.tempo.onchange =
    this.elements.tempo.oninput = e => {
      this.tempo = +e.target.value
    }
    this.elements.accleration.onchange =
    this.elements.accleration.oninput = e => {
      this.accleration = +e.target.value
    }

    // actual audio node
    this.metronome = new MetronomeNode({tempo: this.tempo})
  }

  start() {
    console.log('start')
    this.elements.start.textContent = 'Stop'
    this.metronome.start()
    this.dispatchEvent(new Event('start'))

    this._acclerateId = setInterval(() => {
      this.tempo = this.metronome.tempo + 10
    }, 2800)
  }
  stop() {
    console.log('stop')
    this.elements.start.textContent = 'Start'
    this.metronome.stop()
    this.dispatchEvent(new Event('stop'))

    clearInterval(this._acclerateId)
  }

  get tempo() { return +this.getAttribute('tempo') || 120 }
  set tempo(value=120) {
    this.setAttribute('tempo', value)
    this.metronome.tempo =
    this.elements.tempo.value = value
  }
  get accleration() { return +this.getAttribute('accleration') || 10 }
  set accleration(value=10) {
    this.setAttribute('accleration', value)
  }
}

customElements.define('a-metronome', MetronomeElement)

// // metronome audio node
// export class MetronomeNode extends AudioNode {

// }

// // thumbnail metronome renderer
// class MetronomeThumbnail extends HTMLElement {

// }

