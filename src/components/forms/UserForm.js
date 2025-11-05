'use client'

import { useState, useEffect } from 'react'

export default function UserForm({ user = null, onSubmit, onCancel, banks = [] }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'connector',
    phone: '',
    address: '',
    branch:'',
    branch_code:'',
    city: '',
    state: '',
    pincode: '',
    status: 'active',
    // Connector fields
    connector_city: '',
    connector_area: '',
    commission_percentage: 2.5,
    // Banker fields
    bank_id: '',
    employee_id: '',
    designation: '',
    department: '',
    max_approval_limit: 1000000
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'connector',
        phone: user.phone || '',
        address: user.address || '',
        branch:user.branch || '',
        branch_code: user.branch_code || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        status: user.status || 'active',
        connector_city: user.connector_city || '',
        connector_area: user.connector_area || '',
        commission_percentage: user.commission_percentage || 2.5,
        bank_id: user.bank_id || '',
        employee_id: user.employee_id || '',
        designation: user.designation || '',
        department: user.department || '',
        max_approval_limit: user.max_approval_limit || 1000000
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

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

  const roleFields = {
    connector: ['connector_city', 'connector_area', 'commission_percentage'],
    banker: ['bank_id', 'employee_id', 'designation', 'department', 'max_approval_limit']
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!user} // Disable email editing for existing users
            placeholder='Email'
            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${user ? 'bg-gray-50' : ''}`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password {user ? '(Leave blank to keep current)' : '*'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
            placeholder='Password'
            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            disabled={!!user} // Disable role editing for existing users
            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.role ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${user ? 'bg-gray-50' : ''}`}
          >
            <option value="">Select Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="connector">Connector</option>
            <option value="operator">Operator</option>
            <option value="banker">Banker</option>
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder='Phone'
            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
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
              required
              onChange={handleChange}
              placeholder='City'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.city ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State *</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              required
              onChange={handleChange}
              placeholder='State'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.state ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
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
              placeholder='Pincode'
              className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.pincode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
          </div>
        </div>
      </div>

      {/* Role-specific fields */}
      {formData.role === 'connector' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Connector Information</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Working City *</label>
              <input
                type="text"
                name="connector_city"
                value={formData.connector_city}
                onChange={handleChange}
                required
                placeholder='City'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.connector_city ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.connector_city && <p className="mt-1 text-sm text-red-600">{errors.connector_city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Working Area *</label>
              <input
                type="text"
                name="connector_area"
                value={formData.connector_area}
                onChange={handleChange}
                required
                placeholder='Area'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.connector_area ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.connector_area && <p className="mt-1 text-sm text-red-600">{errors.connector_area}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Commission % *</label>
              <input
                type="number"
                name="commission_percentage"
                value={formData.commission_percentage}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                required
                placeholder='Commission %'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.commission_percentage ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.commission_percentage && <p className="mt-1 text-sm text-red-600">{errors.commission_percentage}</p>}
            </div>
          </div>
        </div>
      )}

      {formData.role === 'banker' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Banker Information</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bank *</label>
              <select
                name="bank_id"
                value={formData.bank_id}
                onChange={handleChange}
                required
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.bank_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bank_id && <p className="mt-1 text-sm text-red-600">{errors.bank_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch *</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                required
                onChange={handleChange}
                placeholder='Branch'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.branch ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.branch && <p className="mt-1 text-sm text-red-600">{errors.branch}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch Code *</label>
              <input
                type="text"
                name="branch_code"
                value={formData.branch_code}
                required
                onChange={handleChange}
                placeholder='Branch Code'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.branch_code ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.branch_code && <p className="mt-1 text-sm text-red-600">{errors.branch_code}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder='Employee ID'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.employee_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder='Designation'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.designation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder='Department'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Max Approval Limit (₹)</label>
              <input
                type="number"
                name="max_approval_limit"
                value={formData.max_approval_limit}
                onChange={handleChange}
                min="0"
                step="100000"
                placeholder='Max Approval Limit'
                className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.max_approval_limit ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.max_approval_limit && <p className="mt-1 text-sm text-red-600">{errors.max_approval_limit}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Status for editing existing users */}
      {user && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`mt-1 block w-full text-gray-900 px-3 py-2 border ${errors.status ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
        </div>
      )}

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
          {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  )
}
