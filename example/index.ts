import Mecorder from '../src/index'

const mecorder = new Mecorder({
  width: 600,
  height: 600,
})
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
  })
  .then((stream) => {
    console.debug('get camera', stream)
    const target = document.querySelector<HTMLVideoElement>('#camera')
    target.srcObject = stream
    target.play()
  })

mecorder.addSource({
  source: document.querySelector<HTMLVideoElement>('#video'),
  destinationLayout: {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  },
})
mecorder.addSource({
  source: document.querySelector<HTMLVideoElement>('#camera'),
  destinationLayout: {
    x: 300,
    y: 0,
    width: 300,
    height: 300,
  },
})

mecorder.start()

setTimeout(() => {
  mecorder.stop().then((chunks) => {
    const blob = new Blob(chunks, { type: 'video/mp4' })
    const url = window.URL.createObjectURL(blob)
    const output = document.querySelector<HTMLVideoElement>('#output')
    output.src = url
  })
}, 10 * 1000)
