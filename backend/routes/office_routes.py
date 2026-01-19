from flask import Blueprint, request, jsonify
from db import mongo

office_bp = Blueprint('office', __name__)

@office_bp.route('/config', methods=['POST'])
def set_office_config():
    try:
        data = request.json
        
        # This is what the HR enters in the Dashboard
        config = {
            "branch_name": "Main Office",  # Fixed name for simplicity
            "location": {
                "latitude": float(data['latitude']),
                "longitude": float(data['longitude']),
                "allowed_radius_meters": int(data.get('radius', 50))
            },
            "wifi": {
                # Store multiple router IDs if needed
                "allowed_bssids": [b.lower() for b in data['allowed_bssids']] 
            }
        }

        # Upsert: Update if exists, Insert if new
        mongo.db.office_config.update_one(
            {"branch_name": "Main Office"}, 
            {"$set": config}, 
            upsert=True
        )

        return jsonify({"message": "Office Configuration Saved!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500