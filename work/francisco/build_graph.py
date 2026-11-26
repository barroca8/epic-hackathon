"""Build the MighT graph from the Epic social-graph asset. Source files in graph/ are derived: rerun to rebuild.

Usage: python -I build_graph.py "<path to might-social-graph-ficticio.html>"
Real from the asset: people, groups, who sent a MighT to whom (1,110 links).
Simulated here (seed 42): the 3 tags on each MighT, the circle, self tags, the tag->role table.
"""
import json, random, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

OUT = Path(__file__).parent / "graph"
rng = random.Random(42)

TAGS = {  # Epic word library (04. MighT Word Library), EN / PT
    "personality": "Adaptable/Adaptável Clever/Esperto Competitive/Competitivo Confident/Confiante Curious/Curioso "
    "Extroverted/Extrovertido Humorous/Divertido Imaginative/Imaginativo Intelligent/Inteligente Intuitive/Intuitivo "
    "Logic/Lógico Objective/Objectivo Optimistic/Optimista Passionate/Apaixonado People-oriented/Empático "
    "Persuasive/Persuasivo Practical/Prático Sensitive/Sensível Wise/Sábio",
    "power": "Achiever/Vencedor Advisor/Conselheiro Analyzer/Analisador Communicator/Comunicador Composer/Compositor "
    "Conceptualizer/Conceptualizador Connector/Conector Creator/Criador Developer/Concretizador Encourager/Motivador "
    "Energizer/Energizador Entertainer/Animador Entrepreneur/Empreendedor Explorer/Explorador Illustrator/Ilustrador "
    "Influencer/Influenciador Innovator/Inovador Investigator/Investigador Leader/Líder Learner/Aprendiz "
    "Moderator/Moderador Organizer/Organizador Planner/Planeador Solver/Solucionador Strategizer/Estratega "
    "Translator/Tradutor Writer/Escritor",
    "character": "Altruism/Altruísmo Collaboration/Colaboração Compassion/Compaixão Courage/Coragem "
    "Discipline/Disciplina Freedom/Liberdade Generosity/Generosidade Humility/Humildade Integrity/Integridade "
    "Maturity/Maturidade Persistence/Persistência Responsibility/Responsabilidade Sincerity/Sinceridade "
    "Solidarity/Solidariedade Tolerance/Tolerância",
}
ROLES = {  # power tag -> [role now, role next]. Hypotheses, not validated.
    "achiever": ["Account Executive", "Head of Sales"], "advisor": ["Consultor", "Mentor / Coach"],
    "analyzer": ["Data Analyst", "Analytics Lead"], "communicator": ["Comunicação", "Head of Communications"],
    "composer": ["Produtor de Conteúdo", "Creative Director"], "conceptualizer": ["Service Designer", "Head of Strategy"],
    "connector": ["Partnerships", "Community Lead"], "creator": ["Product Designer", "Founder"],
    "developer": ["Software Engineer", "Tech Lead"], "encourager": ["People Partner", "Team Coach"],
    "energizer": ["Event Manager", "Culture Lead"], "entertainer": ["Brand Activation", "Host / Speaker"],
    "entrepreneur": ["Business Developer", "Founder"], "explorer": ["Researcher", "Innovation Scout"],
    "illustrator": ["Visual Designer", "Art Director"], "influencer": ["Marketing", "Brand Lead"],
    "innovator": ["Product Manager", "Head of Innovation"], "investigator": ["UX Researcher", "Insights Lead"],
    "leader": ["Team Lead", "General Manager"], "learner": ["Trainee / Rotational", "Learning Designer"],
    "moderator": ["Facilitador", "Agile Coach"], "organizer": ["Operations", "Chief of Staff"],
    "planner": ["Project Manager", "Program Director"], "solver": ["Customer Success", "Solutions Architect"],
    "strategizer": ["Strategy Analyst", "Head of Strategy"], "translator": ["Technical Writer", "Product Marketing"],
    "writer": ["Copywriter", "Editor-in-chief"],
}
CIRCLES = ["Amigos", "Família", "Escola", "Comunidade", "Clientes"]


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


data = json.loads(re.search(r"const DATA = (\{.*?\});\s*\n", Path(sys.argv[1]).read_text(encoding="utf8"), re.S).group(1))

tags = [{"id": f"tag:{slug(en)}", "en": en.replace("-", " "), "pt": pt, "dimension": dim}
        for dim, words in TAGS.items() for en, pt in (w.split("/") for w in words.split())]
by_dim = {d: [t["id"] for t in tags if t["dimension"] == d] for d in TAGS}

people, latent = [], {}
for n in data["nodes"]:
    pid = f"person:{slug(n['name'])}"
    kind = "account" if n["group"] == "Programa" else "person"
    latent[n["id"]] = {d: rng.sample(ids, 3) for d, ids in by_dim.items()}  # what this person is really like
    self_tags = [rng.choice(latent[n["id"]][d]) if rng.random() < 0.6 else rng.choice(by_dim[d]) for d in TAGS]
    people.append({"id": pid, "name": n["name"], "group": n["group"], "kind": kind, "self_tags": self_tags})
pid_of = {n["id"]: p for n, p in zip(data["nodes"], people)}

mights = []
for a, b in data["edges"]:
    same = pid_of[a]["group"] == pid_of[b]["group"]
    circle = "Colegas" if same or rng.random() < 0.5 else rng.choice(CIRCLES)
    picked = [rng.choices(latent[b][d], weights=[5, 3, 2])[0] if rng.random() < 0.8 else rng.choice(by_dim[d]) for d in TAGS]
    mights.append({"from": pid_of[a]["id"], "to": pid_of[b]["id"], "circle": circle, "tags": picked, "status": "accepted"})

# All MighT: weight = count / total in the dimension (brief, slide 14)
counts = defaultdict(lambda: defaultdict(int))
for m in mights:
    for t in m["tags"]:
        counts[m["to"]][t] += 1
dim_of = {t["id"]: t["dimension"] for t in tags}
profiles = {}
for p in people:
    prof = {}
    for d in TAGS:
        c = {t: n for t, n in counts[p["id"]].items() if dim_of[t] == d}
        total = sum(c.values())
        prof[d] = {t: round(n / total, 3) for t, n in sorted(c.items(), key=lambda x: -x[1])} if total else {}
    profiles[p["id"]] = {"received": sum(1 for m in mights if m["to"] == p["id"]), "all_might": prof}

T = lambda s, p, o, w=1, c=None, src="seed": {"subject": s, "predicate": p, "object": o, "weight": w, "circle": c, "source": src}
triples = [T(t["id"], "TAG_DIMENSION", t["dimension"]) for t in tags]
triples += [T(p["id"], "SELF_TAG", t, src="self") for p in people for t in p["self_tags"]]
triples += [T(m["from"], "GAVE_MIGHT", m["to"], c=m["circle"], src="might") for m in mights]
triples += [T(pid, "RECEIVED_TAG", t, n, src="might") for pid, c in counts.items() for t, n in c.items()]
roles = [{"tag": f"tag:{k}", "now": v[0], "next": v[1]} for k, v in ROLES.items()]
triples += [T(r["tag"], "TAG_SUGGESTS_ROLE", f"role:{slug(x)}") for r in roles for x in (r["now"], r["next"])]

OUT.mkdir(exist_ok=True)
for name, obj in [("tags", tags), ("people", people), ("mights", mights), ("profiles", profiles), ("roles", roles), ("triples", triples)]:
    (OUT / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf8")
    print(name, len(obj))
