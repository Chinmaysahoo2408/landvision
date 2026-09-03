import os
import json

transcript_path = r"C:\Users\schin\.gemini\antigravity-ide\brain\cf1c8b85-4f5d-4afd-8fce-20ee1c6f6b4e\.system_generated\logs\transcript_full.jsonl"
out_file = r"D:\landvision 3.0\ml_service\data\landvision_ml_train_1757.csv"

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        content = data.get("content", "")
        if "Karnataka,Chamarajanagar,Port Development,107.88,48.87,817" in content:
            idx = content.find("State,District,Project_Type")
            if idx != -1:
                csv_data = content[idx:].strip()
                if "</USER_REQUEST>" in csv_data:
                    csv_data = csv_data.split("</USER_REQUEST>")[0].strip()
                with open(out_file, "w", encoding="utf-8") as out:
                    out.write(csv_data)
                print(f"Successfully extracted dataset! Rows: {len(csv_data.splitlines())}")
                break
