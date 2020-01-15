'use babel'

export class FeatureBase {
  isLocked () {
    return this._locked === true
  }

  lock (func) {
    if (!this.isLocked()) {
      this._locked = true

      func()

      this._locked = false
    }
  }
}
