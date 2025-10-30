'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123'
        })
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
    setLoading(false)
  }

  const testUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/testuser');
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Banking System Test</h1>
      
      <button
        onClick={testUsers}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 mx-10 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Add Test Users'}
      </button>

      <button
        onClick={testLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Login API'}
      </button>

      {result && (
        <pre className="mt-4 p-4 bg-black rounded text-sm overflow-auto">
          {result}
        </pre>
      )}
    </div>
  )
}
