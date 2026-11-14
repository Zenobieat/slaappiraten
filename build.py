#!/usr/bin/env python3
"""Bouwt index.html uit src/app.html (+ data/tournify.json als reserve)."""
import json, pathlib
root = pathlib.Path(__file__).parent
app = (root / "src/app.html").read_text(encoding="utf-8")
seed = json.dumps(json.loads((root / "data/tournify.json").read_text(encoding="utf-8")), ensure_ascii=False)
body = app.replace("/*SEED*/null", seed)
import re
demo = re.sub(r'supabaseUrl: "[^"]*"', 'supabaseUrl: ""', body)  # voorbeeld = altijd demomodus
(root / "preview.html").write_text(demo, encoding="utf-8")
page = '<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace("<style>", "<style>\n:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}", 1) + "\n</html>\n"
page = page.replace('<header class="top">', '</head>\n<body>\n<header class="top">', 1).replace("\n</html>", "\n</body>\n</html>")
(root / "index.html").write_text(page, encoding="utf-8")
print("ok", len(page))
