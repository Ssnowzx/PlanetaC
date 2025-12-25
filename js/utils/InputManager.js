/**
 * Handles keyboard and touch input for vehicle control.
 */
export class InputManager {
  constructor() {
    this.keys = {};
    this.initListeners();
  }

  initListeners() {
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));

    // Touch controls
    const arrowBtns = {
      ArrowUp: document.getElementById("arrow-up"),
      ArrowDown: document.getElementById("arrow-down"),
      ArrowLeft: document.getElementById("arrow-left"),
      ArrowRight: document.getElementById("arrow-right"),
    };

    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach((code) => {
      if (arrowBtns[code]) {
        const trigger = (pressed) => {
          this.keys[code] = pressed;
        };

        arrowBtns[code].addEventListener("touchstart", (e) => { e.preventDefault(); trigger(true); }, { passive: false });
        arrowBtns[code].addEventListener("touchend", (e) => { e.preventDefault(); trigger(false); }, { passive: false });
        arrowBtns[code].addEventListener("mousedown", () => trigger(true));
        arrowBtns[code].addEventListener("mouseup", () => trigger(false));
        arrowBtns[code].addEventListener("mouseleave", () => trigger(false));
      }
    });
  }

  isPressed(code) {
    return !!this.keys[code];
  }
}
