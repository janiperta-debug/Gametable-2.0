// Firebase has been removed - this file now exports mock placeholders
// These will be replaced with Supabase integration later

// Mock auth object for development
export const auth = {
  currentUser: null as { uid: string; email: string } | null,
}

// Mock db object for development  
export const db = {}

// Mock app object for development
export const app = {}

console.log("[v0] Firebase removed - using mock services for development")
