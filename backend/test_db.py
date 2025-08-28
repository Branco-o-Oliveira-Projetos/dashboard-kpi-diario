import psycopg
from psycopg_pool import ConnectionPool
from config import DATABASE_URL

# Cria o pool de conexões
pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5)

try:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Verifica se a tabela evolution_daily existe
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'kpi_tv' 
                    AND table_name = 'evolution_daily'
                );
            """)
            table_exists = cur.fetchone()[0]
            print(f"Tabela evolution_daily existe: {table_exists}")
            
            if table_exists:
                # Conta quantos registros existem
                cur.execute("SELECT COUNT(*) FROM kpi_tv.evolution_daily")
                count = cur.fetchone()[0]
                print(f"Número de registros: {count}")
                
                if count > 0:
                    # Mostra uma amostra dos dados
                    cur.execute("SELECT * FROM kpi_tv.evolution_daily LIMIT 1")
                    sample = cur.fetchone()
                    columns = [desc[0] for desc in cur.description]
                    print(f"Colunas: {columns}")
                    print(f"Exemplo de registro: {sample}")
            else:
                # Lista tabelas disponíveis no schema kpi_tv
                cur.execute("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'kpi_tv'
                    ORDER BY table_name
                """)
                tables = cur.fetchall()
                print("Tabelas disponíveis no schema kpi_tv:")
                for table in tables:
                    print(f"  - {table[0]}")
                    
except Exception as e:
    print(f"Erro ao conectar ao banco: {e}")
