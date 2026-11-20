# India LISS-4 Explorer — GitHub Pages starter

This starter site displays **catalogue scene footprints and metadata**, not the full satellite raster imagery.

## Files

- `index.html` — page structure
- `style.css` — lightweight styling
- `app.js` — Leaflet map and catalogue display
- `data/latest.json` — public metadata file read by the website
- `update.py` — server-side Bhoonidhi API query
- `.github/workflows/update-liss4.yml` — daily scheduled update

## Before you start

1. Create/register a Bhoonidhi account.
2. Ask NRSC/Bhoonidhi to enable API access for your account. Their API documentation says API access requires a registered login and API access enablement.
3. Do not put your Bhoonidhi password in `app.js`, `index.html`, or any public file.

Official API documentation: https://bhoonidhi.nrsc.gov.in/bhoonidhi-api/

## Upload to GitHub

1. Create a new **public** GitHub repository, e.g. `india-liss4-explorer`.
2. Extract this ZIP on your PC.
3. Upload all files and folders to the repository's main branch. Make sure `.github/workflows/update-liss4.yml` is included.
4. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
5. Add:
   - Name: `BHOONIDHI_USER` — value: your Bhoonidhi user ID
   - Name: `BHOONIDHI_PASSWORD` — value: your Bhoonidhi password
6. Open **Actions** tab. If prompted, enable workflows.
7. Select **Update LISS-4 catalogue** → **Run workflow**.
8. Check the run log. If successful, `data/latest.json` will be updated.
9. Open **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
10. Wait for GitHub Pages to publish. Your site URL will look like `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Automatic updates

The workflow runs daily at 08:00 India Standard Time (02:30 UTC). GitHub scheduled workflows can start later than the exact scheduled time, so treat this as a daily check, not a guaranteed minute-by-minute update.

You can also run it manually from Actions → Update LISS-4 catalogue → Run workflow.

## What this version does

- Searches India-wide bounding box `[68, 6, 98, 38]`.
- Searches both `ResourceSat-2_LISS4-MX70_L2` and `ResourceSat-2A_LISS4-MX70_L2`.
- Displays scene footprints, acquisition date, satellite and scene ID.
- Stores only small catalogue metadata in GitHub.

## What this version does NOT do

- It does not display the actual LISS-4 pixel imagery.
- It does not download GeoTIFFs or generate map tiles.
- It does not expose Bhoonidhi credentials to website visitors.
- It does not guarantee every search result is returned if the catalogue has more than 500 matching scenes; pagination can be added later.

## Troubleshooting

- **401 Unauthorized:** check credentials and API access enablement.
- **403 Forbidden:** Bhoonidhi may have reached its active-session limit; check account/API access.
- **429 Too Many Requests:** wait and retry later; do not repeatedly trigger the workflow.
- **500 / 503:** likely a temporary API-side issue; retry later.
- **No scenes:** verify collection IDs and API access; a successful empty search does not prove that no LISS-4 data exists anywhere.
- **Map blank:** check internet access; the basemap and Leaflet library load from external CDNs.

## Data use

This starter shows public-facing catalogue metadata and scene footprints only. Before making a public service that serves previews, raster tiles, or original data, check the current Bhoonidhi licence and obtain NRSC clarification where needed.
