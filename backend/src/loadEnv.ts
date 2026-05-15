import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
config({ path: resolve(backendRoot, '.env') })
