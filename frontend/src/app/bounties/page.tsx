'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react-web'
import { format } from 'date-fns'
import { Card, CardBody, Button, Chip, Spinner } from '@nextui-org/react'
import { motion } from 'framer-motion'

interface Bounty {
  id: number
  title: string
  description: string
  reward: string
  creatorId: string
  hunterId: string | null
  status: string
  deadline: string
  ipfsHash: string
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
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch bounties')
        }
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 sm:px-0"
        >
          <div className="sm:flex sm:items-center mb-8">
            <div className="sm:flex-auto">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                Bounties
              </h1>
              <p className="mt-2 text-foreground/70">
                Browse available bounties and start earning rewards
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Button
                as="a"
                href="/bounties/create"
                color="primary"
                variant="shadow"
                size="lg"
              >
                Create Bounty
              </Button>
            </div>
          </div>

          <Card 
            className="w-full"
            classNames={{
              base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
            }}
          >
            <CardBody>
              <div className="flex gap-4 mb-6">
                {['all', 'open', 'claimed', 'completed'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={filter === status ? "shadow" : "flat"}
                    color={filter === status ? "primary" : "default"}
                    onPress={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {bounties.map((bounty) => (
                    <motion.div
                      key={bounty.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card 
                        isPressable
                        as="a"
                        href={`/bounties/${bounty.id}`}
                        className="w-full h-full"
                        classNames={{
                          base: [
                            "bg-background/40",
                            "dark:bg-default-100/20",
                            "backdrop-blur-lg",
                            "border-1",
                            "border-white/20",
                            "hover:border-white/40",
                            "transition-all",
                            "duration-300",
                            "hover:-translate-y-1"
                          ].join(" ")
                        }}
                      >
                        <CardBody className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold">
                              {bounty.title}
                            </h3>
                            <Chip
                              color={bounty.status === 'open' ? "success" : 
                                    bounty.status === 'claimed' ? "warning" : 
                                    "primary"}
                              variant="shadow"
                              size="sm"
                            >
                              {bounty.status}
                            </Chip>
                          </div>
                          <div className="flex justify-between items-center">
                            <Chip
                              variant="flat"
                              className="bg-white/10"
                            >
                              {bounty.reward} GRASS
                            </Chip>
                            <span className="text-sm text-foreground/70">
                              {format(new Date(bounty.deadline), 'PPP')}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
