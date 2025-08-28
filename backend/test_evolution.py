from main import get_kpi_and_series

try:
    result = get_kpi_and_series('evolution')
    print("SUCCESS: Evolution API funcionou!")
    print("KPIs:", result[0])
    print("Series:", result[1])
except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
