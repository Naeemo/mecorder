import processorWorklet from './worklet?raw'
import { log } from '../util/log'

export class AudioRecorder {
  private static workletBlob = new Blob([processorWorklet], {
    type: 'text/javascript',
  })
  private static workletUrl = URL.createObjectURL(AudioRecorder.workletBlob)

  private state: 'inactive' | 'paused' | 'processing' = 'inactive'
  private streamSources: MediaStream[] = []
  private pcmCache: Uint8Array[] = []
  private audioContext: AudioContext | null = null
  private worker?: AudioWorkletNode

  /**
   * Add a new media stream to audio recorder, return the number of audio tracks added
   * @param source
   */
  public addSource(source: MediaStream): number {
    const audioTracks = source.getAudioTracks()

    if (audioTracks.length === 0) {
      log(
        'warn',
        `audio recorder: new media stream doesn\'t contain any audio tracks`
      )
      return audioTracks.length
    }

    if (this.streamSources.some((s) => s === source)) {
      log('warn', `audio recorder: new media stream is already being recorded.`)
      return 0
    }

    this.streamSources.push(source)

    if (this.state === 'processing' || this.state === 'paused') {
      this.addNewTracks(audioTracks)
    }

    return audioTracks.length
  }

  /**
   * start audio recording
   */
  public async start(): Promise<void> {
    if (this.state !== 'inactive') {
      log('warn', 'audio recorder: start fail, already started')
      return
    }
    this.state = 'processing'
    const audioTracks = this.streamSources
      .map((source) => source.getAudioTracks())
      .flat()
    const stream = new MediaStream(audioTracks)
    this.audioContext = new AudioContext()

    // init worklet
    await this.audioContext.audioWorklet.addModule(AudioRecorder.workletUrl)
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

  /**
   * pause audio recording
   */
  public pause(): void {
    if (this.state === 'inactive') {
      log('warn', 'audio recorder: pause fail, not started yet')
      return
    }

    if (this.state === 'paused') {
      log('warn', 'audio recorder: already paused')
      this.worker?.port.postMessage('pause')
      return
    }

    this.state = 'paused'
    this.worker?.port.postMessage('pause')
  }

  /**
   * resume audio recording
   */
  public resume(): void {
    if (this.state === 'inactive') {
      log('error', 'audio recorder: resume fail, not started yet')
      return
    }

    if (this.state === 'processing') {
      log('warn', 'audio recorder: already processing, resume is unnecessary')
      this.worker?.port.postMessage('resume')
      return
    }

    this.state = 'processing'
    this.worker?.port.postMessage('resume')
  }

  /**
   * get audio PCM data since last call
   */
  public getPcms(): Uint8Array[] {
    const pcms = this.pcmCache
    this.pcmCache = []
    return pcms
  }

  /**
   * destroy audio recorder instance
   */
  public stop(): void {
    this.worker?.port.postMessage('stop')
    this.worker?.disconnect()
    this.audioContext?.close()
    this.streamSources = []
  }

  /**
   * Add new audio track(s) to the recorder
   * @param audioTracks
   * @private
   */
  private addNewTracks(audioTracks: MediaStreamTrack[]): void {
    if (audioTracks.length === 0) {
      log(
        'warn',
        `audio recorder add new tracks fail, no tracks available:`,
        audioTracks
      )
      return
    }

    const stream = new MediaStream(audioTracks)
    const audioInput = this.audioContext?.createMediaStreamSource(stream)
    if (this.worker) {
      audioInput?.connect(this.worker)
    }
  }
}
