import * as shell from 'gulp-shell'
import { rmdirSync } from 'fs'

export const docs = shell.task(['typedoc'])
export const mocha = shell.task(['mocha'])
export const nyc = shell.task(['nyc mocha'])
export const tsc = shell.task(['tsc --sourceMap false', 'tsc --sourceMap false --module es2020 --outDir esm '])
export const clean = async () => {
  rmdirSync('./dist', { recursive: true })
  rmdirSync('./esm', { recursive: true })
}
