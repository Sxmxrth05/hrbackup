from flask import Flask
from flask_cors import CORS
from db import init_db

app = Flask(__name__)
CORS(app)

# 1. Initialize Database first
init_db(app)

# 2. NOW import and register blueprints
from routes.attendance_routes import attendance_bp
from routes.office_routes import office_bp
from routes.payroll_routes import payroll_bp

app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
app.register_blueprint(office_bp, url_prefix="/api/office")
app.register_blueprint(payroll_bp, url_prefix="/api/payroll")

@app.route("/")
def home():
    return "WorkSphere AI Backend Running 🚀"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)