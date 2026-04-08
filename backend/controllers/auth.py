from flask import jsonify, request, g
from firebase_admin import firestore

class AuthController:
    def __init__(self, app, user_repo, diagnosis_repo, middleware):
        self.app = app
        self.user_repo = user_repo
        self.diagnosis_repo = diagnosis_repo
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
        
        existing_doc = self.user_repo.get_by_uid(uid)
        
        if not existing_doc:
            req_json = request.get_json(silent=True) or {}
            email = req_json.get('email', '')
            
            old_user, old_ref = self.user_repo.get_by_email(email)
            
            if old_user:
                print(f"DEBUG: sync_user - Found existing user by email. Migrating old record to new Google UID {uid}")
                
                old_uid = old_user.pop('uid', None)
                self.user_repo.create(uid, old_user)
                if old_uid:
                    self.user_repo.delete(old_uid)
                
                try:
                     self.diagnosis_repo.update_patient_id(old_uid, uid)
                     print(f"DEBUG: Migrated diagnoses to new UID {uid}")
                except Exception as e:
                     print(f"Error migrating diagnoses: {e}")
                     
                return jsonify({'message': 'User synced and migrated', 'role': old_user.get('role')})
                
            else:
                print(f"DEBUG: sync_user - Creating new user for {uid}")
                new_user_data = {
                    'email': email,
                    'displayName': req_json.get('displayName', ''),
                    'role': 'PATIENT',
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                self.user_repo.create(uid, new_user_data)
                return jsonify({'message': 'User created', 'role': 'PATIENT'})
        else:
            current_role = existing_doc.get('role')
            if current_role == 'GUEST' and 'original_uid' in user_data:
                 current_role = existing_doc.get('role', 'PATIENT')
                 
            print(f"DEBUG: sync_user - User exists. Returning role: {current_role}")
            return jsonify({'message': 'User synced', 'role': current_role})
