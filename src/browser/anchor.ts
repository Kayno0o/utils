/** Clicks a temporary anchor attached to the body; an object URL it is given is revoked on the next task so Safari has read it. */
export function clickAnchor(href: string, filename: string, revokeObjectUrl = false): void {
  const a = document.createElement('a')

  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  if (revokeObjectUrl)
    setTimeout(() => URL.revokeObjectURL(href), 0)
}

/** Downloads `blob` through an anchor on a fresh object URL. */
export function clickBlobAnchor(blob: Blob, filename: string): void {
  clickAnchor(URL.createObjectURL(blob), filename, true)
}
