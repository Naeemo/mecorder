import processorWorklet from './audioProcesserWorklet?raw'

export class AudioReader {
  private static workletBlob = new Blob([processorWorklet], {
    type: 'text/javascript',
  })
  private static workletUrl = URL.createObjectURL(AudioReader.workletBlob)

  private state: 'inactive' | 'reading' = 'inactive'
  private streamSources: {
    source: MediaStream
    // TODO volume: number
  }[] = []
  private pcmCache: Uint8Array[] = []
  private worker: AudioWorkletNode

  public addSource(s: MediaStream): void {
    if (this.streamSources.every(({ source }) => s !== source)) {
      this.streamSources.push({
        source: s,
      })
    }
  }

  public async start(): Promise<void> {
    const audioTracks = this.streamSources
      .map((ss) => ss.source.getAudioTracks())
      .flat()
    const stream = new MediaStream(audioTracks)
    const audioContext = new AudioContext()

    // init worklet
    await audioContext.audioWorklet.addModule(AudioReader.workletUrl)
    this.worker = new AudioWorkletNode(audioContext, 'processor')
    this.worker.port.onmessage = (event: MessageEvent<ArrayBuffer[]>) => {
      console.debug(event.data)
      const pcmBuffers = event.data
      this.pcmCache = pcmBuffers.map((pcmBuf, index) => {
        const oldCache = this.pcmCache[index]
        const bytes = new Uint8Array(pcmBuf)
        const newCache = new Uint8Array(oldCache.length + bytes.length)
        newCache.set(oldCache)
        newCache.set(bytes, oldCache.length)
        return newCache
      })
    }

    // build a new stream
    const audioInput = audioContext.createMediaStreamSource(stream)
    // connect source with processor node
    audioInput.connect(this.worker)
  }

  public getPcms(): Uint8Array[] {
    return this.pcmCache
  }

  public destroy(): void {
    URL.revokeObjectURL(AudioReader.workletUrl)
    this.worker.port.postMessage('stop')
    this.worker.disconnect()
    this.streamSources = []
    delete AudioReader.workletUrl
    delete AudioReader.workletBlob
  }
}
