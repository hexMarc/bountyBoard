'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'

export default function CreateBounty() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      // Create bounty through API
      const response = await fetch(`http://localhost:8080/api/v1/bounties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reward: parseEther(formData.reward).toString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create bounty')
      }

      router.push('/bounties')
    } catch (error) {
      console.error('Error creating bounty:', error)
      alert('Failed to create bounty. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Bounty</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="input-primary mt-1"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  required
                  className="input-primary mt-1"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="reward" className="block text-sm font-medium text-gray-700">
                  Reward (GRASS)
                </label>
                <input
                  type="number"
                  name="reward"
                  id="reward"
                  required
                  step="0.000000000000000001"
                  className="input-primary mt-1"
                  value={formData.reward}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  id="deadline"
                  required
                  className="input-primary mt-1"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!isConnected}
                >
                  Create Bounty
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
