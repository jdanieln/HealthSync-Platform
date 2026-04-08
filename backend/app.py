import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv

from database import Database
from middleware import SecurityMiddleware

from controllers.auth import AuthController
from controllers.health import HealthController
from controllers.admin import AdminController
from controllers.diagnosis import DiagnosisController
from controllers.appointment import AppointmentController

from repositories import UserRepository, AppointmentRepository, DiagnosisRepository

class HealthSyncApp:
    def __init__(self):
        dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        load_dotenv(dotenv_path)

        self.app = Flask(__name__)
        self.database = Database()
        self.db = self.database.get_db()
        self.middleware = SecurityMiddleware(self.db)
        
        self.user_repo = UserRepository(self.db)
        self.appointment_repo = AppointmentRepository(self.db)
        self.diagnosis_repo = DiagnosisRepository(self.db)
        
        self._setup_cors()
        self._register_controllers()

    def _setup_cors(self):
        @self.app.after_request
        def add_cors_headers(response):
            origin = request.headers.get('Origin')
            if origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"]:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Access-Control-Allow-Credentials'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return response

        @self.app.route('/api/<path:path>', methods=['OPTIONS'])
        def handle_options(path):
            return jsonify({}), 200

    def _register_controllers(self):
        AuthController(self.app, self.user_repo, self.diagnosis_repo, self.middleware)
        HealthController(self.app, self.db)
        AdminController(self.app, self.user_repo, self.middleware)
        DiagnosisController(self.app, self.diagnosis_repo, self.user_repo, self.appointment_repo, self.middleware)
        AppointmentController(self.app, self.appointment_repo, self.middleware)

    def run(self, **kwargs):
        self.app.run(**kwargs)

if __name__ == '__main__':
    api = HealthSyncApp()
    port = int(os.getenv('API_PORT', 5005))
    api.run(debug=False, port=port)
