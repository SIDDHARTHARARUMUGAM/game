from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import os
import json
from itertools import combinations

app = Flask(__name__)
CORS(app)

IMAGE_FOLDER = "static/image"
DATA_FILE = "photos.json"
INITIAL_ELO = 1200
PAIRS_FILE = "pairs.json"

# Load or initialize photos data
def load_photos():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    else:
        photos = []
        for idx, filename in enumerate(os.listdir(IMAGE_FOLDER), start=1):
            if filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
                photos.append({
                    "id": idx,
                    "name": os.path.splitext(filename)[0],
                    "filename": filename,
                    "elo": INITIAL_ELO
                })
        save_photos(photos)
        return photos

def save_photos(photos):
    with open(DATA_FILE, "w") as f:
        json.dump(photos, f, indent=4)

# Load or initialize remaining pairs
def load_pairs(photos):
    if os.path.exists(PAIRS_FILE):
        with open(PAIRS_FILE, "r") as f:
            return json.load(f)
    else:
        all_pairs = list(combinations([p["id"] for p in photos], 2))
        random.shuffle(all_pairs)
        save_pairs(all_pairs)
        return all_pairs

def save_pairs(pairs):
    with open(PAIRS_FILE, "w") as f:
        json.dump(pairs, f, indent=4)

photos = load_photos()
remaining_pairs = load_pairs(photos)

# Serve images
@app.route("/images/<path:filename>")
def get_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

# Get next random pair
@app.route("/photos/random", methods=["GET"])
def random_photos():
    global remaining_pairs
    if not remaining_pairs:
        return jsonify({"done": True}), 200
    pair_ids = remaining_pairs.pop(0)  # take first pair
    save_pairs(remaining_pairs)
    pair = [next(p for p in photos if p["id"] == pair_ids[0]),
            next(p for p in photos if p["id"] == pair_ids[1])]
    return jsonify(pair)

# Vote
@app.route("/vote", methods=["POST"])
def vote():
    global photos
    data = request.json
    winner_id = data.get("winner_id")
    loser_id = data.get("loser_id")

    winner = next((p for p in photos if p["id"] == winner_id), None)
    loser = next((p for p in photos if p["id"] == loser_id), None)

    if not winner or not loser:
        return jsonify({"error": "Invalid photo IDs"}), 400

    # Elo calculation
    k = 32
    expected_winner = 1 / (1 + 10 ** ((loser["elo"] - winner["elo"]) / 400))
    expected_loser = 1 / (1 + 10 ** ((winner["elo"] - loser["elo"]) / 400))

    winner["elo"] += k * (1 - expected_winner)
    loser["elo"] += k * (0 - expected_loser)

    save_photos(photos)
    return jsonify({"winner": winner, "loser": loser})

# Leaderboard
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    sorted_photos = sorted(photos, key=lambda x: x["elo"], reverse=True)
    return jsonify(sorted_photos)

# Reset voting and leaderboard
@app.route("/reset", methods=["POST"])
def reset():
    # Remove data files
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)
    if os.path.exists(PAIRS_FILE):
        os.remove(PAIRS_FILE)
    # Re-initialize
    global photos, remaining_pairs
    photos = load_photos()
    remaining_pairs = load_pairs(photos)
    return jsonify({"status": "reset"}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    app.run(debug=True, host="0.0.0.0", port=port)
