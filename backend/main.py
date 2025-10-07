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
        'filtro_val': '78157',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['oportunidades_recebidas', 'oportunidades_ganhas', 'oportunidades_perdidas'],
        'chart_col': 'oportunidades_recebidas',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'n8n': {
        'schema': 'kpi_tv',
        'tabela': 'n8n_daily',
        'filtro_col': 'workspace_id',
        'filtro_val': 'HJDfVFxTb7w1KNDD',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['flows_total', 'runs_success', 'runs_failed', 'avg_duration_sec'],
        'chart_col': 'runs_success',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'conta_azul': {
        'schema': 'kpi_tv',
        'tabela': 'conta_azul_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['recebiveisHojeValor', 'entradaValor', 'pagaveisHojeValor'],
        'chart_col': 'entradaValor',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'cpj3c': {
        'schema': 'kpi_tv',
        'tabela': 'cpj_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['audiencias', 'pericias', 'processos'],
        'chart_col': 'audiencias',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'meta_ads': {
        'schema': 'kpi_tv',
        'tabela': 'meta_ads_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['cost', 'leads', 'clicks', 'cpl', 'cpc'],
        'chart_col': 'clicks',
        'kpi_query_type': 'aggregated',
        'kpi_aggregations': {
            'cost': 'SUM',
            'leads': 'SUM', 
            'clicks': 'SUM',
            'cpl': 'AVG',
            'cpc': 'AVG'
        },
        'series_aggregation': 'SUM'
    },
    'google_ads': {
        'schema': 'kpi_tv',
        'tabela': 'google_ads_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['cost', 'leads', 'clicks', 'cpl', 'cpc'],
        'chart_col': 'clicks',
        'kpi_query_type': 'aggregated',
        'kpi_aggregations': {
            'cost': 'SUM',
            'leads': 'SUM',
            'clicks': 'SUM', 
            'cpl': 'AVG',
            'cpc': 'AVG'
        },
        'series_aggregation': 'SUM'
    },
    'ti': {
        'schema': 'kpi_tv',
        'tabela': 'ti_chamados_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['abertos', 'andamento', 'resolvidos_hoje'],
        'chart_col': 'resolvidos_hoje',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'liderhub': {
        'schema': 'kpi_tv',
        'tabela': 'liderhub_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'updated_at',
        'kpi_cols': ['aguardando', 'em_andamento', 'finalizadas'],
        'chart_col': 'finalizadas',
        'kpi_query_type': 'single_row',
        'series_aggregation': 'SUM'
    },
    'evolution': {
        'schema': 'kpi_tv',
        'tabela': 'evolution_daily',
        'filtro_col': '',
        'filtro_val': '',
        'date_col': 'ref_date',
        'updated_col': 'update_at',
        'kpi_cols': ['conn_state_open', 'conn_state_not_open', 'messages_sent_total', 'frt_avg_minutes', 'total_instances'],
        'chart_col': 'messages_sent_total',
        'kpi_query_type': 'custom',
        'custom_kpi_query': """
            SELECT 
                COUNT(CASE WHEN conn_state_current = 'open' THEN 1 END) as conn_state_open,
                COUNT(CASE WHEN conn_state_current != 'open' THEN 1 END) as conn_state_not_open,
                SUM(messages_sent_total) as messages_sent_total,
                AVG(frt_avg_minutes) as frt_avg_minutes,
                COUNT(*) as total_instances,
                MAX({updated_col}) as updated_at
            FROM {schema}.{tabela}
            WHERE {date_col} = (
                SELECT MAX({date_col}) FROM {schema}.{tabela}
                {where_filter}
            )
            {and_filter}
        """,
        'series_aggregation': 'SUM',
        'custom_series_query': """
            SELECT {date_col}, COUNT(*) as value_sum
            FROM {schema}.{tabela}
            GROUP BY {date_col}
            ORDER BY {date_col} DESC
            LIMIT 14
        """
    },
}

def build_kpi_query(config: Dict[str, Any]) -> str:
    """Constrói a query de KPI baseada na configuração do sistema"""
    schema = config['schema']
    tabela = config['tabela']
    date_col = config['date_col']
    updated_col = config['updated_col']
    filtro_col = config['filtro_col']
    kpi_query_type = config['kpi_query_type']
    
    # Constrói as condições de filtro
    where_filter = f"WHERE {filtro_col} = %s" if filtro_col else ""
    and_filter = f"AND {filtro_col} = %s" if filtro_col else ""
    
    if kpi_query_type == 'custom':
        # Para queries customizadas como evolution
        return config['custom_kpi_query'].format(
            schema=schema,
            tabela=tabela,
            date_col=date_col,
            updated_col=updated_col,
            where_filter=where_filter,
            and_filter=and_filter
        )
    elif kpi_query_type == 'aggregated':
        # Para sistemas que precisam de agregação como meta_ads/google_ads
        kpi_aggregations = config['kpi_aggregations']
        select_clause = ", ".join([
            f"{agg}({col}) AS {col}_{agg.lower()}" 
            for col, agg in kpi_aggregations.items()
        ])
        return f"""
            SELECT 
                {select_clause},
                MAX({updated_col}) AS updated_at
            FROM {schema}.{tabela}
            WHERE {date_col} = (
                SELECT MAX({date_col}) FROM {schema}.{tabela}
                {where_filter}
            )
            {and_filter}
        """
    else:
        # Para sistemas que pegam a linha mais recente (single_row)
        kpi_cols = config['kpi_cols']
        return f"""
            SELECT {', '.join(kpi_cols)}, {updated_col}
            FROM {schema}.{tabela}
            {where_filter}
            ORDER BY {date_col} DESC
            LIMIT 1
        """

def build_series_query(config: Dict[str, Any]) -> str:
    """Constrói a query de série temporal baseada na configuração do sistema"""
    
    # Se tem query customizada para série, usa ela
    if 'custom_series_query' in config:
        schema = config['schema']
        tabela = config['tabela']
        date_col = config['date_col']
        filtro_col = config['filtro_col']
        
        where_filter = f"WHERE {filtro_col} = %s" if filtro_col else ""
        
        return config['custom_series_query'].format(
            schema=schema,
            tabela=tabela,
            date_col=date_col,
            where_filter=where_filter
        )
    
    # Caso contrário, usa a lógica padrão
    schema = config['schema']
    tabela = config['tabela']
    date_col = config['date_col']
    filtro_col = config['filtro_col']
    chart_col = config['chart_col']
    series_aggregation = config['series_aggregation']
    
    where_filter = f"WHERE {filtro_col} = %s" if filtro_col else ""
    
    return f"""
        SELECT {date_col}, {series_aggregation}({chart_col}) as value_sum
        FROM {schema}.{tabela}
        {where_filter}
        GROUP BY {date_col}
        ORDER BY {date_col} DESC
        LIMIT 14
    """

def get_query_params(config: Dict[str, Any]) -> tuple:
    """Retorna os parâmetros para as queries baseado na configuração"""
    filtro_col = config['filtro_col']
    filtro_val = config['filtro_val']
    
    if not filtro_col:
        return ()
    
    kpi_query_type = config['kpi_query_type']
    if kpi_query_type in ['custom', 'aggregated']:
        # Para queries que precisam do filtro duas vezes (subquery + where principal)
        return (filtro_val, filtro_val)
    else:
        # Para queries single_row que só precisam do filtro uma vez
        return (filtro_val,)

def get_kpi_and_series(system: str) -> tuple[Dict[str, Any], Dict[str, Any]]:
    """Função refatorada que usa configuração ao invés de if/else"""
    if system not in SISTEMAS_DB:
        raise HTTPException(status_code=404, detail="Sistema não encontrado")
    
    config = SISTEMAS_DB[system]
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Executa query de KPI
            kpi_query = build_kpi_query(config)
            kpi_params = get_query_params(config)
            
            cur.execute(kpi_query, kpi_params)
            kpi_row = cur.fetchone()
            
            if not kpi_row:
                raise HTTPException(status_code=404, detail="Dados não encontrados")
            
            kpi_values = list(kpi_row[:-1])
            updated_at = kpi_row[-1]
            
            # Executa query de série temporal
            series_query = build_series_query(config)
            series_params = (config['filtro_val'],) if config['filtro_col'] else ()
            
            cur.execute(series_query, series_params)
            series_rows = cur.fetchall()
            
            # Monta os pontos da série para o frontend (ordem cronológica crescente)
            series_points = [
                {
                    "x": row[0].date().isoformat() if isinstance(row[0], datetime) else str(row[0]),
                    "y": float(row[1]) if row[1] is not None else 0
                }
                for row in reversed(series_rows)
            ]
    
    # Monta as respostas
    kpis_response = {
        "values": kpi_values,
        "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at)
    }
    
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
    date_col = config['date_col']
    updated_col = config['updated_col']
    
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Monta a query de detalhes usando a configuração
            where_clause = f"WHERE {filtro_col} = %s" if filtro_col else ""
            detailed_query = f"""
                SELECT *
                FROM {schema}.{tabela}
                {where_clause}
                ORDER BY {date_col} DESC, {updated_col} DESC
                LIMIT 1000
            """
            
            params = (filtro_val,) if filtro_col else ()
            cur.execute(detailed_query, params)
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
            # Consulta dados das 3 pipelines específicas usando ANY
            detailed_query = """
                SELECT *
                FROM kpi_tv.piperun_daily
                WHERE pipeline_id = ANY(%s)
                ORDER BY ref_date DESC, updated_at DESC
                LIMIT 1000
            """
            
            cur.execute(detailed_query, (pipeline_ids,))
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
