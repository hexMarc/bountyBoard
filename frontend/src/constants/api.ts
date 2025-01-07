// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://lensbountyboard.xyz'

// Helper function to build API URLs
export const buildApiUrl = (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${API_BASE_URL}/${cleanPath}`
}
