# CV → MighT knowledge graph

Local MVP pipeline: PDF/DOCX/TXT/MD → `HAS_SKILL`, `HELD_ROLE`, `WORKED_AT` triples → enriched XLSX + JSON + standalone HTML graph.

```bash
python3 -m venv .venv
.venv/bin/pip install -r work/vasco/requirements.txt
.venv/bin/python work/vasco/ingest_cv.py cv.pdf \
  --person "Nome da Pessoa" \
  --database "second-task/assets/CASE ASSETS/13. Network Database/might-social-graph-ficticio.xlsx" \
  --html-template "second-task/assets/CASE ASSETS/14. MighT Social Graph/might-social-graph-ficticio.html" \
  --output-dir work/vasco/output
```

Outputs are cumulative and idempotent by person: `might-social-graph-with-cvs.xlsx`, `cv-triples.json`, `affinity-triples.json`, and `might-social-graph-with-cvs.html`. The seed assets are never modified. CV text is processed locally and is not stored.

Batch mock ingestion (the person's name is inferred from each filename):

```bash
.venv/bin/python work/vasco/ingest_cv.py work/vasco/CV_Falsos \
  --database "second-task/assets/CASE ASSETS/13. Network Database/might-social-graph-ficticio.xlsx" \
  --html-template "second-task/assets/CASE ASSETS/14. MighT Social Graph/might-social-graph-ficticio.html" \
  --profiles work/diogo/profiles.json \
  --output-dir work/vasco/output
```

`affinity_score` is the mean weighted overlap of the two profiles' All MighT tag distributions across dimensions available in both profiles, expressed from 0 to 100. It is written to `Ligações`, exported as `AFINIDADE` triples, and shown by line thickness plus an exact edge tooltip in the HTML graph.

The extraction is keyword-based for the 60-minute MVP. Every fact is a hypothesis from CV text and must be confirmed by the profile owner before production use.
