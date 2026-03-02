import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,          // 30 soniya — shu vaqt ichida kesh ishlatiladi, API chaqirilmaydi
      refetchOnWindowFocus: false,    // Tab almashtirganda qayta yuklash o'chirilgan
      retry: 1,                      // Xatolikda faqat 1 marta qayta urinadi
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
