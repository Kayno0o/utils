// Browsers fetch a download's URL after the click task, some much later, so the object URL outlives the click by FileSaver.js's 40 s.
export const OBJECT_URL_REVOKE_DELAY_MS = 40_000

/** Clicks a temporary anchor attached to the body; an object URL it is given is revoked `OBJECT_URL_REVOKE_DELAY_MS` later. */
export function clickAnchor(href: string, filename: string, revokeObjectUrl = false): void {
  const a = document.createElement('a')

  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  if (revokeObjectUrl)
    setTimeout(() => URL.revokeObjectURL(href), OBJECT_URL_REVOKE_DELAY_MS)
}

/** Downloads `blob` through an anchor on a fresh object URL. */
export function clickBlobAnchor(blob: Blob, filename: string): void {
  clickAnchor(URL.createObjectURL(blob), filename, true)
}
