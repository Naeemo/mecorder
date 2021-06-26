import Mecorder from '../src'
import { log } from '../src/util/log'

const totalWidth = 800
const totalHeight = 500
const output = document.querySelector<HTMLCanvasElement>('#output')
const ctx = output.getContext('2d')

output.height = totalHeight
output.width = totalWidth

const mecorder = new Mecorder({
  width: totalWidth,
  height: totalHeight,
  background: 'red',
  fps: 10,
  onFrame(imageData, pcms) {
    ctx.putImageData(imageData, 0, 0)
  },
})

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    log('debug', 'get camera', stream)
    const target = document.querySelector<HTMLVideoElement>('#camera')
    target.srcObject = stream
    target.play()

    mecorder.addSource({
      source: target,
      destLayout: {
        x: totalWidth / 2,
        y: 0,
        width: totalWidth / 2,
        height: totalHeight,
      },
    })
  })

mecorder.addSource({
  source: document.querySelector<HTMLVideoElement>('#video'),
  destLayout: {
    x: 0,
    y: 0,
    width: totalWidth / 2,
    height: totalHeight,
  },
})

document.querySelector('#startBtn').addEventListener('click', () => {
  mecorder.start()
})

document.querySelector('#pauseBtn').addEventListener('click', () => {
  mecorder.pause()
})

document.querySelector('#resumeBtn').addEventListener('click', () => {
  mecorder.resume()
})

document.querySelector('#stopBtn').addEventListener('click', () => {
  mecorder.stop()
})
