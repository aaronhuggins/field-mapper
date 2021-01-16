export interface FieldMapLike<T extends string = any> {
  fieldName: string
  propertyName: string
  objectName: T
  active?: boolean
  [key: string]: any
}

export class FieldMap<T extends string = any> implements FieldMapLike<T> {
  constructor (object: FieldMapLike<T>) {
    const {
      fieldName,
      propertyName,
      objectName,
      active
    } = object
    this._fieldName = fieldName
    this._propertyName = propertyName
    this._objectName = objectName
    this._active = active || false
    this.modified = false

    return new Proxy(this, {
      get: function get (target, property) {
        if (property === 'toJSON' || property === 'toTableRow') {
          const toObject = Reflect.get(target, property)

          return function (...args: any[]) {
            const result = toObject.call(target, ...args)

            return {
              ...object,
              ...result
            }
          }
        }

        return property in target
          ? Reflect.get(target, property)
          : object[property as string]
      },
      set: function set (target, property, value) {
        if (property in target) {
          return Reflect.set(target, property, value)
        } else {
          if (property in object && object[property as string] !== value) {
            Reflect.set(target, 'modified', true)
          }

          object[property as string] = value
        }

        return true
      }
    })
  }

  private _fieldName: string
  private _propertyName: string
  private _objectName: T
  private _active: boolean
  modified: boolean
  [key: string]: any

  /** @param {boolean} _active */
  set active (_active: boolean) {
    if (this._active !== _active) {
      this.modified = true
      this._active = _active
    }
  }

  /** @param {string} _fieldName */
  set fieldName (_fieldName: string) {
    if (this._fieldName !== _fieldName) {
      this.modified = true
      this._fieldName = _fieldName
    }
  }

  /** @param {string} _propertyName */
  set propertyName (_propertyName: string) {
    if (this._propertyName !== _propertyName) {
      this.modified = true
      this._propertyName = _propertyName
    }
  }

  /** Immutable property objectName.
   * @param {string} _objectName
   */
  set objectName (_objectName: T) {
    // Makes objectName immutable.
  }

  get active (): boolean {
    return this._active
  }

  get fieldName (): string {
    this.active = true

    return this._fieldName
  }

  get propertyName (): string {
    this.active = true

    return this._propertyName
  }

  get objectName (): T {
    this.active = true

    return this._objectName
  }

  toJSON (): FieldMapLike<T> {
    return {
      fieldName: this._fieldName,
      propertyName: this._propertyName,
      objectName: this._objectName,
      active: this._active
    }
  }

  toTableRow (): FieldMapLike<T> {
    return {
      PartitionKey: this._objectName,
      RowKey: this._fieldName + '::' + this._propertyName,
      ...this.toJSON()
    }
  }
}
