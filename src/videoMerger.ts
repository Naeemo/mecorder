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
  private readonly drawSources: ISourceConfig[] = []

  constructor({ width, height, background }: Required<IVideoMergerOptions>) {
    // init output canvas
    this.outputCanvas = document.querySelector('#output')
    this.outputCanvas.width = width
    this.outputCanvas.height = height

    const ctx = this.outputCanvas.getContext('2d')

    // draw background
    if (typeof background === 'string') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.drawImage(background, 0, 0, width, height)
    }

    // start draw videos
    this.mergeVideo(ctx)
  }

  private static fitDestLayout(sc: ISourceConfig): ILayout {
    const { source, fit, sourceLayout, destLayout } = sc
    const sourceWidth =
      sourceLayout?.width ||
      source['naturalWidth'] ||
      source['videoWidth'] ||
      source.width ||
      destLayout.width
    const sourceHeight =
      sourceLayout?.height ||
      source['naturalHeight'] ||
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

  public getVideoTracks() {
    return this.outputCanvas.captureStream().getVideoTracks()
  }

  private mergeVideo(ctx: CanvasRenderingContext2D) {
    requestAnimationFrame(() => {
      this.mergeVideoFrame(ctx)
      return this.mergeVideo(ctx)
    })
  }

  private mergeVideoFrame(ctx: CanvasRenderingContext2D): void {
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
