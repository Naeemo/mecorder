import {
  ISourceConfig,
  IVideoMergerOptions,
  VideoMerger,
} from './videoMerger/videoMerger'
import { AudioRecorder } from './audioRecorder/audioRecorder'
import { log } from './util/log'

interface IFrameHandler {
  (video: ImageData, pcms: Uint8Array[]): unknown
}

interface IMecorderOption {
  /**
   * collect raw data by this frequency
   */
  fps: number

  /**
   * raw data event
   * @param video
   * @param audio
   */
  onFrame: IFrameHandler
}

type MecorderOptions = IVideoMergerOptions & IMecorderOption

export default class Mecorder {
  private readonly videoMerger: VideoMerger
  private readonly audioRecorder: AudioRecorder
  private readonly fps: number
  private readonly onFrame: IFrameHandler
  private state: 'inactive' | 'recording' | 'paused' | 'destroyed' = 'inactive'
  private timer: number | null = null

  constructor({
    width,
    height,
    background = '#ffffff',
    fps,
    onFrame,
  }: MecorderOptions) {
    this.videoMerger = new VideoMerger({ width, height, background })
    this.audioRecorder = new AudioRecorder()
    this.fps = fps
    this.onFrame = onFrame
  }

  /**
   * add a recording source
   * @param sourceConfig
   */
  public addSource(sourceConfig: ISourceConfig) {
    log('debug', 'Mecorder: add source', sourceConfig)

    if (this.state === 'destroyed') {
      log('error', 'Mecorder: add source fail, already destroyed')
      return
    }

    this.videoMerger.addSource(sourceConfig)

    if (sourceConfig.source instanceof HTMLVideoElement) {
      this.audioRecorder.addSource(sourceConfig.source.captureStream())
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

    await this.audioRecorder.start()
    this.startRecording()
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

    if (this.state === 'destroyed') {
      log('error', 'Mecorder: pause fail, already destroyed')
      return
    }

    this.state = 'paused'

    // pause frame event
    window.clearInterval(this.timer)
    this.timer = null

    // pause audio recording
    this.audioRecorder.pause()
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

    if (this.state === 'destroyed') {
      log('error', 'Mecorder: resume fail, already destroyed')
      return
    }

    // resume audio recording
    this.audioRecorder.resume()

    // restart frame event
    this.startRecording()
  }

  /**
   * Destroy a mecorder
   */
  public stop(): void {
    log('debug', 'Mecorder: stop')

    if (this.state === 'destroyed') {
      log('warn', 'Mecorder: already destroyed')
      return
    }

    // stop recording timer
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }

    // stop audio recorder
    this.audioRecorder.stop()

    // drop all instance keys
    for (const key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        delete this[key]
      }
    }

    this.state = 'destroyed'
  }

  /**
   * start timer to recording audio and video
   * @private
   */
  private startRecording(): void {
    log('debug', 'Mecorder: startRecording')
    this.state = 'recording'

    if (this.timer !== null) {
      log('warn', 'Mecorder: recording already started')
      window.clearInterval(this.timer)
    }

    this.timer = window.setInterval(async () => {
      const imageData = this.videoMerger.getFrame()
      const pcms = await this.audioRecorder.getPcms()
      this.onFrame(imageData, pcms)
    }, Math.floor(1000 / this.fps))
  }
}
