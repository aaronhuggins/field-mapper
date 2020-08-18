# field-mapper

A field-mapping engine for managing field-to-property relationships and mapping objects. Provides a simple dictionary based on `Map` to take an array of field-map-like objects, and supports output of modified field-maps as an Azure-like table row. Full support for Typescript included.

## Usage

Install via [NPM](https://www.npmjs.com/package/field-mapper) and require in your project. There is also an ESM export, for use with browser or Deno.

```js
const { FieldMapper } = require('field-mapper')
const fieldData = [{ fieldName: 'foo', propertyName: 'bar', objectName: 'FooBar' }]
const myMapper = new FieldMapper(fieldData)
const unmappedObj = { foo: 'hello, world!' }
const mappedObj = Object.create(null)

for (const [key, value] of Object.entries(unmappedObj)) {
  mappedObj[myMapper.getObjectMap('FooBar').getPropertyName(key)] = value
}

console.log(mappedObj.bar) // Expected output: hello, world!
```
