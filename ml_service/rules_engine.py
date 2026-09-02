from typing import Dict, Any, List

DEFAULT_RULES = [
    {
        "id": "RULE-01",
        "name": "Pending Litigation Resolution",
        "condition": lambda p: p.get("Legal_Dispute") == "Yes" or p.get("Court_Case") == "Yes",
        "priority": 1,
        "title": "Convene Special Lok Adalat for Fast-Track Title & Quantum Settlement",
        "action": "Coordinate with District Legal Services Authority (DLSA) to offer structured Section 64/76 consent settlement terms to petitioning landowners.",
        "statutory_act": "Right to Fair Compensation & Transparency (RFCTLARR) Act, 2013 Sec 64",
        "department": "District Administration & DLSA"
    },
    {
        "id": "RULE-02",
        "name": "Forest Clearance Diversion",
        "condition": lambda p: str(p.get("Forest_Clearance", "")).lower() in ["pending", "under review", "no"],
        "priority": 1,
        "title": "Expedite Stage-II Forest Diversion Review with MoEFCC",
        "action": "Submit verified Non-Forest Land Compensatory Afforestation (CA) ledger and micro-alignment tree enumeration report to Regional Empowered Committee.",
        "statutory_act": "Forest (Conservation) Act, 1980 Section 2",
        "department": "State Forest Department & MoEFCC Regional Office"
    },
    {
        "id": "RULE-03",
        "name": "Environmental Conditions Compliance",
        "condition": lambda p: str(p.get("Environmental_Clearance", "")).lower() in ["pending", "under review", "no"],
        "priority": 2,
        "title": "Complete Environmental Public Hearing & EMP Compliance",
        "action": "Submit revised Environmental Management Plan (EMP) and ecological baseline survey to State Environmental Impact Assessment Authority (SEIAA).",
        "statutory_act": "EIA Notification 2006 (Environment Protection Act 1986)",
        "department": "SEIAA / State Pollution Control Board"
    },
    {
        "id": "RULE-04",
        "name": "R&R Resettlement Package",
        "condition": lambda p: p.get("Rehabilitation_Issue") == "Yes" or float(p.get("Affected_Families", 0)) > 500,
        "priority": 2,
        "title": "Finalize Alternate Resettlement Colony & Livelihood Grants",
        "action": "Complete civic infrastructure (potable water, road connectivity, electricity) at designated transit rehabilitation colony before issuing Section 38 possession notice.",
        "statutory_act": "RFCTLARR Act 2013 Chapter V (Resettlement & Rehabilitation)",
        "department": "R&R Commissioner & Project Directorate"
    },
    {
        "id": "RULE-05",
        "name": "High Payment & Compensation Lag",
        "condition": lambda p: float(p.get("Payment_Delay", 0)) > 60 or float(p.get("Compensation_Amount", 0)) > 1000000000,
        "priority": 2,
        "title": "Accelerate Direct Benefit Transfer (PFMS) Disbursal",
        "action": "Establish Village Camp DBT Verification desks with Revenue Inspectors and lead nationalized bank managers for zero-delay e-mandate clearance.",
        "statutory_act": "RFCTLARR Act 2013 Section 77 (Payment of Compensation)",
        "department": "CALA Office & District Treasury"
    },
    {
        "id": "RULE-06",
        "name": "Critical Possession Path Delay",
        "condition": lambda p: float(p.get("Possession_Delay", 0)) > 120 or float(p.get("Land_Remaining_Hectare", 0)) > 100,
        "priority": 3,
        "title": "Phased Section 38 Land Demarcation & Boundary Enclosure",
        "action": "Deploy high-accuracy DGPS/Drone survey teams to erect boundary pillars on uncontested parcels for immediate contractor mobilization.",
        "statutory_act": "RFCTLARR Act 2013 Section 38 (Power to take possession)",
        "department": "Executive Engineer (Executing Agency) & CALA"
    }
]

def generate_recommendations(project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    recs = []
    for rule in DEFAULT_RULES:
        try:
            if rule["condition"](project_data):
                recs.append({
                    "id": rule["id"],
                    "priority": rule["priority"],
                    "title": rule["title"],
                    "action": rule["action"],
                    "statutory_act": rule["statutory_act"],
                    "department": rule["department"]
                })
        except Exception:
            continue
            
    if not recs:
        recs.append({
            "id": "RULE-GEN",
            "priority": 3,
            "title": "Standard Statutory Milestone Tracking",
            "action": "Maintain scheduled bi-weekly DLCC monitoring review under District Collector supervision.",
            "statutory_act": "Standard Administrative Operating Procedure",
            "department": "District Revenue Administration"
        })
        
    recs.sort(key=lambda x: x["priority"])
    return recs[:4]
