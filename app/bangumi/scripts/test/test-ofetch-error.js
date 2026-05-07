// Test script to verify ofetch onRequestError behavior
import { ofetch } from 'ofetch'

// Mock functions
const logout = async () => {
  console.log('Logout called')
}

// Create fetch instance with error handler
const testFetch = ofetch.create({
  baseURL: 'https://httpbin.org',
  // Test onResponseError hook for HTTP status errors (like 401)
  async onResponseError({ response }) {
    console.log('onResponseError called')
    console.log('Response status:', response.status)

    if (response.status === 401) {
      await logout()
      console.log('Logout completed')
    }
    // Test case 1: No return value - error should propagate

    // Test case 2 (uncomment to test): Return a value to handle the error
    // return { handled: true }
  },

  // Also test onRequestError for network errors
  async onRequestError({ error }) {
    console.log('onRequestError called - this should NOT appear for HTTP status errors')
    console.log('Error:', error)
  },
})

// Test function
async function testErrorHandling() {
  console.log('=== Test: Error propagation after onResponseError ===')

  try {
    // This will return a 401 status
    const response = await testFetch('/status/401')
    console.log('Request succeeded:', response)
  } catch (error) {
    console.log('Error caught in caller:', error.message)
    console.log('Error status:', error.status)
  }

  console.log('\n=== Test completed ===')
}

// Run the test
testErrorHandling()
