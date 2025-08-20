import os

DB_HOST = os.getenv('DB_HOST', '134.255.182.159')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'dashboard-diario')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'mkt2024')
DB_TIMEOUT = int(os.getenv('DB_TIMEOUT', '5'))

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
