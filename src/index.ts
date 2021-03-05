export interface ILayout {
  width: number
  height: number
  background?: string | CanvasImageSource
}

export interface ISourceConfig {
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

export default class Mecorder {
  private readonly layout: Required<ILayout>
  private readonly sourceConfigs: ISourceConfig[] = []
  private outputTarget: HTMLCanvasElement | null = null

  constructor({ width, height, background }: ILayout) {
    this.layout = {
      width,
      height,
      background: background || '#ffffff',
    }
  }

  addSource(sourceConfig: ISourceConfig) {
    // todo filter out identical audio tracks
    const index = this.sourceConfigs.findIndex((sc) => sc === sourceConfig)
    if (index === -1) {
      this.sourceConfigs.push(sourceConfig)
    }
  }

  output(canvas: HTMLCanvasElement): void {
    canvas.width = this.layout.width
    canvas.height = this.layout.height

    const ctx = canvas.getContext('2d')

    // draw background
    if (typeof this.layout.background === 'string') {
      ctx.fillStyle = this.layout.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.drawImage(this.layout.background, 0, 0, canvas.width, canvas.height)
    }

    this.outputTarget = canvas

    // todo play audio

    // draw videos
    this.refreshOutputVideo(ctx)
  }

  private refreshOutputVideo(ctx: CanvasRenderingContext2D) {
    requestAnimationFrame(() => {
      this.outputVideoFrame(ctx)
      return this.refreshOutputVideo(ctx)
    })
  }

  private outputVideoFrame(ctx: CanvasRenderingContext2D): void {
    if (this.outputTarget === null) {
      return
    }

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
