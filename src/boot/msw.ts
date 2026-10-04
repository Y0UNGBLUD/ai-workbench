export async function setupMsw() {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === 'true') {
    const { worker } = await import('@/mocks/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
    })

    console.log('[MSW] Mock API worker started')
  }
}
