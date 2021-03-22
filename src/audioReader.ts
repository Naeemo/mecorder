import processorWorklet from './audioProcesserWorklet?raw'

export class AudioReader {
  private static workletBlob = new Blob([processorWorklet], {
    type: 'text/javascript',
  })
  private static workletUrl = URL.createObjectURL(AudioReader.workletBlob)

  private state: 'inactive' | 'processing' = 'inactive'
  private streamSources: MediaStream[] = []
  private pcmCache: Uint8Array[] = []
  private audioContext: AudioContext | null = null
  private worker: AudioWorkletNode

  public addSource(source: MediaStream): void {
    if (this.streamSources.every((s) => s !== source)) {
      this.streamSources.push(source)

      if (this.state === 'processing') {
        this.updateSource(source)
      }
    }
  }

  public async start(): Promise<void> {
    const audioTracks = this.streamSources
      .map((source) => source.getAudioTracks())
      .flat()
    const stream = new MediaStream(audioTracks)
    this.audioContext = new AudioContext()

    // init worklet
    await this.audioContext.audioWorklet.addModule(AudioReader.workletUrl)
    this.worker = new AudioWorkletNode(this.audioContext, 'processor')
    this.worker.port.onmessage = (event: MessageEvent<ArrayBuffer[]>) => {
      const pcmBuffers = event.data
      this.pcmCache = pcmBuffers.map((pcmBuf, index) => {
        const oldCache = this.pcmCache[index] || new Uint8Array(0)
        const bytes = new Uint8Array(pcmBuf)
        const newCache = new Uint8Array(oldCache.length + bytes.length)
        newCache.set(oldCache)
        newCache.set(bytes, oldCache.length)
        return newCache
      })
    }

    // build a new stream
    const audioInput = this.audioContext.createMediaStreamSource(stream)
    // connect source with processor node
    audioInput.connect(this.worker)
  }

  public getPcms(): Uint8Array[] {
    const pcms = this.pcmCache
    this.pcmCache = []
    return pcms
  }

  public destroy(): void {
    this.worker.port.postMessage('stop')
    this.worker.disconnect()
    this.audioContext.close()
    this.streamSources = []
  }

  private updateSource(source: MediaStream): void {
    const audioTracks = source.getAudioTracks()
    const stream = new MediaStream(audioTracks)
    const audioInput = this.audioContext.createMediaStreamSource(stream)
    audioInput.connect(this.worker)
  }
}
