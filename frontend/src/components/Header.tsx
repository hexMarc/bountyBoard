'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Button, Link } from '@nextui-org/react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { LensAuthButton } from '@/components/lens/LensAuthButton'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Bounties', href: '/bounties' },
  { name: 'Create', href: '/bounties/create' },
  { name: 'Profile', href: '/profile' },
]

export default function Header() {
  const { address, isConnected } = useAccount()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-400/5 to-primary-500/10 backdrop-blur-xl" />
      <Navbar 
        maxWidth="xl"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        classNames={{
          wrapper: "px-4 sm:px-6",
          base: "h-20 bg-background/30",
          brand: "gap-3",
          toggle: "text-foreground hover:bg-foreground/10",
          item: [
            "flex",
            "relative",
            "h-full",
            "items-center",
            "data-[active=true]:after:content-['']",
            "data-[active=true]:after:absolute",
            "data-[active=true]:after:bottom-0",
            "data-[active=true]:after:left-0",
            "data-[active=true]:after:right-0",
            "data-[active=true]:after:h-[2px]",
            "data-[active=true]:after:rounded-[2px]",
            "data-[active=true]:after:bg-primary",
          ].join(" "),
        }}
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">LB</span>
              </div>
              <p className="font-bold text-xl bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                Lens Bounty
              </p>
            </div>
          </NavbarBrand>
          <NavbarContent className="hidden sm:flex gap-8 ml-10" justify="center">
            {navigation.map((item) => (
              <NavbarItem key={item.name} isActive={pathname === item.href}>
                <Link
                  href={item.href}
                  color={pathname === item.href ? "primary" : "foreground"}
                  className={`font-medium text-sm px-1 py-2 transition-all duration-200 ${
                    pathname === item.href 
                      ? "" 
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {item.name}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>
        </NavbarContent>

        <NavbarContent justify="end" className="basis-1/5 sm:basis-auto gap-4">
          <NavbarItem className="hidden sm:flex gap-3">
            <div className="flex items-center gap-3">
              <LensAuthButton />
              <div className="h-6 w-[1px] bg-foreground/10" />
              <ConnectKitButton />
            </div>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className="pt-6 bg-background/95 backdrop-blur-xl border-b border-foreground/10">
          {navigation.map((item) => (
            <NavbarMenuItem key={item.name} className="py-2">
              <Link
                href={item.href}
                color={pathname === item.href ? "primary" : "foreground"}
                className={`w-full text-base font-medium py-2 ${
                  pathname === item.href 
                    ? "bg-primary-500/10" 
                    : "opacity-70 hover:opacity-100"
                }`}
                size="lg"
              >
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem className="mt-8 pb-6 border-t border-foreground/10 pt-6">
            <div className="flex flex-col gap-4 w-full">
              <LensAuthButton />
              <ConnectKitButton />
            </div>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>
    </div>
  )
}
