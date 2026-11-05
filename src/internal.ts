// Shared by the modules but kept out of the index, so none of it is public API.

export const utf8Encoder = new TextEncoder()
export const utf8StrictDecoder = new TextDecoder('utf-8', { fatal: true })

// Below this a grey's float noise in a and b would hand it an arbitrary hue.
export const ACHROMATIC_CHROMA = 5e-5
