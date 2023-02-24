import Mecorder from '../src'
import { log } from '../src/util/log'

const totalWidth = 800
const totalHeight = 500
const outputVideo = document.querySelector<HTMLVideoElement>('#output')!

let chunks: Blob[] = []
const mecorder = new Mecorder({
  width: totalWidth,
  height: totalHeight,
  background: 'red',
  fps: 10,
  mimeType: 'video/webm',
})

mecorder.ondataavailable = function (event) {
  chunks.push(event.data)
}
mecorder.onstop = (e) => {
  console.log('data available after MediaRecorder.stop() called.')

  // const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
  const blob = new Blob(chunks, { type: 'video/webm' })
  chunks = []
  const audioURL = URL.createObjectURL(blob)
  outputVideo.src = audioURL
  console.log('recorder stopped')
}

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then(async (stream) => {
    log('debug', 'get camera', stream)
    const target = document.querySelector<HTMLVideoElement>('#camera')!
    target.srcObject = stream
    await target.play()

    target.addEventListener('click', function () {
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

    // mecorder.addSource({
    //   source: target,
    //   destLayout: {
    //     x: totalWidth / 2,
    //     y: 0,
    //     width: totalWidth / 2,
    //     height: totalHeight,
    //   },
    // })
  })

mecorder.addSource({
  source: document.querySelector<HTMLVideoElement>('#video')!,
  destLayout: {
    x: 0,
    y: 0,
    width: totalWidth / 2,
    height: totalHeight,
  },
})

document.querySelector('#startBtn')?.addEventListener('click', () => {
  mecorder.start()
})

document.querySelector('#pauseBtn')?.addEventListener('click', () => {
  mecorder.pause()
})

document.querySelector('#resumeBtn')?.addEventListener('click', () => {
  mecorder.resume()
})

document.querySelector('#stopBtn')?.addEventListener('click', () => {
  mecorder.stop()
})
