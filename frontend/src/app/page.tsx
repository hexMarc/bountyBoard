'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { useLensAuth } from '@/hooks/useLensAuth'

export default function Home() {
  const [bounties, setBounties] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bounties`)
        const data = await response.json()
        setBounties(data)
      } catch (error) {
        console.error('Error fetching bounties:', error)
      }
    }

    fetchBounties()
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      console.log('Connect button clicked')
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn">
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-white rounded-xl shadow-xl p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to BountyBoard
              </h1>
              <p className="text-gray-600 text-lg mb-8">
                Connect your wallet to start exploring and creating bounties.
              </p>
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          </div>

          {bounties.length > 0 && (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Bounties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bounties.map((bounty: any) => (
                  <div key={bounty.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-2">{bounty.title}</h3>
                    <p className="text-gray-600">{bounty.description}</p>
                    <div className="mt-4">
                      <span className="text-green-600 font-semibold">{bounty.reward} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
