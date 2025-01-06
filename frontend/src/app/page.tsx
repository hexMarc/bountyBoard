'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useLensAuth } from '@/hooks/useLensAuth'
import { Card, CardBody, CardFooter, Button, Spinner, Chip } from '@nextui-org/react'
import { motion } from 'framer-motion'

export default function Home() {
  const [bounties, setBounties] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/bounties`)
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
                    Welcome to BountyBoard
                  </motion.h1>
                  <motion.p 
                    className="text-xl text-foreground/80 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Connect your wallet to start exploring and creating bounties.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      size="lg"
                      color="primary"
                      variant="shadow"
                      onPress={handleConnect}
                      isDisabled={isLoading}
                      className="w-full max-w-md h-14 font-semibold text-lg"
                    >
                      {isLoading ? (
                        <Spinner color="current" size="sm" />
                      ) : (
                        'Connect Wallet'
                      )}
                    </Button>
                  </motion.div>
                </CardBody>
              </Card>

              {bounties.length > 0 && (
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
                              {bounty.reward} ETH
                            </Chip>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              className="bg-white/10 hover:bg-white/20"
                              onPress={() => {}}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
