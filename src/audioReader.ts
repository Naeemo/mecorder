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
  }[]

  public addSource(s: MediaStream): void {
    if (this.streamSources.every(({ source }) => s !== source)) {
      this.streamSources.push({
        source: s,
      })
    }
  }

  public start(): void {
    const audioTracks = this.streamSources.map((ss) =>
      ss.source.getAudioTracks()
    ).flat
  }

  public destroy(): void {
    URL.revokeObjectURL(AudioReader.workletUrl)
    this.streamSources = []
    delete AudioReader.workletUrl
    delete AudioReader.workletBlob
  }
}
