/**
 * Input.js - Handles PC keyboard, mobile touch buttons, and virtual controls
 */

export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
      nitro: false,
      reset: false,
      camera: false
    };

    this.touchControls = {
      steer: 0, // -1 (left) to 1 (right)
      throttle: 0, // 0 to 1
      brake: 0, // 0 to 1
      handbrake: false,
      nitro: false
    };

    this.sensitivity = 1.0;
    this.initKeyboard();
  }

  setSensitivity(val) {
    this.sensitivity = Math.max(0.5, Math.min(2.0, val));
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling with arrows/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });
  }

  handleKey(code, isPressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = isPressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = isPressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = isPressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = isPressed;
        break;
      case 'Space':
        this.keys.handbrake = isPressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.nitro = isPressed;
        break;
      case 'KeyR':
        this.keys.reset = isPressed;
        break;
      case 'KeyC':
        if (isPressed && !this.keys.camera && this.onCameraSwitch) {
          this.onCameraSwitch();
        }
        this.keys.camera = isPressed;
        break;
    }
  }

  /**
   * Bind DOM touch controls for mobile/tablet
   */
  bindTouchControls(elements) {
    const { btnLeft, btnRight, btnGas, btnBrake, btnNitro, btnHandbrake } = elements;

    const bindTouch = (el, onStart, onEnd) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onStart();
      });
      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        onEnd();
      });
      el.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        onEnd();
      });
      el.addEventListener('pointerleave', (e) => {
        e.preventDefault();
        onEnd();
      });
    };

    bindTouch(btnLeft, () => { this.touchControls.steer = -1; }, () => {
      if (this.touchControls.steer === -1) this.touchControls.steer = 0;
    });

    bindTouch(btnRight, () => { this.touchControls.steer = 1; }, () => {
      if (this.touchControls.steer === 1) this.touchControls.steer = 0;
    });

    bindTouch(btnGas, () => { this.touchControls.throttle = 1; }, () => {
      this.touchControls.throttle = 0;
    });

    bindTouch(btnBrake, () => { this.touchControls.brake = 1; }, () => {
      this.touchControls.brake = 0;
    });

    bindTouch(btnNitro, () => { this.touchControls.nitro = true; }, () => {
      this.touchControls.nitro = false;
    });

    bindTouch(btnHandbrake, () => { this.touchControls.handbrake = true; }, () => {
      this.touchControls.handbrake = false;
    });
  }

  getThrottle() {
    if (this.touchControls.throttle > 0) return this.touchControls.throttle;
    return this.keys.forward ? 1 : 0;
  }

  getBrake() {
    if (this.touchControls.brake > 0) return this.touchControls.brake;
    return this.keys.backward ? 1 : 0;
  }

  getSteer() {
    if (this.touchControls.steer !== 0) {
      return this.touchControls.steer * this.sensitivity;
    }
    let s = 0;
    if (this.keys.left) s -= 1;
    if (this.keys.right) s += 1;
    return s * this.sensitivity;
  }

  isHandbrake() {
    return this.keys.handbrake || this.touchControls.handbrake;
  }

  isNitro() {
    return this.keys.nitro || this.touchControls.nitro;
  }

  isReset() {
    return this.keys.reset;
  }
}

export const input = new InputManager();
