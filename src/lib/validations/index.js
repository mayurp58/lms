export function validateLoginData(data) {
    const errors = {}
  
    if (!data.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format'
    }
  
    if (!data.password) {
      errors.password = 'Password is required'
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  export function validateUserData(data, isUpdate = false) {
    const errors = {}
  
    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required'
    }
  
    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required'
    }
  
    if (!data.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format'
    }
  
    if (!isUpdate && !data.password) {
      errors.password = 'Password is required'
    } else if (data.password && data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
  
    if (!data.role) {
      errors.role = 'Role is required'
    } else if (!['super_admin', 'connector', 'operator', 'banker'].includes(data.role)) {
      errors.role = 'Invalid role selected'
    }
  
    if (data.phone && !/^[6-9]\d{9}$/.test(data.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Invalid phone number'
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  // Add this function if it doesn't exist
export function validateCustomerData(data, isUpdate = false) {
  const errors = {}

  if (!data.first_name?.trim()) {
    errors.first_name = 'First name is required'
  }

  if (!data.last_name?.trim()) {
    errors.last_name = 'Last name is required'
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format'
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\s+/g, ''))) {
    errors.phone = 'Invalid phone number'
  }

  if (!data.address?.trim()) {
    errors.address = 'Address is required'
  }

  if (!data.city?.trim()) {
    errors.city = 'City is required'
  }

  if (!data.state?.trim()) {
    errors.state = 'State is required'
  }

  if (!data.pincode?.trim()) {
    errors.pincode = 'Pincode is required'
  } else if (!/^[0-9]{6}$/.test(data.pincode)) {
    errors.pincode = 'Invalid pincode'
  }

  // These are only required for new customers, not updates
  if (!isUpdate) {
    if (!data.aadhar_number?.trim()) {
      errors.aadhar_number = 'Aadhar number is required'
    } else if (!/^[0-9]{12}$/.test(data.aadhar_number.replace(/\s+/g, ''))) {
      errors.aadhar_number = 'Invalid Aadhar number'
    }

    if (!data.pan_number?.trim()) {
      errors.pan_number = 'PAN number is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan_number.toUpperCase())) {
      errors.pan_number = 'Invalid PAN number'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

  
  // Add loan application validation
export function validateLoanApplicationData(data) {
  const errors = {}

  if (!data.customer_id) {
    errors.customer_id = 'Customer is required'
  }

  if (!data.loan_category_id) {
    errors.loan_category_id = 'Loan category is required'
  }

  if (!data.requested_amount || data.requested_amount <= 0) {
    errors.requested_amount = 'Valid loan amount is required'
  }

  if (!data.purpose?.trim()) {
    errors.purpose = 'Purpose of loan is required'
  }

  if (!data.vehicle_reg_number?.trim()) {
    errors.vehicle_reg_number = 'Vehicle registration number is required'
  }

  if (!data.vehicle_valuation?.trim()) {
    errors.vehicle_valuation = 'Vehicle valuation is required'
  }

  if (!data.vehicle_km?.trim()) {
    errors.vehicle_km = 'Kilometers driven is required'
  }
  if (!data.vehicle_owner?.trim()) {
    errors.vehicle_owner = 'Owner serial number is required'
  }

  if (!data.monthly_income || data.monthly_income <= 0) {
    errors.monthly_income = 'Valid monthly income is required'
  }

  if (!data.employment_type?.trim()) {
    errors.employment_type = 'Employment type is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

  