from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg_pool
from config import DATABASE_URL, DB_TIMEOUT

# Inicializa a aplicação FastAPI
app = FastAPI(title="B&O Dashboard API")

# Configura o middleware de CORS para permitir requisições de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria o pool de conexões com o banco de dados PostgreSQL
pool = psycopg_pool.ConnectionPool(
    DATABASE_URL,
    min_size=1,
    max_size=5,
    open=True,
    timeout=DB_TIMEOUT
)

# Configuração dos sistemas e seus respectivos parâmetros de consulta
SISTEMAS_DB = {
    'piperun': {
        'schema': 'kpi_tv',
        'tabela': 'piperun_daily',
        'filtro_col': 'pipeline_id',
        'filtro_val': '78157',  # Dashboard principal usa apenas esta pipeline
        'kpi_cols': ['oportunidades_recebidas', 'oportunidades_ganhas', 'oportunidades_perdidas'],
        'chart_col': 'oportunidades_recebidas',
    },
    'n8n': {
        'schema': 'kpi_tv',
        'tabela': 'n8n_daily',
        'filtro_col': 'workspace_id',
        'filtro_val': 'HJDfVFxTb7w1KNDD',
        'kpi_cols': ['flows_total', 'runs_success', 'runs_failed', 'avg_duration_sec'],
        'chart_col': 'runs_success',
    },
    'conta_azul': {
        'schema': 'kpi_tv',
        'tabela': 'conta_azul_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['clientes_novos', 'a_receber_total', 'recebidas_total'],
        'chart_col': 'recebidas_total',
    },
    'cpj3c': {
        'schema': 'kpi_tv',
        'tabela': 'cpj_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['audiencias', 'pericias', 'processos'],
        'chart_col': 'audiencias',
    },
    'meta_ads': {
        'schema': 'kpi_tv',
        'tabela': 'meta_ads_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['cost', 'leads', 'clicks', 'cpl', 'cpc'],
        'chart_col': 'clicks',
    },
    'google_ads': {
        'schema': 'kpi_tv',
        'tabela': 'google_ads_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['cost', 'leads', 'clicks', 'cpl', 'cpc'],
        'chart_col': 'clicks',
    },
    'ti': {
        'schema': 'kpi_tv',
        'tabela': 'ti_chamados_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['abertos', 'andamento', 'resolvidos'],
        'chart_col': 'resolvidos',
    },
    'liderhub': {
        'schema': 'kpi_tv',
        'tabela': 'liderhub_daily',
        'filtro_col': '',
        'filtro_val': '',
        'kpi_cols': ['aguardando', 'em_andamento', 'finalizadas'],
        'chart_col': 'finalizadas',
    },
}

def get_kpi_and_series(system: str) -> tuple[Dict[str, Any], Dict[str, Any]]:
    # Verifica se o sistema existe na configuração
    if system not in SISTEMAS_DB:
        raise HTTPException(status_code=404, detail="Sistema não encontrado")
    
    # Recupera as configurações do sistema
    config = SISTEMAS_DB[system]
    schema = config['schema']
    tabela = config['tabela']
    filtro_col = config['filtro_col']
    filtro_val = config['filtro_val']
    kpi_cols = config['kpi_cols']
    chart_col = config['chart_col']
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Para meta_ads e google_ads, calcula a soma/média dos KPIs do dia mais recente
            if system in ['meta_ads', 'google_ads']:
                kpi_query = f"""
                    SELECT 
                        SUM(cost) AS cost_sum,
                        SUM(leads) AS leads_sum,
                        SUM(clicks) AS clicks_sum,
                        AVG(cpl) AS cpl_avg,
                        AVG(cpc) AS cpc_avg,
                        MAX(updated_at) AS updated_at
                    FROM {schema}.{tabela}
                    WHERE ref_date = (
                        SELECT MAX(ref_date) FROM {schema}.{tabela}
                        {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                    )
                    {"AND " + filtro_col + " = %s" if filtro_col else ""}
                """
                # Define os parâmetros para o filtro, se houver
                params = (filtro_val, filtro_val) if filtro_col else ()
                cur.execute(kpi_query, params)
                kpi_row = cur.fetchone()
                kpi_values = list(kpi_row[:-1])
                updated_at = kpi_row[-1]
                
                # Consulta de séries: soma dos clicks por dia nos últimos 14 dias
                series_query = f"""
                    SELECT ref_date, SUM(clicks) as clicks_sum
                    FROM {schema}.{tabela}
                    {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                    GROUP BY ref_date
                    ORDER BY ref_date DESC
                    LIMIT 14
                """
                cur.execute(series_query, (filtro_val,) if filtro_col else ())
                series_rows = cur.fetchall()
            else:
                # Para os demais sistemas, pega a última linha dos KPIs
                kpi_query = f"""
                    SELECT {', '.join(kpi_cols)}, updated_at
                    FROM {schema}.{tabela}
                    {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                    ORDER BY ref_date DESC
                    LIMIT 1
                """
                cur.execute(kpi_query, (filtro_val,) if filtro_col else ())
                kpi_row = cur.fetchone()
                if not kpi_row:
                    raise HTTPException(status_code=404, detail="Dados não encontrados")
                kpi_values = list(kpi_row[:-1])
                updated_at = kpi_row[-1]

                # Consulta de séries: soma do campo do gráfico por dia nos últimos 14 dias
                series_query = f"""
                    SELECT ref_date, SUM({chart_col}) as value_sum
                    FROM {schema}.{tabela}
                    {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                    GROUP BY ref_date
                    ORDER BY ref_date DESC
                    LIMIT 14
                """
                cur.execute(series_query, (filtro_val,) if filtro_col else ())
                series_rows = cur.fetchall()
            
            # Monta os pontos da série para o frontend (ordem cronológica crescente)
            series_points = [
                {
                    "x": row[0].date().isoformat() if isinstance(row[0], datetime) else str(row[0]),
                    "y": float(row[1]) if row[1] is not None else 0
                }
                for row in reversed(series_rows)
            ]
    
    # Monta a resposta dos KPIs
    kpis_response = {
        "values": kpi_values,
        "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at)
    }
    
    # Monta a resposta das séries
    series_response = {
        "points": series_points,
        "label": system
    }
    
    return kpis_response, series_response

# Endpoint para retornar os KPIs do sistema
@app.get("/api/kpis/{system}")
async def get_kpis(system: str):
    kpis, _ = get_kpi_and_series(system)
    return kpis

# Endpoint para retornar a série histórica do sistema
@app.get("/api/series/{system}")
async def get_series(system: str):
    _, series = get_kpi_and_series(system)
    return series

@app.get("/api/detailed/{system}")
async def get_detailed_data(system: str):
    """Retorna dados detalhados de um sistema específico"""
    if system not in SISTEMAS_DB:
        raise HTTPException(status_code=404, detail="Sistema não encontrado")
    
    config = SISTEMAS_DB[system]
    schema = config['schema']
    tabela = config['tabela']
    filtro_col = config['filtro_col']
    filtro_val = config['filtro_val']
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Consulta todos os dados dos últimos 30 dias
            detailed_query = f"""
                SELECT *
                FROM {schema}.{tabela}
                {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                ORDER BY ref_date DESC, updated_at DESC
                LIMIT 1000
            """
            
            cur.execute(detailed_query, (filtro_val,) if filtro_col else ())
            rows = cur.fetchall()
            
            # Pega os nomes das colunas
            columns = [desc[0] for desc in cur.description]
            
            # Converte os resultados para lista de dicionários
            detailed_data = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.isoformat()
                    else:
                        row_dict[columns[i]] = value
                detailed_data.append(row_dict)
    
    return detailed_data

@app.get("/api/detailed/piperun/all")
async def get_piperun_all_pipelines():
    """Retorna dados das 3 pipelines específicas do PipeRun para a página de detalhes"""
    pipeline_ids = ['78157', '78175', '78291']
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Consulta dados das 3 pipelines específicas
            detailed_query = """
                SELECT *
                FROM kpi_tv.piperun_daily
                WHERE pipeline_id IN %s
                ORDER BY ref_date DESC, updated_at DESC
                LIMIT 1000
            """
            
            cur.execute(detailed_query, (tuple(pipeline_ids),))
            rows = cur.fetchall()
            
            # Pega os nomes das colunas
            columns = [desc[0] for desc in cur.description]
            
            # Converte os resultados para lista de dicionários
            detailed_data = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.isoformat()
                    else:
                        row_dict[columns[i]] = value
                detailed_data.append(row_dict)
    
    return detailed_data

# Endpoint raiz para teste da API
@app.get("/")
async def root():
    return {"message": "B&O Dashboard API"}
