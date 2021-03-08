interface ILayout {
  width: number
  height: number
  background?: string | CanvasImageSource
}

interface ISourceConfig {
  source: CanvasImageSource
  destinationLayout: {
    x: number
    y: number
    width: number
    height: number
  }
  sourceLayout?: {
    x: number
    y: number
    width: number
    height: number
  }
}

type MecorderOptions = ILayout

export default class Mecorder {
  private readonly sourceConfigs: ISourceConfig[] = []

  private readonly outputCanvas: HTMLCanvasElement = document.createElement(
    'canvas'
  )

  private readonly outputStream: MediaStream = new MediaStream(
    this.outputCanvas.captureStream().getVideoTracks()
  )

  private readonly recorder: MediaRecorder

  private readonly chunks: Blob[] = []

  constructor({
    width,
    height,
    background = '#ffffff',
    mimeType = 'video/webm',
    audioBitsPerSecond,
    videoBitsPerSecond,
    bitsPerSecond,
    audioBitrateMode,
  }: MecorderOptions & MediaRecorderOptions) {
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`${mimeType} not supported`)
    }

    // init output canvas
    const ctx = this.outputCanvas.getContext('2d')
    this.outputCanvas.width = width
    this.outputCanvas.height = height

    // draw background
    if (typeof background === 'string') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.drawImage(background, 0, 0, width, height)
    }

    // start draw videos
    this.mergeVideo(ctx)

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
  }

  /**
   * add a recording source
   * @param sourceConfig
   */
  public addSource(sourceConfig: ISourceConfig) {
    console.debug('Mecorder add source', sourceConfig)
    const index = this.sourceConfigs.findIndex((sc) => sc === sourceConfig)

    if (index === -1) {
      this.sourceConfigs.push(sourceConfig)
    }

    // add audio tracks from video element
    if (sourceConfig.source instanceof HTMLVideoElement) {
      const audioTracks = sourceConfig.source.captureStream().getAudioTracks()
      for (const at of audioTracks) {
        this.outputStream.addTrack(at)
      }
    }

    console.debug('Mecorder added source', this.outputStream)
  }

  public start(): void {
    console.debug('Mecorder start')
    if (this.recorder.state === 'recording') {
      console.warn('Mecorder already recording')
      return
    }

    if (this.recorder.state === 'paused') {
      console.debug('Mecorder paused, resume now')
      this.recorder.resume()
      return
    }

    this.recorder.start()
  }

  public paused(): void {
    this.recorder.pause()
  }

  public async stop(): Promise<Blob[]> {
    let resolver
    const result = new Promise<Blob[]>(function (resolve) {
      resolver = resolve
    })

    this.recorder.onstop = () => {
      console.debug('Mecorder record stop', this.chunks)
      resolver(this.chunks)
    }

    this.recorder.stop()
    return result
  }

  private mergeVideo(ctx: CanvasRenderingContext2D) {
    requestAnimationFrame(() => {
      this.mergeVideoFrame(ctx)
      return this.mergeVideo(ctx)
    })
  }

  private mergeVideoFrame(ctx: CanvasRenderingContext2D): void {
    for (const sc of this.sourceConfigs) {
      const { source, sourceLayout, destinationLayout } = sc
      if (sourceLayout) {
        ctx.drawImage(
          source,
          sourceLayout.x,
          sourceLayout.y,
          sourceLayout.width,
          sourceLayout.height,
          destinationLayout.x,
          destinationLayout.y,
          destinationLayout.width,
          destinationLayout.height
        )
      } else {
        ctx.drawImage(
          source,
          destinationLayout.x,
          destinationLayout.y,
          destinationLayout.width,
          destinationLayout.height
        )
      }
    }
  }
}
