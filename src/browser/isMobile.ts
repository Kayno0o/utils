const MOBILE_UA_REGEX = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i

export function isMobile(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

export function isMobileOrTablet(): boolean {
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches

  return isTouch && isSmallScreen
}

export function isMobileDevice(): boolean {
  if ('userAgentData' in navigator) {
    return (navigator as any).userAgentData.mobile
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera

  return MOBILE_UA_REGEX.test(ua)
}
