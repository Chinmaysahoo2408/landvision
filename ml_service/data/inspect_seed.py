import os
import pandas as pd

header = "State,District,Project_Type,Land_Required_Hectare,Land_Remaining_Hectare,Affected_Families,Compensation_Amount,Project_Cost,Legal_Dispute,Court_Case,Environmental_Clearance,Forest_Clearance,Rehabilitation_Issue,Overall_Delay"

# Let's inspect ml_service/seed_data.csv to see if it already has columns or data
seed_csv_path = r"D:\landvision 3.0\ml_service\seed_data.csv"
if os.path.exists(seed_csv_path):
    print(f"seed_data.csv exists: size {os.path.getsize(seed_csv_path)} bytes")
    try:
        df = pd.read_csv(seed_csv_path)
        print("Columns:", df.columns.tolist())
        print("Shape:", df.shape)
    except Exception as e:
        print("Error reading seed_data.csv:", e)
