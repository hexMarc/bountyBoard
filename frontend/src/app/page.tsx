'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react-web'

export default function Home() {
  const [bounties, setBounties] = useState([])
  const { data: profile, loading } = useProfile({
    forHandle: 'lens/your-handle'
  })

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

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h1 className="text-3xl font-bold mb-8">Welcome to Lens Bounty Board</h1>
            
            {loading ? (
              <p>Loading profile...</p>
            ) : profile ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    Profile Information
                  </h2>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Handle</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {profile?.handle?.fullHandle}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <p>No profile found</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bounties.map((bounty: any) => (
                <div
                  key={bounty.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {bounty.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {bounty.description}
                    </p>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {bounty.reward} GRASS
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <a
                        href={`/bounties/${bounty.id}`}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
