import uuid
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json
from utils.otp import generate_otp, verify_otp
from flask_simple_captcha import CAPTCHA

app = Flask(__name__)
CORS(app)

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

# Load contract
with open("contract/compiled_contract.json") as f:
    contract_data = json.load(f)

abi = contract_data["abi"]
contract_address = contract_data["address"]
contract = w3.eth.contract(address=contract_address, abi=abi)


# --- OTP Routes ---

captcha_config = {
    'SECRET_CAPTCHA_KEY': 'your-secret-key',
    'CAPTCHA_LENGTH': 6,
    'EXPIRE_SECONDS': 300
}
captcha = CAPTCHA(config=captcha_config)
app = captcha.init_app(app)


@app.route('/captcha', methods=['GET'])
def get_captcha():
    image, hash = captcha.generate()
    return jsonify({"captcha": image, "captcha_hash": hash})

@app.route('/send-otp', methods=['POST'])
def send_otp_route():
    captcha_text = request.json.get('captcha_text')
    captcha_hash = request.json.get('captcha_hash')
    if not captcha.verify(captcha_text, captcha_hash):
        return jsonify({"error": "Invalid CAPTCHA"}), 403

    phone = request.json.get('phone')
    otp = generate_otp(phone)
    print(f"OTP for {phone}: {otp}")
    return jsonify({"success": True})


@app.route('/verify-otp', methods=['POST'])
def verify_otp_route():
    phone = request.json.get('phone')
    otp = request.json.get('otp')
    success, message = verify_otp(phone, otp)
    if success:
        return jsonify({"success": True, "user": {"id": phone}})
    else:
        return jsonify({"success": False, "message": message}), 400

# @app.route('/admin/add-candidate', methods=['POST'])
# def add_candidate():
#     data = request.get_json()
#     name = data.get('name')
#
#     if not name:
#         return jsonify({"error": "Candidate name required"}), 400
#
#     try:
#         tx_hash = contract.functions.addCandidate(name).transact({'from': w3.eth.accounts[0]})
#         w3.eth.wait_for_transaction_receipt(tx_hash)
#         return jsonify({"success": True})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


import sqlite3
def get_db():
    conn = sqlite3.connect("voting.db")
    conn.row_factory = sqlite3.Row
    return conn

with get_db() as db:
    db.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT
        )
    """)
    db.execute("""
    CREATE TABLE IF NOT EXISTS voters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT UNIQUE,
        wallet TEXT UNIQUE,
        voter_id TEXT UNIQUE,
        has_voted INTEGER DEFAULT 0,
        registered_at TEXT
        )
    """)

    db.execute("""
    CREATE TABLE IF NOT EXISTS vote_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voter_id TEXT,
        candidate_id INTEGER,
        timestamp TEXT
        )
    """)


import hashlib
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


@app.route('/admin/setup', methods=['POST'])
def setup_admin():
    email = request.json.get('email')
    password = request.json.get('password')
    password_hash = hash_password(password)

    with get_db() as db:
        db.execute("INSERT INTO admins (email, password_hash) VALUES (?, ?)", (email, password_hash))
        db.commit()

    return jsonify({"success": True, "message": "Admin created"})

#

@app.route('/admin/register', methods=['POST'])
def register_admin():
    email = request.json.get('email')
    password = request.json.get('password')
    password_hash = hash_password(password)
    with get_db() as db:
        db.execute("INSERT INTO admins (email, password_hash) VALUES (?, ?)", (email, password_hash))
    return jsonify({"message": "Admin registered"})

# Admin Login

@app.route('/admin/login', methods=['POST'])
def admin_login():
    email = request.json.get('email')
    password = request.json.get('password')
    password_hash = hash_password(password)

    with get_db() as db:
        admin = db.execute("SELECT * FROM admins WHERE email = ? AND password_hash = ?", (email, password_hash)).fetchone()

    if admin:
        return jsonify({"success": True, "token": "supersecureadmintoken123"})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# Add Candidate(with Party and Image)

@app.route('/add_candidate', methods=['POST'])
def add_candidate():
    data = request.get_json()
    name = data.get('name')
    party = data.get('party')
    imageUrl = data.get('imageUrl')

    print("Using admin address:", w3.eth.accounts[0])
    print("Contract address:", contract_address)
    print("ABI length:", len(abi))

    if not name or not party or not imageUrl:
        return jsonify({"status": "error", "message": "All fields are required"}), 400
    admin_address = w3.eth.accounts[0]

    try:
        tx_hash = contract.functions.addCandidate(name, party, imageUrl).transact({'from': admin_address})
        w3.eth.wait_for_transaction_receipt(tx_hash)
        return jsonify({"status": "success"})
    except Exception as e:
        print("Add Candidate Error:", str(e))
        print("Using address:", w3.eth.accounts[0])
        return jsonify({"status": "error", "message": str(e)}), 500

# Register Voter
@app.route('/voter/register', methods=['POST'])
def register_voter():
    name = request.json.get('name')
    phone = request.json.get('phone')
    wallet = request.json.get('wallet')
    voter_id = str(uuid.uuid4())

    if not name or not phone or not wallet:
        return jsonify({"error": "All fields required"}), 400

    with get_db() as db:
        db.execute("""
            INSERT OR IGNORE INTO voters (name, phone, wallet, voter_id, registered_at)
            VALUES (?, ?, ?, ?, ?)
        """, (name, phone, wallet, voter_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    return jsonify({"success": True, "voterId": voter_id})


# Get Candidates(for Display)
@app.route('/get_candidates', methods=['GET'])
def get_candidates():
    count = contract.functions.getCandidateCount().call()
    candidates = []
    for i in range(1, count + 1):
        cid, name, party, image, votes = contract.functions.getCandidateDetails(i).call()
        candidates.append({
            'id': cid,
            'name': name,
            'party': party,
            'image': image,
            'votes': votes
        })
    return jsonify(candidates)

# Cast Vote
@app.route('/vote', methods=['POST'])
def vote():
    voter_id = request.json.get('voterId')
    candidate_id = int(request.json.get('candidateId'))

    with get_db() as db:
        voter = db.execute("SELECT * FROM voters WHERE voter_id = ?", (voter_id,)).fetchone()

        if not voter:
            return jsonify({"error": "Voter not found"}), 404

        if voter['has_voted']:
            return jsonify({"error": "Voter has already voted"}), 403

        try:
            tx_hash = contract.functions.vote(candidate_id).transact({'from': voter['wallet']})
            w3.eth.wait_for_transaction_receipt(tx_hash)
            db.execute("INSERT INTO vote_logs (voter_id, candidate_id, timestamp) VALUES (?, ?, ?)",
                       (voter_id, candidate_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            db.execute("UPDATE voters SET has_voted = 1 WHERE voter_id = ?", (voter_id,))
            return jsonify({"message": "Vote cast successfully"})
        except Exception as e:
            return jsonify({"error": str(e)}), 400

# Get Results
@app.route('/results', methods=['GET'])
def get_results():
    count = contract.functions.getCandidateCount().call()
    results = []
    for i in range(1, count + 1):
        cid, name, party, image, votes = contract.functions.getCandidateDetails(i).call()
        results.append({
            "id": cid,
            "name": name,
            "party": party,
            "image": image,
            "votes": votes
        })
    return jsonify(results)

# Get Voter Logs(Admin View)
@app.route('/admin/vote-logs', methods=['GET'])
def get_vote_logs():
    with get_db() as db:
        logs = db.execute("SELECT * FROM vote_logs").fetchall()
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                "voter_id": log["voter_id"],
                "candidate_id": log["candidate_id"],
                "timestamp": log["timestamp"]
            })
    return jsonify(formatted_logs)

# Get Voter List(Admin View)
@app.route('/admin/voters', methods=['GET'])
def list_voters():
    with get_db() as db:
        voters = db.execute("SELECT * FROM voters").fetchall()
        result = []
        for voter in voters:
            result.append({
                "name": voter["name"],
                "phone": voter["phone"],
                "wallet": voter["wallet"],
                "voter_id": voter["voter_id"],
                "has_voted": bool(voter["has_voted"]) if "has_voted" in voter.keys() else False,
                "registered_at": voter["registered_at"]
            })
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)