interface HTMLCanvasElement {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
   * @param frameRate
   */
  captureStream(frameRate?: number): MediaStream
}

interface HTMLMediaElement {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream
   */
  captureStream(): MediaStream
}
