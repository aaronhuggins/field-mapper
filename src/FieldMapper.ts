import type { FieldMapLike } from './FieldMap'
import { FieldMap } from './FieldMap'

export class FieldMapper {
  constructor (fieldMaps: Array<FieldMapLike<any>> = []) {
    this.fields = new Map()
    this.mappers = new Map()
    this._fieldPaths = new Map()
    this._propertyPaths = new Map()

    for (const fieldMap of fieldMaps) {
      this.setFieldMap(fieldMap)
    }

    this.isChild = false
  }

  fields: Map<string, FieldMap<any>>
  mappers: Map<string, FieldMapper>
  isChild: boolean
  private _fieldPaths: Map<string, Set<string>>
  private _propertyPaths: Map<string, Set<string>>

  /**
   * @param {string} propertyName
   * @returns {string}
   */
  getFieldName (propertyName: string) {
    const fieldMap = this.fields.get(propertyName)

    if (typeof fieldMap === 'object') {
      return fieldMap.fieldName
    }
  }

  /**
   * @param {string} fieldName
   * @returns {string}
   */
  getPropertyName (fieldName : string) {
    const fieldMap = this.fields.get(fieldName)

    if (typeof fieldMap === 'object') {
      return fieldMap.propertyName
    }
  }

  /** Get the field map instance for a field name or property name.
   * @param {string} fieldNameOrPropertyName
   * @returns {FieldMap}
   */
  getFieldMap (fieldNameOrPropertyName: string) {
    return this.fields.get(fieldNameOrPropertyName)
  }

  /** Get a field mapper instance for a specific object name.
   * @param {string} objectName
   * @returns {FieldMapper}
   */
  getObjectMap (objectName: string) {
    return this.mappers.get(objectName)
  }

  /** Get a set of field paths for a specific object name.
   * @param {string} objectName
   * @returns {FieldMapper}
   */
  getFieldPaths (objectName: string): Set<string> {
    const fieldPaths = this._fieldPaths.get(objectName)

    if (typeof fieldPaths === 'object') {
      return fieldPaths
    }

    return new Set()
  }

  /** Get a set of property paths for a specific object name.
   * @param {string} objectName
   * @returns {FieldMapper}
   */
  getPropertyPaths (objectName: string): Set<string> {
    const propertyPaths = this._propertyPaths.get(objectName)

    if (typeof propertyPaths === 'object') {
      return propertyPaths
    }

    return new Set()
  }

  /** Method for creating and propagating field maps. */
  setFieldMap (object: FieldMapLike<any> | FieldMap<any>) {
    // Short-circuit for child field maps.
    if (object instanceof FieldMap) {
      const fieldMap: {
        _fieldName: string
        _propertyName: string
        _objectName: string
      } = object as any

      this.fields.set(fieldMap._fieldName, object)
      this.fields.set(fieldMap._propertyName, object)

      if (fieldMap._fieldName.includes('.')) {
        const fieldPathSet = this._fieldPaths.get(fieldMap._objectName) || new Set()

        fieldPathSet.add(fieldMap._fieldName)

        this._fieldPaths.set(fieldMap._objectName, fieldPathSet)
      }

      if (fieldMap._propertyName.includes('.')) {
        const propertyPathSet = this._propertyPaths.get(fieldMap._objectName) || new Set()

        propertyPathSet.add(fieldMap._propertyName)

        this._propertyPaths.set(fieldMap._objectName, propertyPathSet)
      }

      return
    } else {
      if (this.isChild) return
    }

    const { fieldName, propertyName, objectName } = object
    const field = new FieldMap(object)

    this.fields.set(fieldName, field)
    this.fields.set(propertyName, field)

    if (fieldName.includes('.')) {
      const fieldPathSet = this._fieldPaths.get(objectName) || new Set()

      fieldPathSet.add(fieldName)

      this._fieldPaths.set(objectName, fieldPathSet)
    }

    if (propertyName.includes('.')) {
      const propertyPathSet = this._propertyPaths.get(objectName) || new Set()

      propertyPathSet.add(propertyName)

      this._propertyPaths.set(objectName, propertyPathSet)
    }

    let mapper = this.mappers.get(objectName)

    if (!(mapper instanceof FieldMapper)) {
      mapper = new FieldMapper()
      mapper.isChild = true

      this.mappers.set(objectName, mapper)
    }

    mapper.setFieldMap(field)
  }

  /** Get all field maps as plain objects. */
  toJSON (): Array<FieldMapLike<any>> {
    const json: Array<FieldMapLike<any>> = []

    if (this.isChild) {
      // Create a set so that there are no duplicate fieldMap references.
      const fieldMaps = new Set(this.fields.values())

      for (const fieldMap of fieldMaps) {
        json.push(fieldMap.toJSON())
      }
    } else {
      // Parent should get tablerows from children.
      const objectMaps = new Set(this.mappers.values())

      for (const objectMap of objectMaps) {
        json.push(...objectMap.toJSON())
      }
    }

    return json
  }

  /** Get all modified field maps to table rows.
   * @param {boolean} [allMaps=false] - Optionally get all field maps.
   * @returns {Array<{ PartitionKey: string, RowKey: string, fieldName: string, propertyName: string, objectName: string, active: boolean }>}
   */
  toTableRows (allMaps: boolean = false): Array<FieldMapLike<any>> {
    const tableRows: Array<FieldMapLike<any>> = []

    if (this.isChild) {
      // Create a set so that there are no duplicate fieldMap references.
      const fieldMaps = new Set(this.fields.values())

      for (const fieldMap of fieldMaps) {
        if (fieldMap.modified || allMaps) {
          // Only create a table row if the data was modified.
          tableRows.push(fieldMap.toTableRow())
        }
      }
    } else {
      // Parent should get tablerows from children.
      const objectMaps = new Set(this.mappers.values())

      for (const objectMap of objectMaps) {
        tableRows.push(...objectMap.toTableRows(allMaps))
      }
    }

    return tableRows
  }
}
