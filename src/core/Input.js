export class Input {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this.mouseDown = false;
    this.dragStart = null;
    this.cameraDragStart = null;
    this.clicked = null;
    this.rightClicked = null;
    this.keys = new Set();
    this.keysJustPressed = new Set();

    // Touch state
    this.isTouchDevice = false;
    this.touchPanning = false;
    this.touchStartTime = 0;
    this.touchStartPos = null;
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;
    this.touchMoved = false;

    this._bindMouse();
    this._bindTouch();
    this._bindKeyboard();
  }

  _bindMouse() {
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
        this.mouseDown = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.cameraDragStart = { x: this.camera.x, y: this.camera.y };
      }
    });

    c.addEventListener('mouseup', () => {
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
  }

  _bindTouch() {
    const c = this.canvas;
    const TAP_THRESHOLD = 12;   // max px movement to still count as tap
    const TAP_TIME = 300;       // max ms for a tap

    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isTouchDevice = true;

      if (e.touches.length === 1) {
        const t = e.touches[0];
        this.touchStartTime = performance.now();
        this.touchStartPos = { x: t.clientX, y: t.clientY };
        this.touchMoved = false;
        this.touchPanning = true;
        this.dragStart = { x: t.clientX, y: t.clientY };
        this.cameraDragStart = { x: this.camera.x, y: this.camera.y };
        this.mouse.x = t.clientX;
        this.mouse.y = t.clientY;
        this._updateWorldPos();
      } else if (e.touches.length === 2) {
        // Start pinch
        this.touchPanning = false;
        this.pinchStartDist = this._touchDist(e.touches[0], e.touches[1]);
        this.pinchStartZoom = this.camera.zoom;
      }
    }, { passive: false });

    c.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && this.touchPanning && this.dragStart && this.cameraDragStart) {
        const t = e.touches[0];
        const dx = t.clientX - this.dragStart.x;
        const dy = t.clientY - this.dragStart.y;
        this.camera.x = this.cameraDragStart.x - dx / this.camera.zoom;
        this.camera.y = this.cameraDragStart.y - dy / this.camera.zoom;
        this.mouse.x = t.clientX;
        this.mouse.y = t.clientY;

        // Check if moved enough to cancel tap
        if (this.touchStartPos) {
          const mdx = t.clientX - this.touchStartPos.x;
          const mdy = t.clientY - this.touchStartPos.y;
          if (Math.sqrt(mdx * mdx + mdy * mdy) > TAP_THRESHOLD) {
            this.touchMoved = true;
          }
        }
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const dist = this._touchDist(e.touches[0], e.touches[1]);
        const scale = dist / this.pinchStartDist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.pinchStartZoom * scale));
        const oldZoom = this.camera.zoom;
        if (newZoom !== oldZoom) {
          // Zoom toward pinch center
          const cx = this.canvas.width / 2;
          const cy = this.canvas.height / 2;
          const worldBefore = this.camera.screenToWorld(midX, midY);
          this.camera.zoom = newZoom;
          this.camera.x = worldBefore.x - (midX - cx) / this.camera.zoom;
          this.camera.y = worldBefore.y - (midY - cy) / this.camera.zoom;
        }
        this.touchMoved = true;
      }
    }, { passive: false });

    c.addEventListener('touchend', (e) => {
      e.preventDefault();

      if (e.touches.length === 0) {
        const elapsed = performance.now() - this.touchStartTime;

        // Tap detection: short press + didn't move much
        if (!this.touchMoved && elapsed < TAP_TIME && this.touchStartPos) {
          this.mouse.x = this.touchStartPos.x;
          this.mouse.y = this.touchStartPos.y;
          this._updateWorldPos();
          this.clicked = {
            x: this.mouse.worldX,
            y: this.mouse.worldY,
            screenX: this.touchStartPos.x,
            screenY: this.touchStartPos.y,
          };
        }

        this.touchPanning = false;
        this.dragStart = null;
        this.cameraDragStart = null;
        this.touchStartPos = null;
      } else if (e.touches.length === 1) {
        // Went from 2 fingers back to 1 — restart pan from current finger
        const t = e.touches[0];
        this.touchPanning = true;
        this.dragStart = { x: t.clientX, y: t.clientY };
        this.cameraDragStart = { x: this.camera.x, y: this.camera.y };
        this.touchMoved = true; // don't fire tap
      }
    }, { passive: false });

    c.addEventListener('touchcancel', () => {
      this.touchPanning = false;
      this.dragStart = null;
      this.cameraDragStart = null;
      this.touchStartPos = null;
    });
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      this.keysJustPressed.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  _touchDist(a, b) {
    const dx = b.clientX - a.clientX;
    const dy = b.clientY - a.clientY;
    return Math.sqrt(dx * dx + dy * dy);
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
    // Keyboard panning (skip edge-scroll on touch devices — no cursor)
    const panSpeed = 4 / this.camera.zoom;

    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      this.camera.x -= panSpeed;
    }
    if (this.keys.has('arrowright') || this.keys.has('d')) {
      this.camera.x += panSpeed;
    }
    if (this.keys.has('arrowup') || this.keys.has('w')) {
      this.camera.y -= panSpeed;
    }
    if (this.keys.has('arrowdown') || this.keys.has('s')) {
      this.camera.y += panSpeed;
    }

    // Edge scrolling only on desktop
    if (!this.isTouchDevice) {
      const edge = 20;
      if (this.mouse.x < edge) this.camera.x -= panSpeed;
      if (this.mouse.x > this.canvas.width - edge) this.camera.x += panSpeed;
      if (this.mouse.y < edge) this.camera.y -= panSpeed;
      if (this.mouse.y > this.canvas.height - edge) this.camera.y += panSpeed;
    }
  }
}
