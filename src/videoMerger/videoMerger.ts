export interface IVideoMergerOptions {
  width: number
  height: number
  background?: string | CanvasImageSource
}

interface ILayout {
  x: number
  y: number
  width: number
  height: number
}

export interface ISourceConfig {
  /**
   * video source for recording
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   */
  source: CanvasImageSource

  /**
   * target area for the source to use
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   */
  destLayout: ILayout

  /**
   * how source fit the destination area
   */
  fit?: 'contain' | 'cover' | 'fill'

  /**
   * which part of source will be recorded
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   */
  sourceLayout?: ILayout
}

export class VideoMerger {
  private readonly outputCanvas: HTMLCanvasElement
  private readonly stream: MediaStream
  private readonly drawSources: ISourceConfig[] = []

  constructor(
    outputStream: MediaStream,
    { width, height, background }: Required<IVideoMergerOptions>
  ) {
    // init output canvas
    this.outputCanvas = document.createElement<'canvas'>('canvas')
    this.outputCanvas.width = width
    this.outputCanvas.height = height

    const ctx = this.outputCanvas.getContext('2d')
    if (ctx === null) {
      throw new Error('video merger: fail to get canvas context')
    }

    // prepare background
    if (typeof background === 'string') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.drawImage(background, 0, 0, width, height)
    }
    this.stream = this.outputCanvas.captureStream()

    this.stream.getVideoTracks().forEach((vt) => {
      outputStream.addTrack(vt)
    })
  }

  private static fitDestLayout(sc: ISourceConfig): ILayout {
    const { source, fit, sourceLayout, destLayout } = sc
    const sourceWidth =
      sourceLayout?.width ||
      // @ts-ignore
      source['naturalWidth'] ||
      // @ts-ignore
      source['videoWidth'] ||
      source.width ||
      destLayout.width
    const sourceHeight =
      sourceLayout?.height ||
      // @ts-ignore
      source['naturalHeight'] ||
      // @ts-ignore
      source['videoHeight'] ||
      source.height ||
      destLayout.height

    let dx, dy, dw, dh
    switch (fit) {
      case 'cover': {
        const wRatio = destLayout.width / sourceWidth
        const hRatio = destLayout.height / sourceHeight
        const ratio = Math.max(wRatio, hRatio)
        dw = ratio * sourceWidth
        dh = ratio * sourceHeight
        dx = (destLayout.width - dw) / 2 + destLayout.x
        dy = (destLayout.height - dh) / 2 + destLayout.y
        break
      }
      case 'fill': {
        dx = destLayout.x
        dy = destLayout.y
        dw = destLayout.width
        dh = destLayout.height
        break
      }
      case 'contain':
      default: {
        const wRatio = destLayout.width / sourceWidth
        const hRatio = destLayout.height / sourceHeight
        const ratio = Math.min(wRatio, hRatio)
        dw = ratio * sourceWidth
        dh = ratio * sourceHeight
        dx = (destLayout.width - dw) / 2 + destLayout.x
        dy = (destLayout.height - dh) / 2 + destLayout.y
        break
      }
    }

    return {
      x: dx,
      y: dy,
      width: dw,
      height: dh,
    }
  }

  public addSource(sc: ISourceConfig) {
    this.drawSources.push(sc)
  }

  public getFrame(): void {
    const ctx = this.outputCanvas.getContext('2d')
    if (ctx === null) {
      throw new Error('video merger: fail to get canvas context')
    }

    this.mergeSourceFrames(ctx)
  }

  private mergeSourceFrames(ctx: CanvasRenderingContext2D): void {
    for (const ds of this.drawSources) {
      const { source, sourceLayout } = ds
      const destLayout = VideoMerger.fitDestLayout(ds)

      if (sourceLayout) {
        ctx.drawImage(
          source,
          sourceLayout.x,
          sourceLayout.y,
          sourceLayout.width,
          sourceLayout.height,
          destLayout.x,
          destLayout.y,
          destLayout.width,
          destLayout.height
        )
      } else {
        ctx.drawImage(
          source,
          destLayout.x,
          destLayout.y,
          destLayout.width,
          destLayout.height
        )
      }
    }
  }
}
