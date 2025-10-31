const fs = require('fs')
const path = require('path')

const directories = [
  'public/uploads',
  'public/uploads/documents',
  'public/uploads/profile-images',
  'public/uploads/temp'
]

function createDirectories() {
  //console.log('📁 Creating upload directories...')
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir)
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      //console.log(`✅ Created: ${dir}`)
    } else {
      //console.log(`ℹ️  Already exists: ${dir}`)
    }
  })

  // Create .gitkeep files to preserve empty directories
  directories.forEach(dir => {
    const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep')
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '')
      //console.log(`✅ Created .gitkeep in: ${dir}`)
    }
  })

  //console.log('🎉 Upload directories setup completed!')
}

// Run the setup
createDirectories()
