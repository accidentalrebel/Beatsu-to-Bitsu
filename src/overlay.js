const overlay = document.getElementById('overlay')
const sceneName = document.getElementById('scene-name')
let hideTimer = null

export function showOverlay(name) {
  sceneName.textContent = name
  overlay.classList.add('show')
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => overlay.classList.remove('show'), 3000)
}

export function hideOverlay() {
  clearTimeout(hideTimer)
  overlay.classList.remove('show')
}
