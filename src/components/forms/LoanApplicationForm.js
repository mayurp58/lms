'use client'

import { useState, useEffect } from 'react'

export default function LoanApplicationForm({ customer, onSubmit, onCancel }) {
  const [loanCategories, setLoanCategories] = useState([])
  const [formData, setFormData] = useState({
    customer_id: customer?.id || '',
    loan_category_id: '',
    requested_amount: '',
    vehicle_reg_number : '',
    vehicle_valuation : '',
    vehicle_km : '',
    vehicle_owner : '',
    purpose: '',
    monthly_income: '',
    employment_type: '',
    company_name: '',
    work_experience_years: '',
    existing_loans_amount: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLoanCategories()
  }, [])

  const fetchLoanCategories = async () => {
    try {
      const res = await fetch('/api/loan-categories')
      const data = await res.json()
      if (data.success) {
        setLoanCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching loan categories:', error)
    }
  }

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

  const selectedCategory = loanCategories.find(cat => cat.id.toString() === formData.loan_category_id)
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{customer?.first_name} {customer?.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phone</p>
              <p className="text-sm text-gray-900">{customer?.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900">{customer?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-sm text-gray-900">{customer?.city}, {customer?.state}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Category *</label>
            <select
              name="loan_category_id"
              value={formData.loan_category_id}
              onChange={handleChange}
              required
              className={`mt-1 block w-full px-3 py-2 border ${errors.loan_category_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            >
              <option value="">Select loan category</option>
              {loanCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.loan_category_id && <p className="mt-1 text-sm text-red-600">{errors.loan_category_id}</p>}
            
            
          </div>

          

          <div>
            <label className="block text-sm font-medium text-gray-700">Requested Amount (₹) *</label>
            <input
              type="number"
              name="requested_amount"
              value={formData.requested_amount}
              onChange={handleChange}
              required
              min={selectedCategory?.min_amount || 1}
              max={selectedCategory?.max_amount || 10000000}
              placeholder="Enter loan amount"
              className={`mt-1 block w-full px-3 py-2 border ${errors.requested_amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.requested_amount && <p className="mt-1 text-sm text-red-600">{errors.requested_amount}</p>}
          </div>
          {
            selectedCategory && selectedCategory.name=="Used Auto Loan" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Number *</label>
                  <input
                    type="text"
                    name="vehicle_reg_number"
                    value={formData.vehicle_reg_number}
                    onChange={handleChange}
                    required
                    placeholder="MH12TS0123"
                    className={`mt-1 block w-full px-3 py-2 border ${errors.vehicle_reg_number ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                  />
                  {errors.vehicle_reg_number && <p className="mt-1 text-sm text-red-600">{errors.vehicle_reg_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kms Driven *</label>
                  <input
                    type="number"
                    name="vehicle_km"
                    value={formData.vehicle_km}
                    onChange={handleChange}
                    required
                    placeholder="60000"
                    className={`mt-1 block w-full px-3 py-2 border ${errors.vehicle_km ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                  />
                  {errors.vehicle_km && <p className="mt-1 text-sm text-red-600">{errors.vehicle_km}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Valuation *</label>
                  <input
                    type="number"
                    name="vehicle_valuation"
                    value={formData.vehicle_valuation}
                    onChange={handleChange}
                    required
                    placeholder="400000"
                    className={`mt-1 block w-full px-3 py-2 border ${errors.vehicle_valuation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                  />
                  {errors.vehicle_valuation && <p className="mt-1 text-sm text-red-600">{errors.vehicle_valuation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Owner Serial Number *</label>
                  <input
                    type="number"
                    name="vehicle_owner"
                    value={formData.vehicle_owner}
                    onChange={handleChange}
                    required
                    min={2}
                    placeholder="2"
                    className={`mt-1 block w-full px-3 py-2 border ${errors.vehicle_owner ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
                  />
                  {errors.vehicle_owner && <p className="mt-1 text-sm text-red-600">{errors.vehicle_owner}</p>}
                </div>
              </>
            )
          }
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Purpose of Loan *</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe the purpose for this loan"
              className={`mt-1 block w-full px-3 py-2 border ${errors.purpose ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Income (₹) *</label>
            <input
              type="number"
              name="monthly_income"
              value={formData.monthly_income}
              onChange={handleChange}
              required
              min="1"
              placeholder="Enter monthly income"
              className={`mt-1 block w-full px-3 py-2 border ${errors.monthly_income ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.monthly_income && <p className="mt-1 text-sm text-red-600">{errors.monthly_income}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Employment Type *</label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              required
              className={`mt-1 block w-full px-3 py-2 border ${errors.employment_type ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            >
              <option value="">Select employment type</option>
              <option value="salaried">Salaried</option>
              <option value="self_employed">Self Employed</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
            {errors.employment_type && <p className="mt-1 text-sm text-red-600">{errors.employment_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Enter company/organization name"
              className={`mt-1 block w-full px-3 py-2 border ${errors.company_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Work Experience (Years)</label>
            <input
              type="number"
              name="work_experience_years"
              value={formData.work_experience_years}
              onChange={handleChange}
              min="0"
              max="50"
              placeholder="Years of experience"
              className={`mt-1 block w-full px-3 py-2 border ${errors.work_experience_years ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.work_experience_years && <p className="mt-1 text-sm text-red-600">{errors.work_experience_years}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Existing Loans Amount (₹)</label>
            <input
              type="number"
              name="existing_loans_amount"
              value={formData.existing_loans_amount}
              onChange={handleChange}
              min="0"
              placeholder="Total existing loan amount (0 if none)"
              className={`mt-1 block w-full px-3 py-2 border ${errors.existing_loans_amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
            />
            {errors.existing_loans_amount && <p className="mt-1 text-sm text-red-600">{errors.existing_loans_amount}</p>}
          </div>
        </div>
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
          {loading ? 'Creating Application...' : 'Create Loan Application'}
        </button>
      </div>
    </form>
  )
}
