import Mecorder from '../src/util'

const totalWidth = 1280
const totalHeight = 720

const mecorder = new Mecorder({
  width: totalWidth,
  height: totalHeight,
  fps: 10,
  onFrame(imageData, pcms) {
    const output = document.querySelector<HTMLCanvasElement>('#output')
    const ctx = output.getContext('2d')
    ctx.putImageData(imageData, 0, 0)
  },
})
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    console.debug('get camera', stream)
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

document.querySelector('#stopBtn').addEventListener('click', () => {
  mecorder.destroy()
})
