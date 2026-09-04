// Simulates a network call so the app behaves like it talks to a real backend
// (latency + occasional failures), keeping the API layer swappable later.
const DEFAULT_DELAY = 350

export function simulateRequest(data, { delay = DEFAULT_DELAY, failRate = 0 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) {
        reject(new Error('Network error: failed to reach invoice service'))
        return
      }
      resolve(data)
    }, delay)
  })
}
