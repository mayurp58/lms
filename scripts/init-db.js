import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import from the correct path
import { createTables } from '../src/lib/db/init.js'

async function initializeDatabase() {
  try {
    //console.log('🚀 Initializing database...')
    await createTables()
    //console.log('✅ Database initialized successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    process.exit(1)
  }
}

initializeDatabase()
