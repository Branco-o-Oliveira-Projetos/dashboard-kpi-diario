import psycopg
from config import DATABASE_URL

def test_meta_ads_table():
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Verifica se a tabela existe
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'kpi_tv' 
                        AND table_name = 'meta_ads_daily'
                    );
                """)
                exists = cur.fetchone()[0]
                print(f"Tabela meta_ads_daily existe: {exists}")
                
                if exists:
                    # Conta registros
                    cur.execute("SELECT COUNT(*) FROM kpi_tv.meta_ads_daily")
                    count = cur.fetchone()[0]
                    print(f"Número de registros: {count}")
                    
                    # Mostra estrutura da tabela
                    cur.execute("""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_schema = 'kpi_tv' 
                        AND table_name = 'meta_ads_daily'
                        ORDER BY ordinal_position
                    """)
                    columns = cur.fetchall()
                    print("Colunas:")
                    for col in columns:
                        print(f"  {col[0]} ({col[1]})")
                    
                    if count > 0:
                        # Mostra exemplo de registro
                        cur.execute("SELECT * FROM kpi_tv.meta_ads_daily LIMIT 1")
                        sample = cur.fetchone()
                        print(f"Exemplo de registro: {sample}")
                else:
                    print("Tabela meta_ads_daily não existe!")
                    
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")

if __name__ == "__main__":
    test_meta_ads_table()
