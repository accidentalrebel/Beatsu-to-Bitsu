import { SceneManager } from './scene-manager.js'
import * as rainWindow from './scenes/rain-window.js'
import * as neonCity from './scenes/neon-city.js'
import * as starfield from './scenes/starfield.js'

const canvasA = document.getElementById('canvas-a')
const canvasB = document.getElementById('canvas-b')

const scenes = [rainWindow, neonCity, starfield]
const manager = new SceneManager(canvasA, canvasB, scenes)
manager.start()
