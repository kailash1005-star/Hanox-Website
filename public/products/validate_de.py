import json

data = json.load(open(r'C:\Users\WELCOME\Desktop\FL\Hanox-Website\public\products\products_de.json', encoding='utf-8'))
print(f"Total products: {len(data)}")
print(f"File size: {len(json.dumps(data, ensure_ascii=False)) / 1024:.1f} KB")
print()

for p in data:
    s = p["structured"]
    specs = s.get("specifications", {})
    spec_count = sum(len(specs.get(k, [])) for k in ["engine", "dimensions_and_weight", "performance_and_load", "hydraulic_system"])
    other = sum(len(sec.get("rows", [])) for sec in specs.get("other_sections", []))
    imgs = len(s.get("image_urls", []))
    desc_len = len(s.get("description", ""))
    print(f"  {p['product_name_input']:10s} | {s['price']:>18s} | {s['availability']:10s} | {spec_count+other:2d} spec rows | {imgs:2d} imgs | desc: {desc_len} chars")
