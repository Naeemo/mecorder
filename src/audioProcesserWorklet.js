class WhiteNoiseProcessor extends AudioWorkletProcessor {
  constructor(props) {
    super(props)
    this.stop = false
    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this.stop = true
      }
    }
  }

  process(inputs, outputs, parameters) {
    if (this.stop) {
      return true
    }

    const pcmBuffers = []

    inputs.forEach((channels) => {
      const totalLength = channels.reduce((acc, cur) => acc + cur.length, 0)
      const firstChannel = channels[0]

      if (!firstChannel) {
        return
      }

      const interleaved = new Float32Array(totalLength)
      for (
        let src = 0, dst = 0;
        src < firstChannel.length;
        src++, dst += channels.length
      ) {
        for (let i = 0; i < channels.length; i++) {
          interleaved[dst + i] = channels[src]
        }
      }

      pcmBuffers.push(interleaved.buffer)
    })

    this.port.postMessage(pcmBuffers, pcmBuffers)

    return true
  }
}

registerProcessor('processor', WhiteNoiseProcessor)
