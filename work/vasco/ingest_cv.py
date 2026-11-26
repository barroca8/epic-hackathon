"""Turn CVs into MighT graph triples, an enriched XLSX and a standalone HTML graph."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader


SKILLS = {
    "python": ("python", "pandas", "fastapi", "django", "flask"),
    "javascript": ("javascript", "typescript", "node.js", "nodejs", "react", "vue", "angular"),
    "sql": ("sql", "postgresql", "mysql", "bigquery", "snowflake"),
    "data-analysis": ("data analysis", "data analytics", "analise de dados", "análise de dados", "power bi", "tableau"),
    "machine-learning": ("machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn"),
    "product-management": ("product management", "product manager", "gestao de produto", "gestão de produto"),
    "project-management": ("project management", "project manager", "gestao de projeto", "gestão de projeto", "scrum"),
    "ux-design": ("ux design", "user experience", "figma", "design thinking"),
    "marketing": ("marketing", "seo", "sem", "growth", "campaign management"),
    "sales": ("sales", "vendas", "business development", "account management"),
    "leadership": ("leadership", "lideranca", "liderança", "team lead", "people management"),
    "communication": ("communication", "comunicacao", "comunicação", "public speaking", "storytelling"),
    "artificial-intelligence": ("artificial intelligence", "inteligencia artificial", "inteligência artificial", " ia "),
    "community-management": ("community management", "gestao de comunidade", "gestão de comunidade", "estrategia de comunidade", "estratégia de comunidade"),
    "copywriting": ("copywriting", "copywriter"),
    "experimentation": ("experimentation", "experimentacao", "experimentação", "a/b testing"),
    "facilitation": ("facilitation", "facilitacao", "facilitação", "facilitador"),
    "medical-imaging": ("medical imaging", "imagem medica", "imagem médica"),
    "recruitment": ("recruitment", "recrutamento", "talent acquisition"),
    "talent-development": ("talent development", "desenvolvimento de talento", "desenvolvimento de carreira"),
    "user-research": ("user research", "ux research", "pesquisa com utilizadores", "testes de usabilidade"),
}

ROLE_PATTERNS = (
    "software engineer", "data analyst", "data scientist", "product manager", "project manager",
    "ux designer", "product designer", "marketing manager", "account manager", "business developer",
    "growth specialist", "community specialist", "talent specialist", "people & talent specialist",
    "ai research scientist", "research scientist", "consultant", "consultor", "engenheiro de software", "analista de dados", "gestor de produto",
    "gestor de projeto", "designer", "director", "diretor", "head of", "team lead",
)


def slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def read_cv(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(path).pages)
    if suffix == ".docx":
        doc = Document(path)
        paragraphs = [p.text for p in doc.paragraphs]
        cells = [cell.text for table in doc.tables for row in table.rows for cell in row.cells]
        return "\n".join(paragraphs + cells)
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8")
    raise ValueError(f"Unsupported CV format: {path.name} (use PDF, DOCX, TXT or MD)")


def contains_phrase(text: str, phrase: str) -> bool:
    return bool(re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text, re.IGNORECASE))


def extract_triples(person: str, text: str) -> list[dict]:
    subject = f"person:{slug(person)}"
    triples: list[dict] = []

    def add(predicate: str, kind: str, label: str, weight: float = 1.0) -> None:
        triples.append({
            "subject": subject,
            "predicate": predicate,
            "object": f"{kind}:{slug(label)}",
            "weight": weight,
            "circle": None,
            "source": "cv",
            "label": label,
        })

    lowered = text.lower()
    for skill, aliases in SKILLS.items():
        hits = sum(1 for alias in aliases if contains_phrase(lowered, alias))
        if hits:
            add("HAS_SKILL", "skill", skill.replace("-", " ").title(), min(1.0, 0.5 + hits * 0.1))

    matched_roles = [role for role in ROLE_PATTERNS if contains_phrase(lowered, role)]
    for role in matched_roles:
        if any(role != longer and role in longer for longer in matched_roles):
            continue
        add("HELD_ROLE", "role", role.title())

    company_lines = re.findall(
        r"(?im)^(?:company|empresa|employer|organiza[cç][aã]o)\s*[:\-]\s*(.{2,80})$", text
    )
    for company in company_lines:
        add("WORKED_AT", "company", company.strip())

    unique = {}
    for triple in triples:
        key = (triple["subject"], triple["predicate"], triple["object"])
        unique[key] = triple
    return list(unique.values())


def write_workbook(seed: Path, output: Path, person: str, cv_path: Path, triples: list[dict]) -> None:
    source = output if output.exists() else seed
    workbook = load_workbook(source)

    profiles = workbook["CV Profiles"] if "CV Profiles" in workbook.sheetnames else workbook.create_sheet("CV Profiles")
    profile_headers = ["person_id", "name", "cv_file", "triple_count"]
    if profiles.cell(1, 1).value is None:
        if profiles.cell(2, 1).value == "person_id":
            profiles.delete_rows(1)
        else:
            for column, header in enumerate(profile_headers, 1):
                profiles.cell(1, column, header)
    person_id = f"person:{slug(person)}"
    existing_profiles = {profiles.cell(row, 1).value: row for row in range(2, profiles.max_row + 1)}
    values = [person_id, person, cv_path.name, len(triples)]
    if person_id in existing_profiles:
        for column, value in enumerate(values, 1):
            profiles.cell(existing_profiles[person_id], column, value)
    else:
        profiles.append(values)

    sheet = workbook["CV Triples"] if "CV Triples" in workbook.sheetnames else workbook.create_sheet("CV Triples")
    headers = ["subject", "predicate", "object", "weight", "circle", "source", "label"]
    if sheet.cell(1, 1).value is None:
        if sheet.cell(2, 1).value == "subject":
            sheet.delete_rows(1)
        else:
            for column, header in enumerate(headers, 1):
                sheet.cell(1, column, header)
    old_rows = [list(row) for row in sheet.iter_rows(min_row=2, values_only=True) if row[0] != person_id]
    sheet.delete_rows(2, sheet.max_row)
    for row in old_rows:
        sheet.append(row)
    for triple in triples:
        sheet.append([triple.get(header) for header in headers])

    output.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(output)


def read_all_triples(workbook_path: Path) -> list[dict]:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    if "CV Triples" not in workbook.sheetnames:
        return []
    rows = workbook["CV Triples"].iter_rows(values_only=True)
    headers = next(rows)
    return [dict(zip(headers, row)) for row in rows if row[0]]


def affinity_score(left: dict, right: dict) -> float:
    """Weighted tag overlap, averaged across dimensions present in both profiles (0–100)."""
    scores = []
    for dimension in ("personality", "power", "character"):
        left_weights = left.get("all_might", {}).get(dimension, {})
        right_weights = right.get("all_might", {}).get(dimension, {})
        if left_weights and right_weights:
            scores.append(sum(min(weight, right_weights.get(tag, 0)) for tag, weight in left_weights.items()))
    return round(100 * sum(scores) / len(scores), 1) if scores else 0.0


def write_affinities(workbook_path: Path, profiles_path: Path) -> list[dict]:
    profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
    workbook = load_workbook(workbook_path)
    links = workbook["Ligações"]
    headers = [cell.value for cell in links[1]]
    normalized = {slug(str(header)): index + 1 for index, header in enumerate(headers) if header}
    sender_column = normalized.get("remetente")
    receiver_column = normalized.get("destinatario")
    if not sender_column or not receiver_column:
        raise ValueError("Sheet 'Ligações' must contain Remetente and Destinatário columns")

    score_column = normalized.get("affinity-score")
    if not score_column:
        score_column = links.max_column + 1
        links.cell(1, score_column, "affinity_score")

    by_pair = {}
    for row in range(2, links.max_row + 1):
        sender = f"person:{slug(str(links.cell(row, sender_column).value))}"
        receiver = f"person:{slug(str(links.cell(row, receiver_column).value))}"
        score = affinity_score(profiles.get(sender, {}), profiles.get(receiver, {}))
        links.cell(row, score_column, score)
        by_pair[(sender, receiver)] = score

    triples = [
        {
            "subject": sender,
            "predicate": "AFINIDADE",
            "object": receiver,
            "weight": score,
            "circle": None,
            "source": "derived:all_might:v1",
        }
        for (sender, receiver), score in sorted(by_pair.items())
    ]
    sheet_name = "Affinity Triples"
    if sheet_name in workbook.sheetnames:
        del workbook[sheet_name]
    sheet = workbook.create_sheet(sheet_name)
    triple_headers = ["subject", "predicate", "object", "weight", "circle", "source"]
    sheet.append(triple_headers)
    for triple in triples:
        sheet.append([triple[header] for header in triple_headers])
    workbook.save(workbook_path)
    return triples


def write_html(template: Path, output: Path, triples: list[dict], affinities: list[dict]) -> None:
    html = template.read_text(encoding="utf-8")
    payload = json.dumps(triples, ensure_ascii=False, separators=(",", ":"))
    affinity_payload = json.dumps(affinities, ensure_ascii=False, separators=(",", ":"))
    block = f"""
// CV_KNOWLEDGE_START — generated by ingest_cv.py
const CV_TRIPLES = {payload};
const AFFINITY_TRIPLES = {affinity_payload};
const cvSlug = value => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cvPeople = new Map(DATA.nodes.map(node => [`person:${{cvSlug(node.name)}}`, node.id]));
const cvNodeIds = new Set(DATA.nodes.map(node => node.id));
for (const triple of CV_TRIPLES) {{
  let source = cvPeople.get(triple.subject);
  if (!source) {{
    source = triple.subject;
    if (!cvNodeIds.has(source)) {{
      DATA.nodes.push({{id: source, name: triple.subject.split(":")[1].replace(/-/g, " "), group: "CV Profile", rec: 7, sent: 7, kind: "person"}});
      cvNodeIds.add(source);
    }}
  }}
  if (!cvNodeIds.has(triple.object)) {{
    const kind = triple.object.split(":")[0];
    DATA.nodes.push({{id: triple.object, name: triple.label || triple.object.split(":")[1].replace(/-/g, " "), group: `CV · ${{kind}}`, rec: 5, sent: 5, kind}});
    cvNodeIds.add(triple.object);
  }}
  DATA.edges.push([source, triple.object]);
}}
const AFFINITY_BY_PAIR = new Map();
for (const triple of AFFINITY_TRIPLES) {{
  const source = cvPeople.get(triple.subject);
  const target = cvPeople.get(triple.object);
  if (source != null && target != null) AFFINITY_BY_PAIR.set(`${{source}}|${{target}}`, triple.weight);
}}
// CV_KNOWLEDGE_END
"""
    marker = re.search(r"const DATA = .*?;\s*", html, re.DOTALL)
    if not marker:
        raise ValueError("Could not find 'const DATA = ...;' in HTML template")
    html = html[: marker.end()] + block + html[marker.end() :]
    html = html.replace(
        '"Facilitação":"rgba(254,229,133,1)","Programa":"rgba(131,108,54,1)"',
        '"Facilitação":"rgba(254,229,133,1)","Programa":"rgba(131,108,54,1)",\n'
        '  "CV Profile":"rgba(141,92,246,1)","CV · skill":"rgba(43,196,138,1)",'
        '"CV · role":"rgba(255,173,51,1)","CV · company":"rgba(70,130,220,1)"',
    )
    html = html.replace(
        "function showTip(e,d){ tip.html(`<b>${d.name}</b><br>${d.group}<br>Recebidas: ${d.rec} · Enviadas: ${d.sent}`)",
        "function showTip(e,d){ tip.html(`<b>${d.name}</b><br>${d.group}${d.kind && d.kind !== 'person' ? `<br>Conhecimento extraído do CV` : `<br>Recebidas: ${d.rec} · Enviadas: ${d.sent}`}`)",
    )
    html = html.replace(
        "const links = DATA.edges.map(([s,t]) => ({source:s, target:t}));",
        "const links = DATA.edges.map(([s,t]) => ({source:s, target:t, affinity: AFFINITY_BY_PAIR.get(`${s}|${t}`) ?? 0}));",
    )
    html = html.replace(
        'const link = g.append("g").selectAll("line").data(links).join("line").attr("class","link");',
        'const link = g.append("g").selectAll("line").data(links).join("line").attr("class","link")\n'
        '  .style("--affinity", d => d.affinity / 100)\n'
        '  .on("mouseover", (e,d) => showLinkTip(e,d)).on("mousemove", moveTip).on("mouseout", hideTip);',
    )
    html = html.replace(
        ".link{stroke:rgba(17,182,186,.8);stroke-opacity:.1;stroke-width:1px}",
        ".link{stroke:rgba(17,182,186,.8);stroke-opacity:calc(.08 + var(--affinity)*.55);stroke-width:calc(.5px + var(--affinity)*4px);cursor:help}",
    )
    html = html.replace(
        "function moveTip(e){ tip.style(\"left\", (e.clientX+14)+\"px\").style(\"top\", (e.clientY+14)+\"px\"); }",
        "function showLinkTip(e,d){ const a=d.source.name||d.source, b=d.target.name||d.target; tip.html(`<b>${a} → ${b}</b><br>Afinidade: ${d.affinity.toFixed(1)}%`).style(\"opacity\",1); moveTip(e); }\n"
        "function moveTip(e){ tip.style(\"left\", (e.clientX+14)+\"px\").style(\"top\", (e.clientY+14)+\"px\"); }",
    )
    html = html.replace(
        "Dados fictícios. Clica num grupo para o esconder. Laranja = tags enviadas, azul-escuro = recebidas, vermelho = mútuas.",
        "Dados fictícios. Clica num grupo para o esconder. Espessura da ligação = affinity_score. Laranja = enviadas, azul-escuro = recebidas, vermelho = mútuas.",
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cv", type=Path, help="One CV or a directory of CVs")
    parser.add_argument("--person", help="Person name (required for one CV; inferred from filenames in batch mode)")
    parser.add_argument("--database", required=True, type=Path, help="Seed MighT XLSX")
    parser.add_argument("--html-template", required=True, type=Path, help="Seed MighT graph HTML")
    parser.add_argument("--profiles", type=Path, default=Path("work/diogo/profiles.json"), help="Profiles with All MighT weights")
    parser.add_argument("--output-dir", type=Path, default=Path("output"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    database = args.output_dir / "might-social-graph-with-cvs.xlsx"
    if args.cv.is_dir():
        cv_paths = sorted(path for path in args.cv.iterdir() if path.suffix.lower() in {".pdf", ".docx", ".txt", ".md"})
        if not cv_paths:
            raise ValueError(f"No supported CVs found in {args.cv}")
    else:
        cv_paths = [args.cv]
        if not args.person:
            raise ValueError("--person is required when ingesting one CV")

    results = []
    for cv_path in cv_paths:
        person = args.person if len(cv_paths) == 1 and args.person else cv_path.stem.replace("_", " ").replace("-", " ").title()
        text = read_cv(cv_path)
        if not text.strip():
            raise ValueError(f"No text could be extracted from {cv_path.name}")
        triples = extract_triples(person, text)
        write_workbook(args.database, database, person, cv_path, triples)
        results.append({"person": person, "triples": len(triples)})

    all_triples = read_all_triples(database)
    affinities = write_affinities(database, args.profiles)
    (args.output_dir / "cv-triples.json").write_text(
        json.dumps(all_triples, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (args.output_dir / "affinity-triples.json").write_text(
        json.dumps(affinities, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    write_html(args.html_template, args.output_dir / "might-social-graph-with-cvs.html", all_triples, affinities)
    print(json.dumps({"profiles": results, "cv_triples": len(all_triples), "affinity_triples": len(affinities)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
