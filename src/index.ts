import {
  ISourceConfig,
  IVideoMergerOptions,
  VideoMerger,
} from './videoMerger/videoMerger'
import { log } from './util/log'

type MecorderOptions = {
  /**
   * merged video FPS
   */
  fps?: number
} & IVideoMergerOptions &
  MediaRecorderOptions

export default class Mecorder extends MediaRecorder {
  private readonly videoMerger: VideoMerger
  private readonly fps: number
  private timer: number | null = null

  constructor({
    fps = 30,
    width,
    height,
    background = '#ffffff',
    ...options
  }: MecorderOptions) {
    const stream = new MediaStream()
    const videoMerger = new VideoMerger(stream, { width, height, background })

    super(stream, options)

    this.fps = fps
    this.videoMerger = videoMerger
  }

  /**
   * add a recording source
   * @param sourceConfig
   */
  public addSource(sourceConfig: ISourceConfig) {
    log('debug', 'Mecorder: add source', sourceConfig)

    this.videoMerger.addSource(sourceConfig)

    if (sourceConfig.source instanceof HTMLVideoElement) {
      sourceConfig.source
        .captureStream()
        .getAudioTracks()
        .forEach((at) => {
          this.stream.addTrack(at)
        })
    }
  }

  /**
   * start recording
   * output raw data by calling onFrame
   */
  public async start(): Promise<void> {
    log('debug', 'Mecorder: start')

    if (this.state !== 'inactive') {
      log('warn', 'Mecorder: start fail, already started')
      return
    }

    this.startRecording()
    super.start()
  }

  /**
   * pause recording
   * no need to pause videoMerger, because it doesn't do anything till getFrame() called
   */
  public pause(): void {
    log('debug', 'Mecorder: pause')

    if (this.state === 'paused') {
      log('warn', 'Mecorder: pause fail, already paused')
      return
    }

    // pause frame event
    if (this.timer) window.clearInterval(this.timer)
    this.timer = null
    super.pause()
  }

  /**
   * resume recording
   */
  public resume(): void {
    log('debug', 'Mecorder: resume')

    if (this.state === 'inactive') {
      log('error', 'Mecorder: resume fail, not started yet')
      return
    }

    // restart frame event
    this.startRecording()
    super.resume()
  }

  /**
   * Destroy a mecorder
   * todo: check if media recorder still startable after stop
   */
  public stop(): void {
    log('debug', 'Mecorder: stop')

    // stop recording timer
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }

    super.stop()
  }

  /**
   * start timer to recording audio and video
   * @private
   */
  private startRecording(): void {
    log('debug', 'Mecorder: startRecording')

    if (this.timer !== null) {
      log('warn', 'Mecorder: recording already started')
      window.clearInterval(this.timer)
    }

    this.timer = window.setInterval(async () => {
      this.videoMerger.getFrame()
    }, Math.floor(1000 / this.fps))
  }
}
