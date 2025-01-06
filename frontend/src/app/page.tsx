'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount } from 'wagmi'
import { Card, CardBody, CardFooter, Button, Spinner, Chip } from '@nextui-org/react'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [bounties, setBounties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        // Fetch all bounties without status filter
        const response = await fetch(`http://localhost:8080/api/v1/bounties`)
        if (!response.ok) {
          throw new Error('Failed to fetch bounties')
        }
        const data = await response.json()
        // Sort by newest first and take first 3
        const sortedBounties = data
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
        setBounties(sortedBounties)
      } catch (error) {
        console.error('Error fetching bounties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBounties()
  }, [])

  const handleCreateBounty = () => {
    router.push('/bounties/create')
  }

  const handleViewBounties = () => {
    router.push('/bounties')
  }

  const handleViewBounty = (id: number) => {
    router.push(`/bounties/${id}`)
  }

  return (
    <>
      <Header />
      <div className="relative flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="w-full max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <Card 
                className="w-full max-w-xl mb-16"
                classNames={{
                  base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
                }}
              >
                <CardBody className="text-center py-12 px-8">
                  <motion.h1 
                    className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    BountyBoard
                  </motion.h1>
                  <motion.p 
                    className="text-xl text-foreground/80 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    The decentralized platform for creating and claiming bounties.
                    Earn rewards by completing tasks or create bounties to get help from the community.
                  </motion.p>
                  
                  {isConnected ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                      <Button
                        size="lg"
                        color="primary"
                        variant="shadow"
                        onPress={handleCreateBounty}
                        className="font-semibold"
                      >
                        Create a Bounty
                      </Button>
                      <Button
                        size="lg"
                        variant="flat"
                        className="bg-white/10 hover:bg-white/20 font-semibold"
                        onPress={handleViewBounties}
                      >
                        View Open Bounties
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.p 
                      className="text-lg text-foreground/70"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Connect your wallet to start creating or claiming bounties
                    </motion.p>
                  )}
                </CardBody>
              </Card>

              {!loading && bounties.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-full"
                >
                  <h2 className="text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                    Latest Bounties
                  </h2>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {bounties.map((bounty: any) => (
                      <motion.div 
                        key={bounty.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Card 
                          isPressable
                          onPress={() => handleViewBounty(bounty.id)}
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
                            <h3 className="text-xl font-semibold mb-3">
                              {bounty.title}
                            </h3>
                            <p className="text-foreground/70 mb-4 line-clamp-3">
                              {bounty.description}
                            </p>
                          </CardBody>
                          <CardFooter className="justify-between px-6 py-4 border-t-1 border-white/10">
                            <Chip
                              color="success"
                              variant="shadow"
                              className="font-medium px-4"
                            >
                              {bounty.reward} GRASS
                            </Chip>
                            <Chip
                              color="primary"
                              variant="flat"
                              className="bg-white/10"
                            >
                              {bounty.status}
                            </Chip>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  
                  {bounties.length > 0 && (
                    <div className="flex justify-center mt-10">
                      <Button
                        size="lg"
                        variant="flat"
                        className="bg-white/10 hover:bg-white/20 font-semibold"
                        onPress={handleViewBounties}
                      >
                        View All Bounties
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
