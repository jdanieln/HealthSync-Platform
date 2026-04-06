from flask import jsonify

class HealthController:
    def __init__(self, app, db):
        self.app = app
        self.db = db
        self._register_routes()

    def _register_routes(self):
        self.app.route('/api/health', methods=['GET'])(self.health_check)

    def health_check(self):
        return jsonify({
            "status": "healthy",
            "firebase_connected": self.db is not None
        })
