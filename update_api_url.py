import glob

# Switch back to relative /api since the Worker route maps netixa.tech/api/* directly
old = "const API = 'https://netixa-api.arjunaravinda.workers.dev/api';"
new = "const API = '/api';"

changed = []
for f in glob.glob("*.html"):
    content = open(f, "r", encoding="utf-8", errors="ignore").read()
    if old in content:
        open(f, "w", encoding="utf-8").write(content.replace(old, new))
        changed.append(f)

print("Updated:", changed)
