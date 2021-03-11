import { ISourceConfig, IVideoMergerOptions, VideoMerger } from './videoMerger'
import { AudioReader } from './audioReader'

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
  private readonly audioReader: AudioReader
  private readonly fps: number
  private readonly onFrame: IFrameHandler
  private timer: number

  constructor({
    width,
    height,
    background = '#ffffff',
    fps,
    onFrame,
  }: MecorderOptions) {
    this.videoMerger = new VideoMerger({ width, height, background })
    this.audioReader = new AudioReader()
    this.fps = fps
    this.onFrame = onFrame
  }

  /**
   * add a recording source
   * @param sourceConfig
   */
  public addSource(sourceConfig: ISourceConfig) {
    console.debug('Mecorder add source', sourceConfig)
    this.videoMerger.addSource(sourceConfig)

    if (sourceConfig.source instanceof HTMLVideoElement) {
      this.audioReader.addSource(sourceConfig.source.captureStream())
    }
  }

  public start(): void {
    // TODO
    //  output raw data by calling onFrame
    console.debug('Mecorder start')
    this.audioReader.start()
    this.timer = window.setInterval(() => {
      const imageData = this.videoMerger.getFrame()
      const pcms = this.audioReader.getPcms()
      this.onFrame(imageData, pcms)
    }, Math.floor(1000 / this.fps))
  }

  public pause(): void {
    // TODO
    //  pause frame event
    console.debug('Mecorder pause')
  }

  public resume(): void {
    // TODO
    //  resume frame event
    console.debug('Mecorder resume')
  }

  public destroy(): void {
    // TODO
    //  clean up
    console.debug('Mecorder destroy')
    this.audioReader.destroy()
  }
}
