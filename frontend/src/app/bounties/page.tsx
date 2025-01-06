'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react-web'
import { format } from 'date-fns'

interface Bounty {
  id: number
  title: string
  description: string
  reward: string
  creatorId: string
  hunterId: string | null
  status: string
  deadline: string
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [filter, setFilter] = useState('all') // all, open, claimed, completed
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const url = new URL(`http://localhost:8080/api/v1/bounties`)
        if (filter !== 'all') {
          url.searchParams.append('status', filter)
        }

        const response = await fetch(url.toString())
        const data = await response.json()
        setBounties(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching bounties:', error)
        setLoading(false)
      }
    }

    fetchBounties()
  }, [filter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'claimed':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-semibold text-gray-900">Bounties</h1>
              <p className="mt-2 text-sm text-gray-700">
                Browse available bounties and start earning rewards
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <a
                href="/bounties/create"
                className="btn-primary"
              >
                Create Bounty
              </a>
            </div>
          </div>

          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <div className="flex gap-4">
                  {['all', 'open', 'claimed', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        filter === status
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 text-center">Loading bounties...</div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                            >
                              Title
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Reward
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Deadline
                            </th>
                            <th
                              scope="col"
                              className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                            >
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {bounties.map((bounty) => (
                            <tr key={bounty.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {bounty.title}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {bounty.reward} GRASS
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                                    bounty.status
                                  )}`}
                                >
                                  {bounty.status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(bounty.deadline), 'PPP')}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <a
                                  href={`/bounties/${bounty.id}`}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  View<span className="sr-only">, {bounty.title}</span>
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
