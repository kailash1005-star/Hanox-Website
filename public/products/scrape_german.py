"""
Scrape German (DE) product pages from rippa-europe.com using Firecrawl.

Reads the existing English products.json, converts each product URL to the
German version (e.g. /products/r06 -> /de/products/r06), scrapes the German
content using Firecrawl's extract API, and saves to products_de.json
with the exact same JSON structure.
"""

import json
import time
import os
import sys
from firecrawl import FirecrawlApp

# ── Configuration ──────────────────────────────────────────────────────────
FIRECRAWL_API_KEY = "fc-a5218360c4624ed9b764dc0305c9d0ba"
INPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products.json")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products_de.json")
DELAY_BETWEEN_REQUESTS = 3  # seconds between scrapes to avoid rate limiting

# ── Extraction Schema ──────────────────────────────────────────────────────
EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "product_name": {
            "type": "string",
            "description": "The product model name/number (e.g. 'R06', 'R13 PRO', 'RS 07')"
        },
        "brand": {
            "type": "string",
            "description": "The brand name (e.g. 'Rippa', 'Rippa-Europe')"
        },
        "price": {
            "type": "string",
            "description": "The full price string with currency (e.g. '5.499,00 EUR')"
        },
        "currency": {
            "type": "string",
            "description": "The currency code (e.g. 'EUR')"
        },
        "tax_note": {
            "type": "string",
            "description": "Tax note text (e.g. 'excl. MwSt')"
        },
        "availability": {
            "type": "string",
            "description": "Stock availability status in German (e.g. 'Auf Lager')"
        },
        "short_tagline": {
            "type": "string",
            "description": "The short marketing tagline/slogan for the product in German"
        },
        "description": {
            "type": "string",
            "description": "The full product description text in German. Include all description paragraphs and the checklist items with checkmarks."
        },
        "variants": {
            "type": "array",
            "description": "Product variant options (e.g. engine type, track type, bucket size)",
            "items": {
                "type": "object",
                "properties": {
                    "option_name": {
                        "type": "string",
                        "description": "The variant category name in German (e.g. 'Antrieb', 'Fahrwerk')"
                    },
                    "values": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Available values for this variant in German"
                    }
                },
                "required": ["option_name", "values"]
            }
        },
        "specifications": {
            "type": "object",
            "description": "Technical specifications organized by category",
            "properties": {
                "engine": {
                    "type": "array",
                    "description": "Engine/Motor specifications from the 'Motor' table.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string", "description": "Field name in German (e.g. 'Hersteller', 'Motortyp', 'Leistung (kW)')"},
                            "eu": {"type": "string", "description": "EU metric value (left of ' / ' separator)"},
                            "us": {"type": "string", "description": "US/imperial value (right of ' / ' separator)"}
                        },
                        "required": ["field", "eu", "us"]
                    }
                },
                "dimensions_and_weight": {
                    "type": "array",
                    "description": "From the 'Abmessungen' table. Includes Transportlaenge, Transportbreite, Transporthoehe, Bodenfreiheit, Schaufelbreite, Auslegerlaenge, etc.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "eu": {"type": "string"},
                            "us": {"type": "string"}
                        },
                        "required": ["field", "eu", "us"]
                    }
                },
                "performance_and_load": {
                    "type": "array",
                    "description": "From the 'Grundlegende Leistungsdaten' or 'Leistung und Last' table. Includes Betriebsgewicht, Schaufelvolumen, Fahrgeschwindigkeit, Steigfaehigkeit, Bodendruck, Reisskraft, Grabreichweite, Grabtiefe, Grabhoehe, Ausschutthoehe, Schwenkwinkel, etc.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "eu": {"type": "string"},
                            "us": {"type": "string"}
                        },
                        "required": ["field", "eu", "us"]
                    }
                },
                "hydraulic_system": {
                    "type": "array",
                    "description": "From the 'Hydrauliksystem' table. Includes pump, valve, motor specs.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "eu": {"type": "string"},
                            "us": {"type": "string"}
                        },
                        "required": ["field", "eu", "us"]
                    }
                },
                "other_sections": {
                    "type": "array",
                    "description": "Any additional spec sections not covered above (e.g. 'Tanks', 'Ketten', 'Reifen')",
                    "items": {
                        "type": "object",
                        "properties": {
                            "section_name": {"type": "string"},
                            "rows": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "field": {"type": "string"},
                                        "eu": {"type": "string"},
                                        "us": {"type": "string"}
                                    },
                                    "required": ["field", "eu", "us"]
                                }
                            }
                        },
                        "required": ["section_name", "rows"]
                    }
                }
            },
            "required": ["engine", "dimensions_and_weight", "performance_and_load", "hydraulic_system", "other_sections"]
        },
        "image_urls": {
            "type": "array",
            "items": {"type": "string"},
            "description": "All product image URLs (CDN URLs from rippa-europe.com/cdn/shop/files/...)"
        }
    },
    "required": [
        "product_name", "brand", "price", "currency", "tax_note",
        "availability", "short_tagline", "description", "variants",
        "specifications", "image_urls"
    ]
}

EXTRACTION_PROMPT = """
Extract ALL product information from this German (DE) product page on rippa-europe.com.

IMPORTANT RULES:
1. Keep ALL text in German exactly as it appears on the page. Do NOT translate to English.
2. For specification tables, each row has an EU value and a US value separated by " / ".
   Split them into separate "eu" and "us" fields. If only one value exists, put it in "eu" and leave "us" as empty string.
   If a value is "-" or missing, use "-" for that field.
3. Extract ALL specification rows from ALL tables on the page.
4. The specification tables are typically:
   - "Grundlegende Leistungsdaten" -> goes into "performance_and_load"
   - "Motor" -> goes into "engine"
   - "Abmessungen" -> goes into "dimensions_and_weight"
   - "Hydrauliksystem" -> goes into "hydraulic_system"
   - Any other tables (like "Tanks", "Ketten", "Reifen") -> goes into "other_sections"
5. For the description, include the full German text including the checklist items.
6. Extract ALL image URLs from the page, especially CDN image URLs.
7. For variants, extract the dropdown/selector options.
"""


def convert_to_german_url(english_url: str) -> str:
    """Convert English product URL to German URL by inserting /de/ after domain."""
    return english_url.replace(
        "https://rippa-europe.com/",
        "https://rippa-europe.com/de/"
    )


def scrape_product(app: FirecrawlApp, product: dict, index: int, total: int) -> dict:
    """Scrape a single product's German page and return the structured data."""

    english_url = product["url"]
    german_url = convert_to_german_url(english_url)
    product_name = product["product_name_input"]
    slug = product["slug"]

    print(f"\n{'='*60}")
    print(f"[{index}/{total}] Scraping: {product_name}")
    print(f"  English URL: {english_url}")
    print(f"  German  URL: {german_url}")
    print(f"{'='*60}")

    try:
        # Step 1: Use extract API for structured data extraction
        print(f"  -> Extracting structured data...")
        extract_result = app.extract(
            urls=[german_url],
            prompt=EXTRACTION_PROMPT,
            schema=EXTRACTION_SCHEMA
        )

        # Firecrawl v4 returns Pydantic models - access .data attribute
        extracted = extract_result.data if extract_result.data else {}

        # Convert to dict if it's a Pydantic model or other object
        if hasattr(extracted, 'model_dump'):
            extracted = extracted.model_dump()
        elif hasattr(extracted, '__dict__') and not isinstance(extracted, dict):
            extracted = dict(extracted)

        if not extracted:
            print(f"  [WARN] No extracted data for {product_name}")
            print(f"  Response status: {getattr(extract_result, 'status', 'unknown')}")
            print(f"  Response fields: {[f for f in extract_result.model_fields.keys()]}")
            return None

        # Step 2: Also scrape for links/images
        print(f"  -> Scraping page for images and links...")
        scrape_result = app.scrape(german_url, formats=["links"])

        page_links = []
        if hasattr(scrape_result, 'links') and scrape_result.links:
            page_links = scrape_result.links
        elif isinstance(scrape_result, dict):
            page_links = scrape_result.get("links", [])

        # Filter image URLs from page links
        image_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg')
        page_image_urls = []
        for link in page_links:
            link_url = link if isinstance(link, str) else getattr(link, 'url', str(link))
            if any(ext in link_url.lower() for ext in image_extensions):
                page_image_urls.append(link_url)

        # Use extracted image_urls if available, otherwise use page links
        extracted_images = extracted.get("image_urls", [])
        if not extracted_images:
            extracted["image_urls"] = page_image_urls

        # Build the output structure matching the English products.json
        german_product = {
            "product_name_input": product_name,
            "url": german_url,
            "url_en": english_url,
            "slug": slug,
            "structured": extracted,
            "image_urls": page_image_urls if page_image_urls else extracted.get("image_urls", []),
            "image_files": product.get("image_files", [])
        }

        print(f"  [OK] Successfully scraped: {extracted.get('product_name', 'N/A')}")
        print(f"    Price: {extracted.get('price', 'N/A')}")
        print(f"    Availability: {extracted.get('availability', 'N/A')}")
        desc_preview = extracted.get('description', '')[:80]
        print(f"    Description: {desc_preview}...")

        spec_count = 0
        specs = extracted.get('specifications', {})

        for key in ['engine', 'dimensions_and_weight', 'performance_and_load', 'hydraulic_system']:
            spec_count += len(specs.get(key, []))
        for section in specs.get('other_sections', []):
            spec_count += len(section.get('rows', []))
        print(f"    Specifications: {spec_count} rows extracted")
        print(f"    Images: {len(extracted.get('image_urls', []))} extracted, {len(page_image_urls)} from links")

        return german_product

    except Exception as e:
        print(f"  [FAIL] ERROR scraping {product_name}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def main():
    print("=" * 60)
    print("  GERMAN PRODUCT SCRAPER - rippa-europe.com/de/")
    print("=" * 60)

    print(f"\nLoading English products from: {INPUT_FILE}")

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        english_products = json.load(f)

    total = len(english_products)
    print(f"Found {total} products to scrape:\n")

    for i, p in enumerate(english_products, 1):
        de_url = convert_to_german_url(p["url"])
        print(f"  {i:2d}. {p['product_name_input']:10s} -> {de_url}")

    # ── Initialize Firecrawl ───────────────────────────────────────────────
    print(f"\nInitializing Firecrawl API...")
    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    print("  [OK] Firecrawl initialized\n")

    # ── Scrape each product ────────────────────────────────────────────────
    german_products = []
    failed_products = []

    for i, product in enumerate(english_products, 1):
        result = scrape_product(app, product, i, total)

        if result:
            german_products.append(result)
        else:
            failed_products.append(product["product_name_input"])

        # Rate limiting delay (skip after last product)
        if i < total:
            print(f"\n  [WAIT] Waiting {DELAY_BETWEEN_REQUESTS}s before next request...")
            time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Save results ───────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"\n  [OK] Successfully scraped: {len(german_products)}/{total}")

    if failed_products:
        print(f"  [FAIL] Failed: {len(failed_products)}/{total}")
        for name in failed_products:
            print(f"    - {name}")

    # Save to products_de.json
    print(f"\nSaving to: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(german_products, f, indent=2, ensure_ascii=False)

    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"  [OK] Saved! File size: {file_size / 1024:.1f} KB")
    print(f"\nDone!")


if __name__ == "__main__":
    main()
