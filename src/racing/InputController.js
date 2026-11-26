/**
 * InputController: Desktop keyboard + mobile touch support
 */
export class InputController {
  constructor() {
    this.inputs = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      handbrake: false,
      nitro: false
    };

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.throttle = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.brake = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.steerLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.steerRight = true;
          break;
        case 'Space':
          this.inputs.handbrake = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN':
          this.inputs.nitro = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputs.throttle = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputs.brake = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.steerLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.steerRight = false;
          break;
        case 'Space':
          this.inputs.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyN':
          this.inputs.nitro = false;
          break;
      }
    });
  }

  setupTouch() {
    const bindTouch = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on = (e) => { e.preventDefault(); this.inputs[key] = true; };
      const off = (e) => { e.preventDefault(); this.inputs[key] = false; };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
    };

    bindTouch('touch-throttle', 'throttle');
    bindTouch('touch-brake', 'brake');
    bindTouch('touch-steer-left', 'steerLeft');
    bindTouch('touch-steer-right', 'steerRight');
    bindTouch('touch-handbrake', 'handbrake');
    bindTouch('touch-nitro', 'nitro');
  }

  getInputs() {
    return this.inputs;
  }
}
