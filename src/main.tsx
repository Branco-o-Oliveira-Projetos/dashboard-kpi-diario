import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import MetaAdsDetail from './pages/MetaAdsDetail.tsx'
import GoogleAdsDetail from './pages/GoogleAdsDetail.tsx'
import PiperunDetail from './pages/PiperunDetail.tsx'
import N8nDetail from './pages/N8nDetail.tsx'
import EvolutionDetail from './pages/EvolutionDetail.tsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/meta-ads" element={<MetaAdsDetail />} />
          <Route path="/google-ads" element={<GoogleAdsDetail />} />
          <Route path="/piperun" element={<PiperunDetail />} />
          <Route path="/n8n" element={<N8nDetail />} />
          <Route path="/evolution" element={<EvolutionDetail />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
