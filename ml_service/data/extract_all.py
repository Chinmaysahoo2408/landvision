import json
import os

p = r"C:\Users\schin\.gemini\antigravity-ide\brain\cf1c8b85-4f5d-4afd-8fce-20ee1c6f6b4e\.system_generated\logs\transcript_full.jsonl"
out_csv = r"D:\landvision 3.0\ml_service\data\landvision_ml_train_1757.csv"

matched_lines = []

def extract_rows(text):
    if not isinstance(text, str):
        return
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("<") or line.startswith("```"):
            continue
        parts = line.split(",")
        if len(parts) == 14 and parts[0] != "State":
            try:
                float(parts[3])
                float(parts[-1])
                matched_lines.append(line)
            except ValueError:
                pass

with open(p, "r", encoding="utf-8") as f:
    for l in f:
        try:
            obj = json.loads(l)
        except Exception:
            continue
        # Scan entire json recursive
        def scan(val):
            if isinstance(val, str):
                extract_rows(val)
            elif isinstance(val, dict):
                for v in val.values():
                    scan(v)
            elif isinstance(val, list):
                for v in val:
                    scan(v)
        scan(obj)

print(f"Total raw matched lines: {len(matched_lines)}")
unique = []
seen = set()
for r in matched_lines:
    if r not in seen:
        seen.add(r)
        unique.append(r)

print(f"Unique lines: {len(unique)}")

header = "State,District,Project_Type,Land_Required_Hectare,Land_Remaining_Hectare,Affected_Families,Compensation_Amount,Project_Cost,Legal_Dispute,Court_Case,Environmental_Clearance,Forest_Clearance,Rehabilitation_Issue,Overall_Delay"

if len(unique) > 0:
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    with open(out_csv, "w", encoding="utf-8") as f:
        f.write(header + "\n")
        for u in unique:
            f.write(u + "\n")
    with open(r"D:\landvision 3.0\ml_service\seed_data.csv", "w", encoding="utf-8") as f:
        f.write(header + "\n")
        for u in unique:
            f.write(u + "\n")
    print(f"Saved {len(unique)} records to {out_csv} and seed_data.csv")
