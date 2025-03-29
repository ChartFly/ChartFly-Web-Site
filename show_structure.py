import os

EXCLUDED_DIRS = {".venv", "__pycache__", ".git", ".idea", "node_modules", "env", "venv"}

def show_structure(path, indent=""):
    for entry in sorted(os.listdir(path)):
        if entry in EXCLUDED_DIRS:
            continue
        full_path = os.path.join(path, entry)
        if os.path.isdir(full_path):
            print(f"{indent}├── {entry}")
            show_structure(full_path, indent + "│   ")
        else:
            print(f"{indent}├── {entry}")

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.abspath(__file__))
    show_structure(root_dir)