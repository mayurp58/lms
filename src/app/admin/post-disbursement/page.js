'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function PostDisbursementPage() {
  const [activeTab, setActiveTab] = useState('pending') // pending, completed, agents
  const [cases, setCases] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [selectedCase, setSelectedCase] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Agent Form State
  const [newAgent, setNewAgent] = useState({ name: '', phone: '', city: '' })

  useEffect(() => {
    fetchCases()
    fetchAgents()
  }, [activeTab])

  const fetchCases = async () => {
    setLoading(true)
    try {
      // Fetch cases based on activeTab filter
      const filter = (activeTab === 'agents' ? 'pending' : activeTab);
      const res = await fetch(`/api/admin/post-disbursement?filter=${filter}`)
      const data = await res.json()
      if (data.success) setCases(data.data)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch(`/api/admin/rto-agents`)
      const data = await res.json()
      if (data.success) setAgents(data.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddAgent = async (e) => {
      e.preventDefault()
      try {
        const res = await fetch('/api/admin/rto-agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAgent)
        })
        if(res.ok) {
            setNewAgent({ name: '', phone: '', city: '' })
            fetchAgents()
            alert('Agent Added Successfully')
        } else {
            const errorData = await res.json();
            alert('Failed to add agent: ' + errorData.message);
        }
      } catch(e) {
          alert('Failed to add agent due to network error.')
      }
  }

  const handleUpdateCase = async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      
      const rtoAgentId = formData.get('rto_agent_id');
      
      const payload = {
          loan_application_id: selectedCase.id,
          rto_agent_id: rtoAgentId === "0" ? null : parseInt(rtoAgentId),
          status: formData.get('status'),
          rc_status: formData.get('rc_status'),
          remarks: formData.get('remarks')
      }

      try {
        const res = await fetch('/api/admin/post-disbursement', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if(res.ok) {
            setIsModalOpen(false)
            fetchCases()
        } else {
            const errorData = await res.json();
            alert('Update Failed: ' + errorData.message);
        }
      } catch(e) {
          alert('Failed to connect to API for update.')
      }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'agent_assigned': return 'bg-blue-100 text-blue-800';
      case 'rto_process_started': return 'bg-indigo-100 text-indigo-800';
      case 'documents_pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  const openManageModal = (item) => {
      setSelectedCase(item); 
      setIsModalOpen(true);
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Post Disbursement Operations</h1>
        </div>
        
        {/* [Image of Process Flow Diagram] */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
             <p className="text-sm text-gray-600 font-medium">Cases requiring RTO processing (Auto Loans) after successful disbursement.</p>
             <p className="text-xs text-gray-500 mt-1">Total {activeTab.replace('_', ' ')} cases: <strong>{cases.length}</strong></p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('pending')} className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
              Pending Actions
            </button>
            <button onClick={() => setActiveTab('completed')} className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'completed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
              Completed Cases
            </button>
            <button onClick={() => setActiveTab('agents')} className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'agents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
              RTO Agents Master
            </button>
          </nav>
        </div>

        {activeTab === 'agents' ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add Agent Form */}
                <div className="bg-white p-6 rounded-lg shadow h-fit">
                    <h3 className="text-lg text-gray-900 font-medium mb-4">Add New RTO Agent</h3>
                    <form onSubmit={handleAddAgent} className="space-y-4">
                        <input required placeholder="Agent Name" className="w-full text-gray-900 p-2 border rounded" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
                        <input required placeholder="Phone Number" className="w-full text-gray-900 p-2 border rounded" value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} />
                        <input required placeholder="City" className="w-full text-gray-900 p-2 border rounded" value={newAgent.city} onChange={e => setNewAgent({...newAgent, city: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Save Agent</button>
                    </form>
                </div>
                {/* Agent List */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Registered Agents</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">City</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {agents.map(agent => (
                                    <tr key={agent.id}>
                                        <td className="px-4 text-gray-900 py-2">{agent.name}</td>
                                        <td className="px-4 text-gray-900 py-2">{agent.city}</td>
                                        <td className="px-4 text-gray-900 py-2">{agent.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                     <div className="p-8 text-center">Loading...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">App No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle/Loan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RTO Agent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cases.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.application_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.first_name} {item.last_name}<br/>
                                        <span className="text-xs text-gray-400">{item.city}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Reg: {item.vehicle_reg_number || 'N/A'}<br/>
                                        <span className="text-xs font-semibold text-green-600">{item.category_name}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {item.agent_name ? (
                                            <div>
                                                <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 px-2">
                                                    {item.agent_name}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">{item.agent_phone}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.pd_status || 'pending')}`}>
                                            {(item.pd_status || 'pending').replace('_', ' ')}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">RC: {item.rc_status || 'Pending'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => openManageModal(item)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cases.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No {activeTab} cases found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {/* Manage Modal */}
        {isModalOpen && selectedCase && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg text-gray-900 font-medium">Manage Post Disbursement: {selectedCase.application_number}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">✕</button>
                    </div>
                    
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-900 font-medium">Customer: {selectedCase.first_name} {selectedCase.last_name} | City: {selectedCase.city}</p>
                        <p className="text-xs text-gray-900">Vehicle Reg: {selectedCase.vehicle_reg_number || 'N/A'}</p>
                    </div>
                    
                    <form onSubmit={handleUpdateCase} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign RTO Agent</label>
                                <select name="rto_agent_id" defaultValue={selectedCase.rto_agent_id || '0'} className="mt-1 block w-full text-gray-900  border-gray-300 rounded-md shadow-sm p-2 border">
                                    <option value="0">Select Agent</option>
                                    {agents
                                        .filter(a => a.city.toLowerCase() === selectedCase.city.toLowerCase()) // Smart filter by city
                                        .map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.phone})
                                        </option>
                                    ))}
                                    <option disabled>--- Other Cities ---</option>
                                    {agents
                                        .filter(a => a.city.toLowerCase() !== selectedCase.city.toLowerCase())
                                        .map(a => (
                                         <option key={a.id} value={a.id}>{a.name} ({a.city})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Agents filtered by customer city: {selectedCase.city}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Overall Status</label>
                                <select name="status" defaultValue={selectedCase.pd_status || 'pending'} className="mt-1 block w-full text-gray-900  border-gray-300 rounded-md shadow-sm p-2 border">
                                    <option value="pending">Pending</option>
                                    <option value="agent_assigned">Agent Assigned</option>
                                    <option value="rto_process_started">RTO Process Started</option>
                                    <option value="documents_pending">Documents Pending</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">RC Status</label>
                                <select name="rc_status" defaultValue={selectedCase.rc_status || 'pending'} className="mt-1 block w-full text-gray-900  border-gray-300 rounded-md shadow-sm p-2 border">
                                    <option value="pending">Pending</option>
                                    <option value="received">Received from RTO</option>
                                    <option value="handed_over">Handed to Customer/Bank</option>
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Remarks / Notes</label>
                                <textarea name="remarks" rows="3" defaultValue={selectedCase.remarks} className="mt-1 block w-full text-gray-900  border-gray-300 rounded-md shadow-sm p-2 border"></textarea>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                            <a href={`/admin/applications/${selectedCase.id}`} target="_blank" className="text-blue-600 hover:underline px-3 py-2 text-sm self-center">
                                Upload Documents ↗
                            </a>
                            <div className="space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Update Case</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  )
}