import json
import os

transcript_path = r"C:\Users\schin\.gemini\antigravity-ide\brain\cf1c8b85-4f5d-4afd-8fce-20ee1c6f6b4e\.system_generated\logs\transcript_full.jsonl"
out_csv = r"D:\landvision 3.0\ml_service\data\landvision_ml_train_1757.csv"

rows = []
header = "State,District,Project_Type,Land_Required_Hectare,Land_Remaining_Hectare,Affected_Families,Compensation_Amount,Project_Cost,Legal_Dispute,Court_Case,Environmental_Clearance,Forest_Clearance,Rehabilitation_Issue,Overall_Delay"

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            d = json.loads(line)
        except Exception:
            continue
        content = d.get("content", "")
        if "Overall_Delay" in content:
            lines = content.splitlines()
            for l in lines:
                l = l.strip()
                if l.startswith("<") or l.startswith("```") or not l:
                    continue
                parts = l.split(",")
                if len(parts) == 14 and parts[0] != "State":
                    # Verify it's a valid data row (14 columns, last column is a number)
                    try:
                        float(parts[3]) # Land_Required_Hectare
                        float(parts[-1]) # Overall_Delay
                        rows.append(l)
                    except ValueError:
                        pass

print(f"Total raw matched rows: {len(rows)}")

# Deduplicate preserving order
seen = set()
unique_rows = []
for r in rows:
    if r not in seen:
        seen.add(r)
        unique_rows.append(r)

print(f"Unique rows: {len(unique_rows)}")

os.makedirs(os.path.dirname(out_csv), exist_ok=True)
with open(out_csv, "w", encoding="utf-8") as out_f:
    out_f.write(header + "\n")
    for r in unique_rows:
        out_f.write(r + "\n")

# Also update ml_service/seed_data.csv so that startup bootstrap uses this exact 1757 dataset
with open(r"D:\landvision 3.0\ml_service\seed_data.csv", "w", encoding="utf-8") as seed_f:
    seed_f.write(header + "\n")
    for r in unique_rows:
        seed_f.write(r + "\n")

print(f"Successfully wrote {len(unique_rows)} records to {out_csv} and ml_service/seed_data.csv")
