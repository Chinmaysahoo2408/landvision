import json

p = r"C:\Users\schin\.gemini\antigravity-ide\brain\cf1c8b85-4f5d-4afd-8fce-20ee1c6f6b4e\.system_generated\logs\transcript_full.jsonl"
with open(p, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        content = data.get("content", "")
        if "Karnataka,Chamarajanagar" in content or "Bihar,Sheikhpura" in content:
            print(f"Match line {i}: len {len(content)}")
            # Let's save content directly to a text file
            with open(f"ml_service/data/raw_match_{i}.txt", "w", encoding="utf-8") as raw_f:
                raw_f.write(content)
