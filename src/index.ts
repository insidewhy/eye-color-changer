import * as faceapi from 'face-api.js'

import 'destyle.css'
import './index.scss'

import EyeColorWorker from './index.worker'

function loaded() {
  const canvas = document.querySelector('canvas')
  const canvasContext = canvas.getContext('2d')

  const worker = new EyeColorWorker()
  const uploadButton = document.querySelector('main button') as HTMLButtonElement
  const clearButton = document.querySelector('#clear-image') as HTMLButtonElement

  const redraw = (imageMessage: MessageEvent<Uint8ClampedArray>) => {
    canvasContext.putImageData(new ImageData(imageMessage.data, canvas.width, canvas.height), 0, 0)
  }

  const input = document.querySelector('input')
  input.onchange = () => {
    const img = new Image()
    img.onload = () => {
      drawImage(worker, canvas, img)
      detectFace(canvas)
      worker.onmessage = redraw
      uploadButton.style.display = 'none'
    }
    img.src = URL.createObjectURL(input.files[0])
  }

  clearButton.onclick = () => {
    worker.onmessage = null
    worker.postMessage({ type: 'stop' })
    uploadButton.style.display = ''
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    input.value = null
  }

  uploadButton.onclick = () => {
    input.click()
  }
}

function drawImage(worker: Worker, canvas: HTMLCanvasElement, img: HTMLImageElement) {
  canvas.width = img.width
  canvas.height = img.height
  const ctxt = canvas.getContext('2d')
  ctxt.drawImage(img, 0, 0)

  // const { data, width, height } = ctxt.getImageData(0, 0, canvas.width, canvas.height)
  // worker.postMessage({ type: 'load-image', imageData: data, width, height })
}

async function detectFace(canvas: HTMLCanvasElement) {
  const info = document.querySelector('#info')
  info.innerHTML = 'Detecting face'

  const modelUrl = './models'
  await faceapi.loadSsdMobilenetv1Model(modelUrl)
  await faceapi.loadAgeGenderModel(modelUrl)
  await faceapi.loadFaceLandmarkModel(modelUrl)
  const faceAgeAndGender = await faceapi.detectSingleFace(canvas).withAgeAndGender()
  if (!faceAgeAndGender) {
    info.innerHTML = 'No face detected :('
  } else {
    console.log(faceAgeAndGender)
    const { gender } = faceAgeAndGender
    const age = Math.floor(faceAgeAndGender.age)
    info.innerHTML = `Detected ${age} year old ${gender}`

    const faceLandmarks = await faceapi.detectSingleFace(canvas).withFaceLandmarks()
    if (faceLandmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, faceLandmarks)
    }
  }
}

if (document.readyState === 'complete') {
  loaded()
} else {
  window.addEventListener('DOMContentLoaded', loaded)
}
