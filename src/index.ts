import { IVideoMergerOptions, ISourceConfig, VideoMerger } from './videoMerger'

type MecorderOptions = IVideoMergerOptions & MediaRecorderOptions

export default class Mecorder {
  private readonly videoMerger: VideoMerger

  private recorder: MediaRecorder | null = null

  private readonly chunks: Blob[] = []

  constructor({ width, height, background = '#ffffff' }: MecorderOptions) {
    this.videoMerger = new VideoMerger({ width, height, background })
    console.log(this.videoMerger.getVideoTracks())
  }

  /**
   * add a recording source
   * @param sourceConfig
   */
  public addSource(sourceConfig: ISourceConfig) {
    console.debug('Mecorder add source', sourceConfig)
    this.videoMerger.addSource(sourceConfig)

    // add audio tracks from video element
    if (sourceConfig.source instanceof HTMLVideoElement) {
      const audioTracks = sourceConfig.source.captureStream().getAudioTracks()
      for (const at of audioTracks) {
        this.outputStream.addTrack(at)
      }
    }

    console.debug('Mecorder added source', this.outputStream)
  }

  public start({
    mimeType = 'video/webm',
    audioBitsPerSecond,
    videoBitsPerSecond,
    bitsPerSecond,
    audioBitrateMode,
  }: MediaRecorderOptions = {}): void {
    console.debug('Mecorder start')
    if (this.recorder?.state === 'recording') {
      console.warn('Mecorder already recording')
      return
    }

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`Mecorder ${mimeType} not supported`)
    }

    this.outputStream = new MediaStream(this.videoMerger.getVideoTracks())
    this.recorder = new MediaRecorder(this.outputStream, {
      mimeType,
      audioBitsPerSecond,
      videoBitsPerSecond,
      bitsPerSecond,
      audioBitrateMode,
    })
    this.recorder.ondataavailable = (blobEvent) => {
      console.debug(
        'Mecorder data available',
        blobEvent.data,
        blobEvent.timecode
      )
      this.chunks.push(blobEvent.data)
    }
    setInterval(() => {
      this.recorder.requestData()
    }, 2000)

    if (this.recorder.state === 'paused') {
      console.debug('Mecorder paused, resume now')
      this.recorder.resume()
      return
    }

    this.recorder.start()
  }

  public pause(): void {
    this.recorder.pause()
  }

  public resume(): void {
    this.recorder.resume()
  }

  public async stop(): Promise<Blob[]> {
    let resolver
    const result = new Promise<Blob[]>(function (resolve) {
      resolver = resolve
    })

    this.recorder.onstop = () => {
      console.debug('Mecorder record stop', this.chunks)
      // todo save chunks to indexedDB
      resolver(this.chunks)
    }

    this.recorder.stop()
    return result
  }
}
