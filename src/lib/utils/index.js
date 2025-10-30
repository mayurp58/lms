// Currency formatting
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0'
  }
  
  const number = parseFloat(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number)
}

// Date formatting - FIXED with proper error handling
export function formatDate(date, options = {}) {
  if (!date) return 'N/A'
  
  try {
    // Handle different date formats
    let dateObj
    
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      // Handle MySQL datetime format (YYYY-MM-DD HH:mm:ss)
      // Handle ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
      dateObj = new Date(date)
    } else if (typeof date === 'number') {
      // Handle timestamp
      dateObj = new Date(date)
    } else {
      return 'Invalid Date'
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.log('Invalid date value:', date)
      return 'Invalid Date'
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    }
    
    return new Intl.DateTimeFormat('en-IN', { 
      ...defaultOptions, 
      ...options 
    }).format(dateObj)
    
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', date)
    return 'Invalid Date'
  }
}

// DateTime formatting - FIXED with proper error handling
export function formatDateTime(date, options = {}) {
  if (!date) return 'N/A'
  
  try {
    let dateObj
    
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      return 'Invalid Date'
    }
    
    if (isNaN(dateObj.getTime())) {
      console.log('Invalid datetime value:', date)
      return 'Invalid Date'
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }
    
    return new Intl.DateTimeFormat('en-IN', { 
      ...defaultOptions, 
      ...options 
    }).format(dateObj)
    
  } catch (error) {
    console.error('DateTime formatting error:', error, 'for date:', date)
    return 'Invalid Date'
  }
}

// Percentage formatting
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  
  const number = parseFloat(value)
  return `${number.toFixed(decimals)}%`
}

// Number formatting
export function formatNumber(number) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat('en-IN').format(parseFloat(number))
}

// Status color utility
export function getStatusColor(status) {
  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    under_verification: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    disbursed: 'bg-purple-100 text-purple-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    earned: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800'
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

// Calculate EMI
export function calculateEMI(amount, rate, tenure) {
  if (!amount || !rate || !tenure) return 0
  
  const principal = parseFloat(amount)
  const monthlyRate = parseFloat(rate) / (12 * 100)
  const months = parseInt(tenure)
  
  if (monthlyRate === 0) {
    return Math.round(principal / months)
  }
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1)
  
  return Math.round(emi)
}

// Generate unique ID
export function generateUniqueId(prefix = '') {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Generate Agent Code
export function generateAgentCode(firstName = '', lastName = '', suffix = '') {
  // Create initials from first and last name
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : 'X'
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : 'X'
  
  // Generate random number part
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  
  // Generate timestamp-based suffix
  const timestamp = Date.now().toString().slice(-4)
  
  // Combine parts: AA1234 or AA1234XX format
  const basePart = `${firstInitial}${lastInitial}${randomNum}`
  
  if (suffix) {
    return `${basePart}${suffix.toUpperCase()}`
  }
  
  return basePart
}

// Alternative agent code generation with more customization
export function generateCustomAgentCode(options = {}) {
  const {
    prefix = '',
    firstName = '',
    lastName = '',
    includeTimestamp = false,
    length = 6
  } = options
  
  let code = prefix.toUpperCase()
  
  // Add initials if names provided
  if (firstName && lastName) {
    code += firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase()
  }
  
  // Add random numbers to reach desired length
  const remainingLength = Math.max(0, length - code.length)
  if (remainingLength > 0) {
    const maxNumber = Math.pow(10, remainingLength) - 1
    const randomNumber = Math.floor(Math.random() * maxNumber).toString().padStart(remainingLength, '0')
    code += randomNumber
  }
  
  // Add timestamp suffix if requested
  if (includeTimestamp) {
    code += Date.now().toString().slice(-2)
  }
  
  return code
}

// Check if agent code is unique (for database validation)
export function isValidAgentCodeFormat(agentCode) {
  // Agent code should be 6-8 characters: 2 letters + 4-6 numbers
  const agentCodeRegex = /^[A-Z]{2}[0-9]{4,6}$/
  return agentCodeRegex.test(agentCode)
}

// VALIDATION FUNCTIONS - NEW ADDITIONS

// Validate email
export function validateEmail(email) {
  if (!email) return { isValid: false, error: 'Email is required' }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email.trim())
  
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid email address'
  }
}

// Legacy function for backwards compatibility
export function isValidEmail(email) {
  const result = validateEmail(email)
  return result.isValid
}

// Validate phone number (Indian format)
export function validatePhone(phone) {
  if (!phone) return { isValid: false, error: 'Phone number is required' }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Check if it's 10 digits and starts with 6-9
  const phoneRegex = /^[6-9]\d{9}$/
  const isValid = phoneRegex.test(cleanPhone)
  
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)',
    cleanValue: cleanPhone
  }
}

// Legacy function for backwards compatibility
export function isValidPhone(phone) {
  const result = validatePhone(phone)
  return result.isValid
}

// Validate PAN number
export function validatePAN(pan) {
  if (!pan) return { isValid: false, error: 'PAN number is required' }
  
  const cleanPAN = pan.trim().toUpperCase()
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  const isValid = panRegex.test(cleanPAN)
  
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    cleanValue: cleanPAN
  }
}

// Legacy function for backwards compatibility
export function isValidPAN(pan) {
  const result = validatePAN(pan)
  return result.isValid
}

// Validate Aadhar number
export function validateAadhar(aadhar) {
  if (!aadhar) return { isValid: false, error: 'Aadhar number is required' }
  
  // Remove all non-digit characters
  const cleanAadhar = aadhar.replace(/\D/g, '')
  
  // Check if it's 12 digits and follows Aadhar format
  const aadharRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/
  const isValid = aadharRegex.test(cleanAadhar)
  
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid 12-digit Aadhar number',
    cleanValue: cleanAadhar
  }
}

// Legacy function for backwards compatibility
export function isValidAadhar(aadhar) {
  const result = validateAadhar(aadhar)
  return result.isValid
}

// Validate name (first name, last name)
export function validateName(name, fieldName = 'Name') {
  if (!name) return { isValid: false, error: `${fieldName} is required` }
  
  const trimmedName = name.trim()
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` }
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` }
  }
  
  // Allow letters, spaces, dots, and apostrophes
  const nameRegex = /^[a-zA-Z\s.']+$/
  const isValid = nameRegex.test(trimmedName)
  
  return {
    isValid,
    error: isValid ? null : `${fieldName} can only contain letters, spaces, dots, and apostrophes`,
    cleanValue: trimmedName
  }
}

// Validate amount (loan amount, income, etc.)
export function validateAmount(amount, fieldName = 'Amount', min = 0, max = 10000000) {
  if (!amount) return { isValid: false, error: `${fieldName} is required` }
  
  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }
  
  if (numAmount < min) {
    return { isValid: false, error: `${fieldName} must be at least ₹${min.toLocaleString()}` }
  }
  
  if (numAmount > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ₹${max.toLocaleString()}` }
  }
  
  return {
    isValid: true,
    error: null,
    cleanValue: numAmount
  }
}

// Validate pincode (Indian postal code)
export function validatePincode(pincode) {
  if (!pincode) return { isValid: false, error: 'Pincode is required' }
  
  const cleanPincode = pincode.replace(/\D/g, '')
  const pincodeRegex = /^[1-9][0-9]{5}$/
  const isValid = pincodeRegex.test(cleanPincode)
  
  return {
    isValid,
    error: isValid ? null : 'Please enter a valid 6-digit Indian pincode',
    cleanValue: cleanPincode
  }
}

// Validate age
export function validateAge(age, min = 18, max = 80) {
  if (!age) return { isValid: false, error: 'Age is required' }
  
  const numAge = parseInt(age)
  
  if (isNaN(numAge)) {
    return { isValid: false, error: 'Age must be a valid number' }
  }
  
  if (numAge < min) {
    return { isValid: false, error: `Age must be at least ${min} years` }
  }
  
  if (numAge > max) {
    return { isValid: false, error: `Age cannot exceed ${max} years` }
  }
  
  return {
    isValid: true,
    error: null,
    cleanValue: numAge
  }
}

// Validate date of birth
export function validateDateOfBirth(dob) {
  if (!dob) return { isValid: false, error: 'Date of birth is required' }
  
  const dobDate = new Date(dob)
  const today = new Date()
  const age = Math.floor((today - dobDate) / (365.25 * 24 * 60 * 60 * 1000))
  
  if (isNaN(dobDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid date of birth' }
  }
  
  if (dobDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' }
  }
  
  if (age < 18) {
    return { isValid: false, error: 'You must be at least 18 years old' }
  }
  
  if (age > 80) {
    return { isValid: false, error: 'Age cannot exceed 80 years' }
  }
  
  return {
    isValid: true,
    error: null,
    cleanValue: dob,
    calculatedAge: age
  }
}

// Validate required field
export function validateRequired(value, fieldName = 'Field') {
  const trimmedValue = typeof value === 'string' ? value.trim() : value
  const isValid = trimmedValue !== null && trimmedValue !== undefined && trimmedValue !== ''
  
  return {
    isValid,
    error: isValid ? null : `${fieldName} is required`,
    cleanValue: trimmedValue
  }
}

// Validate form (multiple fields at once)
export function validateForm(fields, validationRules) {
  const errors = {}
  const cleanValues = {}
  let isFormValid = true
  
  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName]
    const fieldValue = fields[fieldName]
    
    for (const rule of rules) {
      const result = rule(fieldValue)
      if (!result.isValid) {
        errors[fieldName] = result.error
        isFormValid = false
        break
      } else if (result.cleanValue !== undefined) {
        cleanValues[fieldName] = result.cleanValue
      }
    }
  })
  
  return {
    isValid: isFormValid,
    errors,
    cleanValues
  }
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Truncate text
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Get time ago
export function getTimeAgo(date) {
  if (!date) return 'Unknown'
  
  try {
    const now = new Date()
    const past = new Date(date)
    
    if (isNaN(past.getTime())) {
      return 'Invalid date'
    }
    
    const diffInSeconds = Math.floor((now - past) / 1000)
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ]
    
    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds)
      if (count > 0) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`
      }
    }
    
    return 'Just now'
  } catch (error) {
    console.error('Time ago error:', error)
    return 'Unknown'
  }
}

// Capitalize first letter
export function capitalizeFirst(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Convert camelCase to Title Case
export function camelToTitle(str) {
  if (!str) return ''
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Generate random color
export function getRandomColor() {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Check if object is empty
export function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Format Indian currency in words
export function numberToWords(amount) {
  if (!amount || isNaN(amount)) return 'Zero'
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertHundreds(num) {
    let result = ''
    if (num > 99) {
      result += ones[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num > 19) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    } else if (num > 9) {
      result += teens[num - 10] + ' '
      return result
    }
    if (num > 0) {
      result += ones[num] + ' '
    }
    return result
  }
  
  const crores = Math.floor(amount / 10000000)
  const lakhs = Math.floor((amount % 10000000) / 100000)
  const thousands = Math.floor((amount % 100000) / 1000)
  const hundreds = amount % 1000
  
  let result = ''
  if (crores > 0) result += convertHundreds(crores) + 'Crore '
  if (lakhs > 0) result += convertHundreds(lakhs) + 'Lakh '
  if (thousands > 0) result += convertHundreds(thousands) + 'Thousand '
  if (hundreds > 0) result += convertHundreds(hundreds)
  
  return result.trim() || 'Zero'
}

// Safe date formatting - handles various date formats
export function safeFormatDate(date) {
  if (!date) return 'N/A'
  
  try {
    // Handle MySQL DATETIME format specifically
    if (typeof date === 'string') {
      // MySQL datetime: YYYY-MM-DD HH:mm:ss
      if (date.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        const [datePart] = date.split(' ')
        const dateObj = new Date(datePart + 'T00:00:00')
        if (!isNaN(dateObj.getTime())) {
          return formatDate(dateObj)
        }
      }
    }
    
    return formatDate(date)
  } catch (error) {
    console.error('Safe date format error:', error, date)
    return 'Invalid Date'
  }
}

// Helper function to safely format numbers
export function safeNumber(value, defaultValue = 0) {
  const num = parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

export function safeToFixed(value, decimals = 2, defaultValue = 0) {
  const num = parseFloat(value)
  return isNaN(num) ? defaultValue.toFixed(decimals) : num.toFixed(decimals)
}

export function safePercentage(value, decimals = 1) {
  const num = parseFloat(value)
  return isNaN(num) ? '0%' : `${num.toFixed(decimals)}%`
}

export function generateApplicationNumber(prefix = 'LMS', category = '', connectorCode = '') {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const day = String(new Date().getDate()).padStart(2, '0')
  
  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  
  // Create base application number: LMS20241030-1234
  let appNumber = `${prefix}${year}${month}${day}-${randomNum}`
  
  // Add category prefix if provided (first 2 letters)
  if (category) {
    const categoryCode = category.substring(0, 2).toUpperCase()
    appNumber = `${prefix}${categoryCode}${year}${month}${day}-${randomNum}`
  }
  
  // Add connector code suffix if provided
  if (connectorCode) {
    appNumber += `-${connectorCode.substring(0, 4).toUpperCase()}`
  }
  
  return appNumber
}