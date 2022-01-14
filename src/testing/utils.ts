export const port = (basePort: number = 3000): number => {
  const workerId = parseInt(process.env.JEST_WORKER_ID) || 0
  return workerId + basePort
}

export const apiUrl = (path: string = '') => {
  return `http://localhost:${port()}${path}`
}
