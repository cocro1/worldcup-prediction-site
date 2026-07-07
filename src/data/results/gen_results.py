#!/usr/bin/env python3
"""Generate draft result JSON files for 2026 World Cup completed matches."""
import json, os

draft_dir = r"D:\我的坚果云\fwc2026\data\results\draft"
now = "2026-06-26T08:30:00+08:00"
source = {
    "primary": "FIFA official match page",
    "checked_sources": [
        "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings",
        "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup"
    ]
}

def wf(match_id, home, away, extra=None, penalty=None):
    body = {
        "schema_version": "1.0",
        "match_id": match_id,
        "status": "result_verified",
        "home_score_90": home,
        "away_score_90": away,
        "total_goals_90": home + away,
        "extra_time_score": extra,
        "penalty_score": penalty,
        "source": source,
        "verified_at": now
    }
    path = os.path.join(draft_dir, f"{match_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(body, f, ensure_ascii=False, indent=2)
    print(f"  {match_id} -> {home}-{away}")

# === GROUP A ===
wf("2026-06-12-group-a-mexico-south-africa", 2, 0)
wf("2026-06-12-group-a-south-korea-czechia", 2, 1)
wf("2026-06-19-group-a-czechia-south-africa", 1, 1)
wf("2026-06-19-group-a-mexico-south-korea", 1, 0)

# === GROUP B ===
wf("2026-06-13-group-b-canada-bosnia-and-herzegovina", 1, 1)
wf("2026-06-14-group-b-qatar-switzerland", 1, 1)
wf("2026-06-19-group-b-switzerland-bosnia-and-herzegovina", 4, 1)
wf("2026-06-19-group-b-canada-qatar", 6, 0)

# === GROUP C ===
wf("2026-06-14-group-c-brazil-morocco", 1, 1)
wf("2026-06-14-group-c-haiti-scotland", 0, 1)
wf("2026-06-20-group-c-scotland-morocco", 0, 2)
wf("2026-06-20-group-c-brazil-haiti", 4, 0)

# === GROUP D ===
wf("2026-06-13-group-d-united-states-paraguay", 4, 1)
wf("2026-06-14-group-d-australia-turkey", 2, 0)
wf("2026-06-20-group-d-united-states-australia", 2, 0)
wf("2026-06-20-group-d-turkey-paraguay", 0, 2)

# === GROUP E ===
wf("2026-06-15-group-e-germany-curacao", 7, 1)
wf("2026-06-15-group-e-ivory-coast-ecuador", 1, 0)
wf("2026-06-21-group-e-germany-ivory-coast", 2, 1)
wf("2026-06-21-group-e-ecuador-curacao", 0, 0)

# === GROUP F ===
wf("2026-06-15-group-f-netherlands-japan", 2, 2)
wf("2026-06-15-group-f-sweden-tunisia", 5, 1)
wf("2026-06-21-group-f-netherlands-sweden", 5, 1)
wf("2026-06-21-group-f-tunisia-japan", 0, 4)

# === GROUP G ===
wf("2026-06-16-group-g-belgium-egypt", 1, 1)
wf("2026-06-16-group-g-iran-new-zealand", 2, 2)
wf("2026-06-22-group-g-belgium-iran", 0, 0)
wf("2026-06-22-group-g-new-zealand-egypt", 1, 3)

# === GROUP H ===
wf("2026-06-16-group-h-spain-cape-verde", 0, 0)
wf("2026-06-16-group-h-saudi-arabia-uruguay", 1, 1)
wf("2026-06-22-group-h-spain-saudi-arabia", 4, 0)
wf("2026-06-22-group-h-uruguay-cape-verde", 2, 2)

# === GROUP I ===
wf("2026-06-17-group-i-france-senegal", 3, 1)
wf("2026-06-17-group-i-iraq-norway", 1, 4)
wf("2026-06-23-group-i-france-iraq", 3, 0)
wf("2026-06-23-group-i-norway-senegal", 3, 2)

# === GROUP J ===
wf("2026-06-17-group-j-argentina-algeria", 3, 0)
wf("2026-06-17-group-j-austria-jordan", 3, 1)
wf("2026-06-23-group-j-argentina-austria", 2, 0)
wf("2026-06-23-group-j-jordan-algeria", 1, 2)

# === GROUP K ===
wf("2026-06-18-group-k-portugal-dr-congo", 1, 1)
wf("2026-06-18-group-k-uzbekistan-colombia", 1, 3)
wf("2026-06-24-group-k-portugal-uzbekistan", 5, 0)
wf("2026-06-24-group-k-colombia-dr-congo", 1, 0)

# === GROUP L ===
wf("2026-06-18-group-l-england-croatia", 4, 2)
wf("2026-06-18-group-l-ghana-panama", 1, 0)
wf("2026-06-24-group-l-england-ghana", 0, 0)

files = os.listdir(draft_dir)
json_files = [f for f in files if f.endswith('.json') and f != 'gen_results.py']
print(f"\nDone! {len(json_files)} draft result files generated.")
