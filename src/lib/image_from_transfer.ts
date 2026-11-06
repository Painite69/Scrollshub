/** Pull an image blob from a paste or drag-drop event (files, Discord CDN URLs, HTML <img>, etc.). */

function isLikelyImageUrl(url: string): boolean {
  if (!url || url.startsWith('#')) return false
  if (url.startsWith('data:image/')) return true
  if (/^https?:\/\//i.test(url)) {
    if (/\.(png|jpe?g|gif|webp|bmp|avif)(\?|#|$)/i.test(url)) return true
    // Discord / common CDNs often omit extensions
    if (
      /discordapp\.com|discordapp\.net|discord\.com|media\.discord|cdn\.discord/i.test(url) ||
      /imgur\.com|i\.imgur|giphy\.com|tenor\.com|cloudinary|twimg/i.test(url)
    ) {
      return true
    }
  }
  return false
}

async function blobFromUrl(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.type.startsWith('image/')) return blob
    // Some CDNs omit content-type; accept if payload looks non-empty
    if (!blob.type && blob.size > 32) return new Blob([blob], { type: 'image/png' })
    if (blob.size > 32 && /octet-stream|binary/i.test(blob.type)) {
      return new Blob([blob], { type: 'image/png' })
    }
    return blob.type.startsWith('image/') ? blob : null
  } catch {
    // CORS fallback: draw via <img> (works when server sends ACAO or same-origin)
    try {
      const img = await loadHtmlImage(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      if (canvas.width < 1 || canvas.height < 1) return null
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(img, 0, 0)
      return await new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), 'image/png')
      })
    } catch {
      return null
    }
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

function urlsFromHtml(html: string): string[] {
  const urls: string[] = []
  const re = /(?:src|href)=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    urls.push(m[1])
  }
  return urls
}

export async function imageFromDataTransfer(dt: DataTransfer | null | undefined): Promise<Blob | null> {
  if (!dt) return null

  // 1) Native files (desktop file drag)
  for (const file of Array.from(dt.files ?? [])) {
    if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)) {
      return file
    }
  }

  // 2) DataTransferItem files
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file && (file.type.startsWith('image/') || file.type === '' || file.size > 0)) {
        if (!file.type || file.type.startsWith('image/')) return file
      }
    }
  }

  // 3) URI list
  const uriList = dt.getData('text/uri-list')
  if (uriList) {
    for (const line of uriList.split(/\r?\n/)) {
      const url = line.trim()
      if (isLikelyImageUrl(url)) {
        const blob = await blobFromUrl(url)
        if (blob) return blob
      }
    }
  }

  // 4) HTML snippet (Discord often provides <img src="cdn...">)
  const html = dt.getData('text/html')
  if (html) {
    for (const url of urlsFromHtml(html)) {
      if (isLikelyImageUrl(url)) {
        const blob = await blobFromUrl(url)
        if (blob) return blob
      }
    }
  }

  // 5) Plain text URL
  const plain = dt.getData('text/plain')?.trim()
  if (plain && isLikelyImageUrl(plain.split(/\s+/)[0])) {
    const blob = await blobFromUrl(plain.split(/\s+/)[0])
    if (blob) return blob
  }

  return null
}

export async function imageFromClipboard(e: ClipboardEvent): Promise<Blob | null> {
  const dt = e.clipboardData
  if (!dt) return null

  // Prefer real image items first (Windows screenshot / copy image)
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }

  return imageFromDataTransfer(dt)
}
