from pymongo import MongoClient
from flask_pymongo import PyMongo

MONGO_URI = "mongodb+srv://Admin:Sam%40123@cluster0.2ecioch.mongodb.net/attendance"

# 1. Your existing connection for general use
client = MongoClient(MONGO_URI)
db = client.attendance
attendance_collection = db.attendances

# 2. The 'mongo' object your routes are looking for
mongo = PyMongo()

def init_db(app):
    app.config["MONGO_URI"] = MONGO_URI
    mongo.init_app(app)
    print("✅ Connected to MongoDB Atlas")