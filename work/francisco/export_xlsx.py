"""Export the live Supabase graph to graph/might-graph.xlsx (sheets Participantes, Ligações). Rerun to refresh."""
import json, urllib.request
from pathlib import Path
import openpyxl

URL = "https://pkabsodqwruyccphfkud.supabase.co/rest/v1/"
KEY = Path(__file__).with_name("graph.js").read_text(encoding="utf8").split('supabase.co",')[1].split('"')[1]


def get(view):
    out, step = [], 1000
    while True:
        r = urllib.request.Request(f"{URL}{view}?select=*&order=id&offset={len(out)}&limit={step}", headers={"apikey": KEY})
        page = json.load(urllib.request.urlopen(r))
        out += page
        if len(page) < step:
            return out


wb = openpyxl.Workbook()
for i, (title, view) in enumerate([("Participantes", "participantes"), ("Ligações", "ligacoes")]):
    ws = wb.active if i == 0 else wb.create_sheet()
    ws.title = title
    data = get(view)
    ws.append(list(data[0]))
    for row in data:
        ws.append([", ".join(v) if isinstance(v, list) else v for v in row.values()])
    print(title, len(data))
wb.save(Path(__file__).parent / "graph" / "might-graph.xlsx")
