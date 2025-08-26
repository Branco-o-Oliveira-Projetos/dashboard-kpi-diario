import { useEffect, useState } from 'react'

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
      <span>Auto-refresh: 3 min • ciclo #{cycle}</span>
    </div>
  )
}
