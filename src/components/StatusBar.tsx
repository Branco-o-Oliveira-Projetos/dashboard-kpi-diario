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
      className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-text2 shadow-lg shadow-black/30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <motion.span 
          className="whitespace-nowrap text-neonAqua font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Auto refresh 3 min | ciclo #{cycle}
        </motion.span>
      
      {/* Links para pÃ¡ginas detalhadas */}
      <motion.div 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <Link to="/meta-ads" className="hover:text-neonAqua transition-colors whitespace-nowrap">Meta Ads</Link>
          <Link to="/google-ads" className="hover:text-neonAqua transition-colors whitespace-nowrap">Google Ads</Link>
          <Link to="/piperun" className="hover:text-neonAqua transition-colors">PipeRun</Link>
          <Link to="/conta-azul" className="hover:text-neonAqua transition-colors hidden sm:inline">Conta Azul</Link>
          <a href="#" className="hover:text-neonAqua transition-colors hidden sm:inline">CPJ-3C</a>
          <Link to="/ti" className="hover:text-neonAqua transition-colors hidden lg:inline">T.I</Link>
          <a href="#" className="hover:text-neonAqua transition-colors hidden lg:inline">Liderhub</a>
          <Link to="/n8n" className="hover:text-neonAqua transition-colors">N8N</Link>
          <a href="#" className="hover:text-neonAqua transition-colors hidden lg:inline">GitHub</a>
          <Link to="/evolution" className="hover:text-neonAqua transition-colors">Evolution</Link>
          <a href="#" className="hover:text-neonAqua transition-colors hidden lg:inline">Portainer</a>
          <a href="#" className="hover:text-neonAqua transition-colors hidden lg:inline">RH</a>
        </nav>
      </motion.div> 
      <motion.span
        className="text-sm sm:text-base text-text font-semibold whitespace-nowrap"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {formattedTime}
      </motion.span>
    </motion.div>
  )
}
