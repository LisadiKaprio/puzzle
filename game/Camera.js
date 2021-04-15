export default class Camera {
  constructor(canvas) {
    this.x = 0
    this.y = 0

    // TODO: when canvas resizes, this should
    //       syncronize with the cam
    this.width = canvas.width
    this.height = canvas.height

    this.zoom = 1
    this.minZoom = .1
    this.maxZoom = 6
    this.zoomStep = .05
  }

  rect() {
    return {
      x: -this.x,
      y: -this.y,
      w: this.width / this.zoom,
      h: this.height / this.zoom,
    }
  }

  move(x, y) {
    this.x += x / this.zoom
    this.y += y / this.zoom
  }

  setZoom(newzoom, viewportCoordCenter) {
    const zoom = Math.min(Math.max(newzoom, this.minZoom), this.maxZoom)
    if (zoom == this.zoom) {
      return false
    }

    const zoomToCoord = viewportCoordCenter || {
      x: this.width / 2,
      y: this.height / 2
    }
    const zoomFactor = (1 / this.zoom) - (1 / zoom)

    this.x -= Math.round(zoomToCoord.x * zoomFactor)
    this.y -= Math.round(zoomToCoord.y * zoomFactor)

    this.zoom = zoom

    return true
  }

  zoomOut(viewportCoordCenter) {
    return this.setZoom(
      this.zoom - this.zoomStep * this.zoom,
      viewportCoordCenter
    )
  }

  zoomIn(viewportCoordCenter) {
    return this.setZoom(
      this.zoom + this.zoomStep * this.zoom,
      viewportCoordCenter
    )
  }

  /**
   * Translate a coordinate in the viewport to a
   * coordinate in the world, rounded
   * @param {x, y} viewportCoord
   */
  viewportToWorld(viewportCoord) {
    const worldCoord = this.viewportToWorldRaw(viewportCoord)
    return {
      x: Math.round(worldCoord.x),
      y: Math.round(worldCoord.y),
    }
  }

  /**
   * Translate a coordinate in the viewport to a
   * coordinate in the world, not rounded
   * @param {x, y} viewportCoord
   */
  viewportToWorldRaw(viewportCoord) {
    return {
      x: (viewportCoord.x / this.zoom) - this.x,
      y: (viewportCoord.y / this.zoom) - this.y,
    }
  }

  /**
   * Translate a coordinate in the world to a
   * coordinate in the viewport, rounded
   * @param {x, y} worldCoord
   */
  worldToViewport(worldCoord) {
    const viewportCoord = this.worldToViewportRaw(worldCoord)
    return {
      x: Math.round(viewportCoord.x),
      y: Math.round(viewportCoord.y),
    }
  }

  /**
   * Translate a coordinate in the world to a
   * coordinate in the viewport, not rounded
   * @param {x, y} worldCoord
   */
  worldToViewportRaw(worldCoord) {
    return {
      x: (worldCoord.x + this.x) * this.zoom,
      y: (worldCoord.y + this.y) * this.zoom,
    }
  }

  /**
   * Translate a 2d dimension (width/height) in the world to
   * one in the viewport, rounded
   * @param {w, h} worldDim
   */
  worldDimToViewport(worldDim) {
    const viewportDim = this.worldDimToViewportRaw(worldDim)
    return {
      w: Math.round(viewportDim.w),
      h: Math.round(viewportDim.h),
    }
  }


  /**
   * Translate a 2d dimension (width/height) in the world to
   * one in the viewport, not rounded
   * @param {w, h} worldDim
   */
  worldDimToViewportRaw(worldDim) {
    return {
      w: worldDim.w * this.zoom,
      h: worldDim.h * this.zoom,
    }
  }
}
