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
| **Meta Ads** 📢   | Custo, Leads, Cliques, CPL, CPC             | Barras          |
| **Google Ads** 🔍 | Custo, Leads, Cliques, CPL, CPC             | Barras          |
| **PipeRun** 📈    | Oportunidades (Recebidas, Ganhas, Perdidas) | Barras          |
| **N8N** 🔄        | Fluxos, Execuções, Falhas, Duração Média    | Barras          |
| **Conta Azul** 💰 | Clientes Novos, A Receber, Recebidas        | Barras          |
| **CPJ-3C** ⚖️     | Audiências, Perícias, Processos             | Barras          |
| **Evolution** 📱  | Instâncias, Mensagens, Tempo Resposta       | Barras          |

## � Incluindo um Novo Sistema

Para incluir um novo sistema no dashboard, siga os passos abaixo. Cada sistema incluído deve obrigatoriamente ter sua própria página detalhada para visualização aprofundada dos dados.

### 1️⃣ Configuração no Backend

Edite o arquivo `backend/main.py` e adicione uma nova entrada no dicionário `SISTEMAS_DB`. Exemplo:

```python
'novo_sistema': {
    'schema': 'kpi_tv',
    'tabela': 'novo_sistema_daily',
    'filtro_col': 'id_sistema',  # Coluna de filtro (opcional)
    'filtro_val': 'valor_filtro',  # Valor do filtro (opcional)
    'date_col': 'ref_date',
    'updated_col': 'updated_at',
    'kpi_cols': ['metrica1', 'metrica2', 'metrica3'],  # Colunas dos KPIs
    'chart_col': 'metrica1',  # Coluna usada no gráfico
    'kpi_query_type': 'single_row',  # 'single_row', 'aggregated' ou 'custom'
    'series_aggregation': 'SUM'  # Função de agregação para séries
}
```

**Tipos de Query:**

- `single_row`: Pega a linha mais recente da tabela
- `aggregated`: Aplica funções de agregação (SUM, AVG, etc.) nas colunas
- `custom`: Usa uma query personalizada (defina `custom_kpi_query`)

### 2️⃣ Criação da Página Detalhada

Crie um novo arquivo em `src/pages/` seguindo o padrão dos existentes (ex: `NovoSistemaDetail.tsx`):

```tsx
import { useQuery } from "@tanstack/react-query";
import { fetchDetailedData } from "../lib/api";
// ... outros imports

export default function NovoSistemaDetail() {
  const { data, isLoading } = useQuery({
    queryKey: ["detailed", "novo_sistema"],
    queryFn: () => fetchDetailedData("novo_sistema"),
  });

  // Implemente a visualização detalhada dos dados
  return <div>{/* Seu componente detalhado */}</div>;
}
```

### 3️⃣ Adição de Rota no Frontend

Edite `src/App.tsx` para adicionar a nova rota:

```tsx
import NovoSistemaDetail from "./pages/NovoSistemaDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... rotas existentes */}
        <Route path="/novo-sistema" element={<NovoSistemaDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4️⃣ Atualização da Barra de Status

Edite `src/components/StatusBar.tsx` para adicionar o link:

```tsx
<Link to="/novo-sistema" className="hover:text-text transition-colors">
  Novo Sistema
</Link>
```

### 5️⃣ Atualização de Tipos (se necessário)

Se o novo sistema usar tipos específicos, atualize `src/types.ts`:

```typescript
export type SystemKey =
  | "meta_ads"
  | "google_ads"
  | "piperun"
  | "n8n"
  | "conta_azul"
  | "cpj3c"
  | "evolution"
  | "novo_sistema";
```

### 6️⃣ Teste e Validação

Após implementar, teste:

- A API retorna os dados corretos (`/api/kpis/novo_sistema`, `/api/series/novo_sistema`, `/api/detailed/novo_sistema`)
- A página detalhada carrega corretamente
- O link na barra de status funciona

## �🛠️ Tecnologias

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

**Desenvolvedor**: Giulliano Veiga  
📧 Email: [giullianoveiga@gmail.com](mailto:giullianoveiga@gmail.com)  
💼 LinkedIn: [linkedin.com/in/giulliano-veiga](https://www.linkedin.com/in/giulliano-veiga)  
📱 Instagram: [@giullianoveiga](https://www.instagram.com/giullianoveiga)

**Repositório**: [dashboard-kpi-diario](https://github.com/Branco-o-Oliveira-Projetos/dashboard-kpi-diario)  
**Organização**: Branco-o-Oliveira-Projetos

---

<div align="center">

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
