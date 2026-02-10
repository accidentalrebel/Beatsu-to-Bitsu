import { SceneManager } from './scene-manager.js'
import * as rainWindow from './scenes/rain-window.js'
import * as neonCity from './scenes/neon-city.js'
import * as starfield from './scenes/starfield.js'
import * as fireflies from './scenes/fireflies.js'
import * as aurora from './scenes/aurora.js'
import * as oceanWaves from './scenes/ocean-waves.js'
import * as lanterns from './scenes/lanterns.js'
import * as koiPond from './scenes/koi-pond.js'

const scenes = [rainWindow, neonCity, starfield, fireflies, aurora, oceanWaves, lanterns, koiPond]
const manager = new SceneManager(scenes)
manager.start()
