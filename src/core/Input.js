export class Input {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this.mouseDown = false;
    this.dragStart = null;
    this.cameraDragStart = null;
    this.clicked = null; // set on click, consumed by readers
    this.rightClicked = null;
    this.keys = new Set();
    this.keysJustPressed = new Set();

    this._bind();
  }

  _bind() {
    const c = this.canvas;

    c.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this._updateWorldPos();

      if (this.mouseDown && this.dragStart && this.cameraDragStart) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.camera.x = this.cameraDragStart.x - dx / this.camera.zoom;
        this.camera.y = this.cameraDragStart.y - dy / this.camera.zoom;
      }
    });

    c.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle click or shift+left = pan
        this.mouseDown = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.cameraDragStart = { x: this.camera.x, y: this.camera.y };
      }
    });

    c.addEventListener('mouseup', (e) => {
      if (this.mouseDown) {
        this.mouseDown = false;
        this.dragStart = null;
        this.cameraDragStart = null;
      }
    });

    c.addEventListener('click', (e) => {
      this._updateWorldPos();
      this.clicked = { x: this.mouse.worldX, y: this.mouse.worldY, screenX: e.clientX, screenY: e.clientY };
    });

    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._updateWorldPos();
      this.rightClicked = { x: this.mouse.worldX, y: this.mouse.worldY };
    });

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.camera.zoomAt(this.mouse.x, this.mouse.y, zoomFactor);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      this.keysJustPressed.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  _updateWorldPos() {
    const wp = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
    this.mouse.worldX = wp.x;
    this.mouse.worldY = wp.y;
  }

  consumeClick() {
    const c = this.clicked;
    this.clicked = null;
    return c;
  }

  consumeRightClick() {
    const c = this.rightClicked;
    this.rightClicked = null;
    return c;
  }

  consumeKeyPress(key) {
    if (this.keysJustPressed.has(key)) {
      this.keysJustPressed.delete(key);
      return true;
    }
    return false;
  }

  endFrame() {
    this.keysJustPressed.clear();
  }

  update() {
    // Edge scrolling and keyboard panning
    const panSpeed = 4 / this.camera.zoom;
    const edge = 20;

    if (this.keys.has('arrowleft') || this.keys.has('a') || this.mouse.x < edge) {
      this.camera.x -= panSpeed;
    }
    if (this.keys.has('arrowright') || this.keys.has('d') || this.mouse.x > this.canvas.width - edge) {
      this.camera.x += panSpeed;
    }
    if (this.keys.has('arrowup') || this.keys.has('w') || this.mouse.y < edge) {
      this.camera.y -= panSpeed;
    }
    if (this.keys.has('arrowdown') || this.keys.has('s') || this.mouse.y > this.canvas.height - edge) {
      this.camera.y += panSpeed;
    }
  }
}
