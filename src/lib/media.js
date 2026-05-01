export async function compressImage(file, maxDimension = 1280, quality = 0.85) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension)
          width = maxDimension
        } else {
          width = Math.round((width / height) * maxDimension)
          height = maxDimension
        }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      )
    }
    img.src = URL.createObjectURL(file)
  })
}

export function isVideo(file) {
  return Boolean(file?.type?.startsWith('video/'))
}

export function validateMedia(file) {
  if (!file) return null
  if (isVideo(file)) {
    if (file.type !== 'video/mp4') return 'Only MP4 videos are supported'
    if (file.size > 30 * 1024 * 1024) return 'Video must be under 30MB'
  } else {
    if (file.size > 10 * 1024 * 1024) return 'Photo must be under 10MB'
  }
  return null
}
