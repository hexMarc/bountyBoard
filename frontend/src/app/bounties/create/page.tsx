'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { Card, CardBody, CardHeader, Button, Input, Textarea } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'

interface FormData {
  title: string
  description: string
  reward: string
  deadline: string
}

export default function CreateBounty() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const { getAuthHeader, signIn } = useWalletAuth()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    reward: '',
    deadline: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.reward || parseFloat(formData.reward) <= 0) {
      newErrors.reward = 'Valid reward amount is required'
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    } else {
      const deadlineDate = new Date(formData.deadline)
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      try {
        await signIn()
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        return
      }
    }

    const authHeader = getAuthHeader()
    if (!authHeader) {
      alert('Please connect your wallet first')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        reward: formData.reward,
        deadline: new Date(formData.deadline).toISOString(),
      }

      const response = await fetch(`http://localhost:8080/api/v1/bounties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bounty')
      }

      router.push('/bounties')
    } catch (error) {
      console.error('Error creating bounty:', error)
      alert('Failed to create bounty. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [name]: undefined }))
    
    // For reward field, ensure valid decimal values
    if (name === 'reward') {
      const floatValue = parseFloat(value)
      if (isNaN(floatValue)) {
        setFormData(prev => ({ ...prev, [name]: '' }))
        return
      }
      setFormData(prev => ({ ...prev, [name]: floatValue.toFixed(2) }))
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Set minimum date to current date
  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset())
  const minDateString = minDate.toISOString().slice(0, 16)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <Header />
        <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
          <Card className="bg-background/60 dark:bg-default-100/50 backdrop-blur-lg">
            <CardBody className="text-center py-10">
              <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-foreground/70 mb-6">Please connect your wallet to create a bounty</p>
              <Button 
                color="primary"
                variant="shadow"
                onPress={signIn}
                className="font-semibold"
              >
                Connect Wallet
              </Button>
            </CardBody>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 sm:px-0"
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
              Create New Bounty
            </h1>
            
            <Card
              className="w-full"
              classNames={{
                base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
              }}
            >
              <CardBody className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Title
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      variant="bordered"
                      placeholder="Enter a descriptive title for your bounty"
                      classNames={{
                        input: "pt-0",
                        inputWrapper: "pt-0"
                      }}
                      isInvalid={!!errors.title}
                      errorMessage={errors.title}
                    />
                    <p className="text-sm text-foreground/70">A clear and concise title for your bounty</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Description
                      <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      minRows={4}
                      variant="bordered"
                      placeholder="Describe the task in detail, including any requirements or specifications"
                      classNames={{
                        input: "pt-0",
                        inputWrapper: "pt-0"
                      }}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                    />
                    <p className="text-sm text-foreground/70">Provide detailed information about the bounty requirements</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Reward (GRASS)
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="reward"
                      value={formData.reward}
                      onChange={handleChange}
                      required
                      min="0.01"
                      step="0.01"
                      variant="bordered"
                      placeholder="Enter the reward amount in GRASS"
                      classNames={{
                        input: "pt-0",
                        inputWrapper: "pt-0"
                      }}
                      isInvalid={!!errors.reward}
                      errorMessage={errors.reward}
                    />
                    <p className="text-sm text-foreground/70">Specify the amount of GRASS tokens to reward (e.g., 1.25)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Deadline
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      required
                      variant="bordered"
                      min={minDateString}
                      classNames={{
                        input: "pt-0",
                        inputWrapper: "pt-0",
                        base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg",
                        innerWrapper: "bg-transparent",
                      }}
                      isInvalid={!!errors.deadline}
                      errorMessage={errors.deadline}
                    />
                    <p className="text-sm text-foreground/70">Set a deadline for the bounty completion</p>
                  </div>

                  <Button
                    type="submit"
                    color="primary"
                    variant="shadow"
                    size="lg"
                    isDisabled={!isConnected}
                    className="w-full mt-8"
                  >
                    Create Bounty
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
