'use client'

import { useState, useEffect } from 'react'
import { validateAadhar, validatePAN, validatePhone, validateEmail } from '@/lib/utils'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
]

export default function CustomerForm({ customer = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadhar_number: '',
    pan_number: ''
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // In the CustomerForm component, update the date handling:

useEffect(() => {
    if (customer) {
      // Format date for input field (input expects YYYY-MM-DD format)
      let formattedDate = ''
      if (customer.date_of_birth) {
        try {
          const date = new Date(customer.date_of_birth)
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0]
          }
        } catch (error) {
          console.error('Date formatting error:', error)
        }
      }
  
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        date_of_birth: formattedDate,
        gender: customer.gender || '',
        marital_status: customer.marital_status || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        aadhar_number: customer.aadhar_number || '',
        pan_number: customer.pan_number || ''
      })
    }
  }, [customer])
  

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Format specific fields
    let formattedValue = value
    
    if (name === 'aadhar_number') {
      // Remove spaces and limit to 12 digits
      formattedValue = value.replace(/\s/g, '').slice(0, 12)
    } else if (name === 'pan_number') {
      // Convert to uppercase and limit to 10 characters
      formattedValue = value.toUpperCase().slice(0, 10)
    } else if (name === 'phone') {
      // Remove non-digits and limit to 10
      formattedValue = value.replace(/\D/g, '').slice(0, 10)
    } else if (name === 'pincode') {
      // Remove non-digits and limit to 6
      formattedValue = value.replace(/\D/g, '').slice(0, 6)
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required'
    if (!formData.aadhar_number.trim()) newErrors.aadhar_number = 'Aadhar number is required'
    if (!formData.pan_number.trim()) newErrors.pan_number = 'PAN number is required'

    // Format validations
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }
    
    if (formData.aadhar_number && !validateAadhar(formData.aadhar_number)) {
      newErrors.aadhar_number = 'Invalid Aadhar number'
    }
    
    if (formData.pan_number && !validatePAN(formData.pan_number)) {
      newErrors.pan_number = 'Invalid PAN number'
    }
    
    if (formData.pincode && formData.pincode.length !== 6) {
      newErrors.pincode = 'Pincode must be 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        setErrors({ general: error.message })
      }
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              placeholder='First Name'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.first_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              placeholder='Last Name'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.last_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder='Email'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="10-digit mobile number"
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 text-gray-900 py-2 border ${errors.date_of_birth ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.gender ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Marital Status</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.marital_status ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
            {errors.marital_status && <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>}
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              placeholder='Address'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder='City'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.city ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.state ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="6-digit pincode"
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.pincode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Identity Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Identity Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Aadhar Number *</label>
            <input
              type="text"
              name="aadhar_number"
              value={formData.aadhar_number}
              onChange={handleChange}
              required
              placeholder="12-digit Aadhar number"
              disabled={!!customer} // Disable for existing customers
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.aadhar_number ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${customer ? 'bg-gray-50' : ''}`}
            />
            {errors.aadhar_number && <p className="mt-1 text-sm text-red-600">{errors.aadhar_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PAN Number *</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              required
              placeholder="10-character PAN number"
              disabled={!!customer} // Disable for existing customers
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.pan_number ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${customer ? 'bg-gray-50' : ''}`}
            />
            {errors.pan_number && <p className="mt-1 text-sm text-red-600">{errors.pan_number}</p>}
          </div>
        </div>
        {customer && (
          <p className="mt-2 text-sm text-gray-500">
            Aadhar and PAN numbers cannot be changed after customer creation.
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Add Customer')}
        </button>
      </div>
    </form>
  )
}
