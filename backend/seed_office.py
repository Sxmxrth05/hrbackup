from pymongo import MongoClient

# Use your connection string
MONGO_URI = "mongodb+srv://Admin:Sam%40123@cluster0.2ecioch.mongodb.net/attendance"
client = MongoClient(MONGO_URI)
db = client.attendance

# Create the Office Config
office_data = {
    "branch_name": "Main Office",
    "location": {
        "latitude": 0.0,            # Matches your current Android output
        "longitude": 0.0,           # Matches your current Android output
        "allowed_radius_meters": 5000 # Large radius for testing
    },
    "wifi": {
        "allowed_bssids": ["wifi", "00:13:10:85:fe:01"] # Matches your 'WIFI' output
    }
}

# Insert or Update
db.office_config.update_one(
    {"branch_name": "Main Office"},
    {"$set": office_data},
    upsert=True
)

print("✅ 'Main Office' configuration has been created in MongoDB!")