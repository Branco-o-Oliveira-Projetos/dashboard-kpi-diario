# B&O Dashboard

Dashboard diário com exibição de KPIs e gráficos em tempo real.

## Como rodar

### Front-end

```bash
npm i
npm run dev
```

### Backend (opcional)

```bash
cd backend
python -m venv .venv ; source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Configuração

1. Copie `.env.example` para `.env`
2. (Opcional) Defina `VITE_API_BASE_URL=http://localhost:8000` para usar o backend
3. Se não definir, o frontend usará dados mock para desenvolvimento

### Sistemas

- **Meta Ads**: Custo, Leads, Cliques (gráfico de linha)
- **Google Ads**: Custo, Leads, Cliques (gráfico de barras)
- **PipeRun**: Oportunidades Recebidas, Ganhas, Perdidas (barras)
- **Conta Azul**: A receber, Recebidas, Clientes novos (barras)
- **CPJ-3C**: Audiências, Perícias, Processos (barras)
- **T.I**: Chamados Abertos, Em andamento, Resolvidos (barras)
- **Liderhub**: Atendimentos Aguardando, Em andamento, Finalizadas (barras)
- **n8n**: Fluxos, Sucessos, Falhas (linha)

### Funcionalidades

- Auto-refresh a cada 10 minutos (configurável)
- Carrossel automático a cada 5 segundos
- Layout responsivo 2x2
- Controle manual de páginas
