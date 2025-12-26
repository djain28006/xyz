
import sys
import os
sys.path.append(os.getcwd())
from backend.data_loader import DataLoader
# import pandas as pd # Removed unused import

try:
    loader = DataLoader("default")
    print("Data loaded successfully")
    print("Investments:", len(loader.data.get("investments", [])))
    print("Subscriptions:", len(loader.data.get("subscriptions", [])))
except Exception as e:
    import traceback
    traceback.print_exc()
