from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg_pool
from config import DATABASE_URL, DB_TIMEOUT

app = FastAPI(title="B&O Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pool = psycopg_pool.ConnectionPool(
    DATABASE_URL,
    min_size=1,
    max_size=5,
    open=True,
    timeout=DB_TIMEOUT
)

SISTEMAS_DB = {
    'piperun': {
        'schema': 'kpi_tv',
        'tabela': 'piperun_daily',
        'filtro_col': 'pipeline_id',
        'filtro_val': '78157',
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
    if system not in SISTEMAS_DB:
        raise HTTPException(status_code=404, detail="Sistema não encontrado")
    
    config = SISTEMAS_DB[system]
    schema = config['schema']
    tabela = config['tabela']
    filtro_col = config['filtro_col']
    filtro_val = config['filtro_val']
    kpi_cols = config['kpi_cols']
    chart_col = config['chart_col']
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Ajuste para calcular soma ou média conforme necessário
            if system in ['meta_ads', 'google_ads']:
                kpi_query = f"""
                    SELECT 
                        AVG(cost) AS cost_avg,
                        SUM(leads) AS leads_sum,
                        SUM(clicks) AS clicks_sum,
                        AVG(cpl) AS cpl_avg,
                        AVG(cpc) AS cpc_avg,
                        MAX(updated_at) AS updated_at
                    FROM {schema}.{tabela}
                    {"WHERE " + filtro_col + " = %s" if filtro_col else ""}
                """
                cur.execute(kpi_query, (filtro_val,) if filtro_col else ())
                kpi_row = cur.fetchone()
                kpi_values = list(kpi_row[:-1])
                updated_at = kpi_row[-1]

                # Série - últimos 14 dias (agrupando e somando clicks por dia)
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
                # KPIs - última linha
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

                # Série - últimos 14 dias (agrupando por data e somando o campo do gráfico)
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
            
            # Inverter ordem para cronológica crescente
            series_points = [
                {
                    "x": row[0].date().isoformat() if isinstance(row[0], datetime) else str(row[0]),
                    "y": float(row[1]) if row[1] is not None else 0
                }
                for row in reversed(series_rows)
            ]
    
    kpis_response = {
        "values": kpi_values,
        "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at)
    }
    
    series_response = {
        "points": series_points,
        "label": system
    }
    
    return kpis_response, series_response

@app.get("/api/kpis/{system}")
async def get_kpis(system: str):
    kpis, _ = get_kpi_and_series(system)
    return kpis

@app.get("/api/series/{system}")
async def get_series(system: str):
    _, series = get_kpi_and_series(system)
    return series

@app.get("/")
async def root():
    return {"message": "B&O Dashboard API"}
