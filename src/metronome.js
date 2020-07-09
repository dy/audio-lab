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
      <input name="acclerate" type="range">
    </form>
    <style>
      form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    </style>
    `
    this.elements = this.shadow.children[0].elements
    this.elements.start.onclick = () => {
      if (this.metronome.playing) {
        this.elements.start.textContent = 'Start'
        this.metronome.stop()
      }
      else {
        this.elements.start.textContent = 'Stop'
        this.metronome.start()
      }
    }

    this.elements.tempo.oninput = e => {
      this.metronome.tempo = +e.target.value
      if (this.metronome.playing) this.metronome.stop(), this.metronome.start()
    }

    // actual audio node
    this.metronome = new MetronomeNode({tempo: this.tempo})
  }
  get tempo() { return +this.getAttribute('tempo') || 120 }
  set tempo(value=120){
    this.setAttribute('tempo', value)
    this.shadow.children.tempo = value
  }
}

customElements.define('a-metronome', MetronomeElement)

// // metronome audio node
// export class MetronomeNode extends AudioNode {

// }

// // thumbnail metronome renderer
// class MetronomeThumbnail extends HTMLElement {

// }
