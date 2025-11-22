import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import from the correct path
import { createTables } from '../src/lib/db/init.js'

async function initializeDatabase() {
  try {
    // Debug: Check if env vars are loaded
    console.log('📋 Checking environment variables:')
    console.log('DATABASE_HOST:', process.env.DATABASE_HOST)
    console.log('DATABASE_USER:', process.env.DATABASE_USER)
    console.log('DATABASE_NAME:', process.env.DATABASE_NAME)
    console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '***' : 'MISSING')

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
