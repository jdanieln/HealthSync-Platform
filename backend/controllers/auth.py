from flask import jsonify, request, g
from firebase_admin import firestore

class AuthController:
    def __init__(self, app, db, middleware):
        self.app = app
        self.db = db
        self.middleware = middleware
        self._register_routes()

    def _register_routes(self):
        self.app.route('/api/auth/sync', methods=['POST', 'OPTIONS'])(
            self.middleware.verify_token(self.sync_user)
        )

    def sync_user(self):
        """
        Called by frontend on login. Ensures user exists in Firestore.
        If new, sets default role 'PATIENT'. Returns the user's role.
        """
        uid = g.user['uid']
        user_data = g.user
        
        print(f"DEBUG: sync_user called for UID: {uid}")
        
        user_ref = self.db.collection('users').document(uid)
        doc = user_ref.get()
        
        if not doc.exists:
            req_json = request.get_json(silent=True) or {}
            email = req_json.get('email', '')
            
            existing_users = self.db.collection('users').where('email', '==', email).limit(1).get()
            
            if existing_users:
                print(f"DEBUG: sync_user - Found existing user by email. Migrating old record to new Google UID {uid}")
                old_doc = existing_users[0]
                old_data = old_doc.to_dict()
                
                user_ref.set(old_data)
                old_doc.reference.delete()
                
                try:
                     old_uid = old_doc.id
                     diagnoses_ref = self.db.collection('diagnoses').where('patientId', '==', old_uid).stream()
                     for d in diagnoses_ref:
                          d.reference.update({'patientId': uid})
                     print(f"DEBUG: Migrated diagnoses to new UID {uid}")
                except Exception as e:
                     print(f"Error migrating diagnoses: {e}")
                     
                return jsonify({'message': 'User synced and migrated', 'role': old_data.get('role')})
                
            else:
                print(f"DEBUG: sync_user - Creating new user for {uid}")
                new_user = {
                    'email': email,
                    'displayName': req_json.get('displayName', ''),
                    'role': 'PATIENT',
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                user_ref.set(new_user)
                return jsonify({'message': 'User created', 'role': 'PATIENT'})
        else:
            current_role = user_data.get('role')
            if current_role == 'GUEST' and 'original_uid' in user_data:
                 current_role = user_data.get('role', 'PATIENT')
                 
            print(f"DEBUG: sync_user - User exists. Returning role: {current_role}")
            return jsonify({'message': 'User synced', 'role': current_role})
