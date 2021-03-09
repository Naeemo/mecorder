import Mecorder from '../src/index'

const mecorder = new Mecorder({
  width: 1920,
  height: 1080,
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
  destLayout: {
    x: 0,
    y: 0,
    width: 960,
    height: 1080,
  },
})
mecorder.addSource({
  source: document.querySelector<HTMLVideoElement>('#camera'),
  destLayout: {
    x: 960,
    y: 0,
    width: 960,
    height: 1080,
  },
})

setTimeout(() => {
  mecorder.start()
  // mecorder.stop().then((chunks) => {
  //   const blob = new Blob(chunks, { type: 'video/mp4' })
  //   const url = window.URL.createObjectURL(blob)
  //   const output = document.querySelector<HTMLVideoElement>('#outputVideo')
  //   output.src = url
  // })
}, 10 * 1000)
