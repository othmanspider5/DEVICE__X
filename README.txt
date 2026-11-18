DEVICE X PRO — Created by Othman Lammallah

WHAT'S INCLUDED
- Responsive PC + mobile device explorer.
- 800 device records loaded from public CSV datasets: 500 smartphone records and 300 laptop records.
- Search by model, brand, processor and visible specifications.
- Filters by device type and brand.
- Device detail view with source links.
- Product-photo lookup through Wikimedia Commons. Images are fetched on demand; not every model is guaranteed to have a matching Commons photo.
- No fake local placeholder specifications are generated.

DATA SOURCES
1) Smartphone Specs India: https://github.com/abhinavflac/smartphone-specs-india
   The repository describes 758 cleaned smartphone entries. Its dataset is collected from Indian online listings and is not an official manufacturer database.
2) Laptop Specs Dataset: https://github.com/abhinavflac/laptops-specs-dataset
   The repository describes 992 cleaned laptop entries and 27 structured features. It is based on Indian online marketplace listings.

IMPORTANT DATA QUALITY NOTE
This build loads 500 smartphone rows and 300 laptop rows (800 total) from the public datasets at runtime. These are community-collected listings, not manufacturer-verified specifications. RAM/storage configurations can differ. Check the linked source and manufacturer's product page before relying on a specification. Prices are intentionally not shown because Indian-market prices are not directly comparable to Moroccan prices.

IMAGES
Photos are looked up by exact model name via the Wikimedia Commons public API. Search results can be missing or mismatched, so the app hides the photo area fallback when no result is found. Wikimedia image licensing/attribution belongs to each individual file page.

DEPLOY TO GITHUB PAGES
1. Extract DEVICE_X_PRO.zip.
2. Open your existing GitHub repository DEVICE_X.
3. Remove the old index.html, styles.css, app.js, and README.txt (optional: keep README.md).
4. Upload the new index.html, styles.css, app.js, and README.txt to the repository root.
5. Commit changes. GitHub Pages will redeploy automatically.

The app fetches the CSV data from raw.githubusercontent.com and image search from Wikimedia Commons, so visitors need an internet connection.
