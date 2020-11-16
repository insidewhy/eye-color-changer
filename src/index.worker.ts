type WorkerMessage =
  | {
      type: 'load-image'
      imageData: Uint8ClampedArray
    }
  | { type: 'stop' }

function rgbToHsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h: number
  if (delta === 0) {
    h = 0
  } else if (r === max) {
    h = ((g - b) / delta) % 6
  } else if (g === max) {
    h = (b - r) / delta + 2
  } else if (b === max) {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = Math.round((max === 0 ? 0 : delta / max) * 100)
  const v = Math.round((max / 255) * 100)

  return { h, s, v }
}

function hsvToRgb(h: number, s: number, v: number) {
  const vDiv100 = v / 100
  const c = vDiv100 * (s / 100)
  const hh = h / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  const m = vDiv100 - c

  const p = Math.floor(hh)
  const rgb =
    p === 0
      ? [c, x, 0]
      : p === 1
      ? [x, c, 0]
      : p === 2
      ? [0, c, x]
      : p === 3
      ? [0, x, c]
      : p === 4
      ? [x, 0, c]
      : p === 5
      ? [c, 0, x]
      : []

  return {
    r: Math.round(255 * (rgb[0] + m)),
    g: Math.round(255 * (rgb[1] + m)),
    b: Math.round(255 * (rgb[2] + m)),
  }
}

class EyeColorChanger {
  private stopped = false

  constructor(private rgbaData: Uint8ClampedArray) {}

  loadImage() {
    // TODO: find eye position
  }

  stop() {
    this.stopped = true
  }
}

let eyeColorChanger: EyeColorChanger | undefined

self.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  switch (data.type) {
    case 'load-image':
      if (eyeColorChanger) {
        eyeColorChanger.stop()
      }
      eyeColorChanger = new EyeColorChanger(data.imageData)
      eyeColorChanger.loadImage()
      break

    case 'stop':
      if (eyeColorChanger) {
        eyeColorChanger.stop()
        eyeColorChanger = null
      }
      break
  }
})

export default (self as unknown) as { new (): Worker }
