import type { FieldMapLike } from './FieldMap'
import { FieldMap } from './FieldMap'

export class FieldMapper<T> {
  constructor (tableRows: Array<FieldMapLike<T>> = []) {
    this.fields = new Map()
    this.mappers = new Map()

    for (const tableRow of tableRows) {
      this.setFieldMap(tableRow)
    }

    this.isChild = false
  }

  fields: Map<string, FieldMap<T>>
  mappers: Map<string, FieldMapper<T>>
  isChild: boolean

  /**
   * @param {string} propertyName
   * @returns {string}
   */
  getFieldName (propertyName: string) {
    return this.fields.get(propertyName).fieldName
  }

  /**
   * @param {string} fieldName
   * @returns {string}
   */
  getPropertyName (fieldName : string) {
    return this.fields.get(fieldName).propertyName
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

  /** Method for creating and propagating field maps. */
  setFieldMap (object: FieldMapLike<T> | FieldMap<T>) {
    // Short-circuit for child field maps.
    if (object instanceof FieldMap) {
      this.fields.set((object as any)._fieldName, object)
      this.fields.set((object as any)._propertyName, object)

      return
    } else {
      if (this.isChild) return
    }

    const { fieldName, propertyName, objectName } = object
    const field = new FieldMap(object)

    this.fields.set(fieldName, field)
    this.fields.set(propertyName, field)

    let mapper = this.mappers.get(objectName)

    if (!(mapper instanceof FieldMapper)) {
      mapper = new FieldMapper()
      mapper.isChild = true

      this.mappers.set(objectName, mapper)
    }

    mapper.setFieldMap(field)
  }

  /** Get all field maps as plain objects. */
  toJSON (): Array<FieldMapLike<T>> {
    const json: Array<FieldMapLike<T>> = []

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
  toTableRows (allMaps: boolean = false): Array<FieldMapLike<T>> {
    const tableRows: Array<FieldMapLike<T>> = []

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
