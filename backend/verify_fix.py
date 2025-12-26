from data_loader import DataLoader
import json

def test_load():
    loader = DataLoader()
    data = loader.data
    
    print(f"Loaded from: {data.get('loaded_from')}")
    print(f"Budgets: {len(data.get('budgets', []))}")
    print(f"Subscriptions: {len(data.get('subscriptions', []))}")
    print(f"Insights: {len(data.get('insights', []))}")
    
    if data.get('budgets'):
        print("\nFirst Budget:")
        print(json.dumps(data['budgets'][0], indent=2))
        
    if data.get('subscriptions'):
        print("\nFirst Subscription:")
        print(json.dumps(data['subscriptions'][0], indent=2))
        
    if data.get('insights'):
        print("\nFirst Insight:")
        print(json.dumps(data['insights'][0], indent=2))

if __name__ == "__main__":
    test_load()
