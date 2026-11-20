import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

BASE = "https://bhoonidhi-api.nrsc.gov.in"
COLLECTIONS = [
    "ResourceSat-2_LISS4-MX70_L2",
    "ResourceSat-2A_LISS4-MX70_L2",
]
INDIA_BBOX = [68.0, 6.0, 98.0, 38.0]
OUTPUT = "data/latest.json"

def post_json(url, payload, token=None):
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))

def get_token():
    user = os.environ.get("BHOONIDHI_USER")
    password = os.environ.get("BHOONIDHI_PASSWORD")
    if not user or not password:
        raise RuntimeError("Missing GitHub Secrets BHOONIDHI_USER and/or BHOONIDHI_PASSWORD.")
    result = post_json(BASE + "/auth/token", {
        "userId": user,
        "password": password,
        "grant_type": "password"
    })
    token = result.get("access_token")
    if not token:
        raise RuntimeError("Bhoonidhi authentication did not return access_token: " +
                           json.dumps(result)[:500])
    return token

def main():
    token = get_token()
    payload = {
        "collections": COLLECTIONS,
        "bbox": INDIA_BBOX,
        "limit": 500,
        "sortby": [{"field": "datetime", "direction": "desc"}]
    }
    result = post_json(BASE + "/data/search", payload, token)
    features = result.get("features", [])

    # Keep catalogue metadata and geometries only. Do not copy large raster assets
    # or publish private download URLs into the public GitHub repository.
    cleaned = []
    for item in features:
        cleaned.append({
            "type": "Feature",
            "id": item.get("id"),
            "collection": item.get("collection"),
            "geometry": item.get("geometry"),
            "properties": {
                "datetime": (item.get("properties") or {}).get("datetime"),
                "start_datetime": (item.get("properties") or {}).get("start_datetime"),
                "end_datetime": (item.get("properties") or {}).get("end_datetime"),
                "platform": (item.get("properties") or {}).get("platform"),
                "instruments": (item.get("properties") or {}).get("instruments"),
            }
        })

    cleaned.sort(
        key=lambda f: (f["properties"].get("datetime") or
                       f["properties"].get("start_datetime") or ""),
        reverse=True
    )

    output = {
        "status": "ok",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "India-wide LISS-4 catalogue results. Footprints and metadata only; no raster imagery is hosted here.",
        "query": {"collections": COLLECTIONS, "bbox": INDIA_BBOX},
        "features": cleaned
    }
    os.makedirs("data", exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Saved {len(cleaned)} LISS-4 catalogue features to {OUTPUT}")

if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(f"Bhoonidhi HTTP error {exc.code}: {detail[:1500]}", file=sys.stderr)
        raise
