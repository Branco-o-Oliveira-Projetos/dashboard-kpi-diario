import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface StatusBarProps {
  cycle: number
}

export default function StatusBar({ cycle }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formattedTime = currentTime.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <motion.div 
      className="bg-bg2 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-text2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <motion.span 
          className="whitespace-nowrap"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔄 3 min • #{cycle}
        </motion.span>
      
      {/* Links para páginas detalhadas */}
      <motion.div 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <Link to="/meta-ads" className="hover:text-text transition-colors whitespace-nowrap">Meta Ads</Link>
          <Link to="/google-ads" className="hover:text-text transition-colors whitespace-nowrap">Google Ads</Link>
          <Link to="/piperun" className="hover:text-text transition-colors">PipeRun</Link>
          <a href="#" className="hover:text-text transition-colors hidden sm:inline">Conta Azul</a>
          <a href="#" className="hover:text-text transition-colors hidden sm:inline">CPJ-3C</a>
          <Link to="/ti" className="hover:text-text transition-colors hidden lg:inline">T.I</Link>
          <a href="#" className="hover:text-text transition-colors hidden lg:inline">Liderhub</a>
          <Link to="/n8n" className="hover:text-text transition-colors">N8N</Link>
          <a href="#" className="hover:text-text transition-colors hidden lg:inline">GitHub</a>
          <Link to="/evolution" className="hover:text-text transition-colors">Evolution</Link>
          <a href="#" className="hover:text-text transition-colors hidden lg:inline">Portainer</a>
          <a href="#" className="hover:text-text transition-colors hidden lg:inline">RH</a>
        </nav>
      </motion.div>
    </motion.div>
  )
}
