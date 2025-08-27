import { useEffect, useState } from 'react'
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
    <div className="bg-bg2 rounded-xl p-3 mb-4 flex items-center justify-between text-sm text-text2">
      <span>Atualizado: {formattedTime}</span>
      
      {/* Links para páginas detalhadas */}
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-3">
          <Link to="/meta-ads" className="hover:text-text transition-colors">Meta Ads</Link>
          <Link to="/google-ads" className="hover:text-text transition-colors">Google Ads</Link>
          <Link to="/piperun" className="hover:text-text transition-colors">PipeRun</Link>
          <a href="/conta-azul" className="hover:text-text transition-colors">Conta Azul</a>
          <a href="/cpj3c" className="hover:text-text transition-colors">CPJ-3C</a>
          <a href="/ti" className="hover:text-text transition-colors">T.I</a>
          <a href="/liderhub" className="hover:text-text transition-colors">Liderhub</a>
          <Link to="/n8n" className="hover:text-text transition-colors">N8N</Link>
        </nav>
        <span>| Auto-refresh: 3 min • ciclo #{cycle}</span>
      </div>
    </div>
  )
}
