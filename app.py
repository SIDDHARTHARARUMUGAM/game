from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import os
from supabase import create_client, Client
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

IMAGE_FOLDER = "static/image"
INITIAL_ELO = 1200

# Supabase setup
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Serve images
@app.route("/images/<path:filename>")
def get_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

# Get two random photos
@app.route("/photos/random", methods=["GET"])
def random_photos():
    response = supabase.table("photo").select("*").execute()
    photos = response.data
    if len(photos) < 2:
        return jsonify({"done": True}), 200
    pair = random.sample(photos, 2)
    return jsonify(pair)

# Vote
@app.route("/vote", methods=["POST"])
def vote():
    data = request.json
    winner_id = data.get("winner_id")
    loser_id = data.get("loser_id")

    # Get current ELOs
    response = supabase.table("photo").select("*").eq("id", winner_id).execute()
    winner = response.data[0] if response.data else None
    response = supabase.table("photo").select("*").eq("id", loser_id).execute()
    loser = response.data[0] if response.data else None

    if not winner or not loser:
        return jsonify({"error": "Invalid photo IDs"}), 400

    k = 32
    expected_winner = 1 / (1 + 10 ** ((loser["elo"] - winner["elo"]) / 400))
    expected_loser = 1 / (1 + 10 ** ((winner["elo"] - loser["elo"]) / 400))

    winner_elo = winner["elo"] + k * (1 - expected_winner)
    loser_elo = loser["elo"] + k * (0 - expected_loser)

    # Update ELOs in Supabase
    supabase.table("photo").update({"elo": winner_elo}).eq("id", winner_id).execute()
    supabase.table("photo").update({"elo": loser_elo}).eq("id", loser_id).execute()

    return jsonify({"winner": winner_id, "loser": loser_id})

# Leaderboard
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    response = supabase.table("photo").select("*").order("elo", desc=True).execute()
    sorted_photos = response.data
    return jsonify(sorted_photos)

# Reset voting and leaderboard

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)