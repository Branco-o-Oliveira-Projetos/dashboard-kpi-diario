# 📊 Dashboard KPI Diário

> Sistema de monitoramento em tempo real que consolida métricas de diferentes ferramentas e sistemas organizacionais.

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

</div>

## 🚀 Funcionalidades Principais

- ⚡ **Tempo Real**: Atualização automática a cada 2 minutos
- 📱 **Responsivo**: Otimizado para desktop, tablet, mobile e **TV**
- 🎨 **Animações**: Transições suaves com Framer Motion
- 📈 **Gráficos Interativos**: Visualização de dados com Recharts
- 🔄 **Cache Inteligente**: Performance otimizada com TanStack Query
- 🌐 **7 Integrações**: Monitoramento completo de sistemas críticos

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   React + Vite  │◄──►│    FastAPI      │◄──►│   Database      │
│   TypeScript    │    │    Python       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Sistemas Monitorados

| Sistema           | Métricas                                    | Tipo de Gráfico |
| ----------------- | ------------------------------------------- | --------------- |
| **Meta Ads** 📢   | Custo, Leads, Cliques, CPL, CPC             | Linha           |
| **Google Ads** 🔍 | Custo, Leads, Cliques, CPL, CPC             | Barras          |
| **PipeRun** 📈    | Oportunidades (Recebidas, Ganhas, Perdidas) | Barras          |
| **N8N** 🔄        | Fluxos, Execuções, Falhas, Duração Média    | Linha           |
| **Conta Azul** 💰 | Clientes Novos, A Receber, Recebidas        | Barras          |
| **CPJ-3C** ⚖️     | Audiências, Perícias, Processos             | Barras          |
| **Evolution** 📱  | Instâncias, Mensagens, Tempo Resposta       | Misto           |

## 🛠️ Tecnologias

### Frontend

- **React 18.2.0** + **TypeScript 5.2.2**
- **Vite 5.0.0** (Build tool)
- **Tailwind CSS 3.3.5** (Estilização)
- **Framer Motion 12.23.12** (Animações)
- **TanStack Query 5.8.0** (Estado servidor)
- **Recharts 2.8.0** (Gráficos)

### Backend

- **FastAPI** (API moderna)
- **Python 3.13+**
- **psycopg** (Driver PostgreSQL)
- **uvicorn** (Servidor ASGI)

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Python 3.13+
- PostgreSQL 12+
- Git

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/Branco-o-Oliveira-Projetos/dashboard-kpi-diario.git
cd dashboard-kpi-diario
```

### 2️⃣ Frontend Setup

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar em desenvolvimento
npm run dev
```

### 3️⃣ Backend Setup

```bash
# Navegar para o backend
cd backend

# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows CMD:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4️⃣ Testes de Conectividade

```bash
# Teste geral do banco
python backend/test_db.py

# Testes específicos
python backend/test_evolution.py
python backend/test_meta_ads.py
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **Docs API**: http://127.0.0.1:8000/docs

## 🐳 Docker (Produção)

```bash
# Construir e executar
docker-compose up -d

# Acessar
# Frontend: http://localhost:1633
```

## 📁 Estrutura do Projeto

```
dashboard-kpi-diario/
├── 📄 README.md                    # Este arquivo
├── 📄 documentation.md             # Documentação completa
├── 🐳 docker-compose.yml          # Orquestração Docker
├── ⚙️ vite.config.ts              # Configuração Vite
├── 🎨 tailwind.config.js          # Configuração Tailwind
├── 📦 package.json                # Dependências Node.js
├── backend/                       # 🔧 API Backend
│   ├── 🐍 main.py                # App FastAPI principal
│   ├── ⚙️ config.py              # Configurações DB
│   ├── 📄 requirements.txt       # Dependências Python
│   └── 🧪 test_*.py              # Scripts de teste
├── src/                          # ⚛️ Frontend React
│   ├── 📄 App.tsx                # Componente principal
│   ├── 📄 types.ts               # Tipos TypeScript
│   ├── components/               # Componentes reutilizáveis
│   ├── lib/                      # Utilitários
│   └── pages/                    # Páginas da aplicação
```

## 🔧 Variáveis de Ambiente

### Frontend (`.env`)

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 🎯 Funcionalidades Avançadas

- 🔄 **Auto-refresh**: Dados atualizados automaticamente
- 📱 **PWA Ready**: Instalável como aplicativo
- 🎨 **Temas**: Suporte a modo escuro/claro
- 📊 **Exportação**: Relatórios em PDF/Excel
- 🚨 **Alertas**: Notificações em tempo real
- 👤 **Multi-usuário**: Sistema de autenticação

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de Conexão com Banco:**

```bash
python backend/test_db.py
```

**Porta em Uso (Windows):**

```powershell
netstat -ano | findstr :8002
taskkill /PID <PID> /F
```

**Limpar Cache Python:**

```bash
rm -rf backend/__pycache__/
```

## 👥 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte e Contato

**Departamento de Inovação B&O**
Giulliano Veiga e Joana Kelly

**Repositório**: [dashboard-kpi-diario](https://github.com/Branco-o-Oliveira-Projetos/dashboard-kpi-diario)  
**Organização**: Branco-o-Oliveira-Projetos

---

<div align="center">

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
