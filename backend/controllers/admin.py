from flask import jsonify, request
from firebase_admin import auth, firestore

class AdminController:
    def __init__(self, app, db, middleware):
        self.app = app
        self.db = db
        self.middleware = middleware
        self._register_routes()

    def _register_routes(self):
        self.app.route('/api/admin/dashboard', methods=['GET'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN'])(self.admin_dashboard))
        )
        self.app.route('/api/admin/users', methods=['GET'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN'])(self.list_users))
        )
        self.app.route('/api/admin/users', methods=['POST'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN'])(self.create_user))
        )
        self.app.route('/api/admin/users/<uid>', methods=['PUT'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN'])(self.update_user))
        )
        self.app.route('/api/admin/users/<uid>', methods=['DELETE'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN'])(self.delete_user))
        )
        self.app.route('/api/doctors/patients', methods=['GET'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN', 'DOCTOR', 'ASSISTANT'])(self.list_patients))
        )

    def admin_dashboard(self):
        return jsonify({'message': 'Welcome Super Admin', 'data': 'Secret Data'})

    def list_users(self):
        """List all users for management."""
        users_ref = self.db.collection('users')
        docs = users_ref.stream()
        
        users = []
        for doc in docs:
            user = doc.to_dict()
            user['uid'] = doc.id
            users.append(user)
            
        return jsonify(users)

    def create_user(self):
        """Create a new user in Firebase Auth and Firestore."""
        data = request.json
        email = data.get('email')
        display_name = data.get('displayName', '')
        role = data.get('role', 'PATIENT')
        
        ALLOWED_ROLES = ['SUPER_ADMIN', 'DOCTOR', 'ASSISTANT', 'PATIENT']
        if role not in ALLOWED_ROLES:
            return jsonify({'error': 'Invalid role', 'allowed': ALLOWED_ROLES}), 400

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        try:
            user_record = auth.create_user(
                email=email,
                display_name=display_name
            )
            
            self.db.collection('users').document(user_record.uid).set({
                'email': email,
                'displayName': display_name,
                'role': role,
                'createdAt': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({'message': f'User created successfully', 'uid': user_record.uid}), 201
        except Exception as e:
            print(f"Error creating user: {e}")
            return jsonify({'error': str(e)}), 500

    def update_user(self, uid):
        """Update a user's role and/or display name."""
        data = request.json
        new_role = data.get('role')
        new_display_name = data.get('displayName')
        
        ALLOWED_ROLES = ['SUPER_ADMIN', 'DOCTOR', 'ASSISTANT', 'PATIENT']
        
        user_ref = self.db.collection('users').document(uid)
        if not user_ref.get().exists:
            return jsonify({'error': 'User not found in Firestore'}), 404
            
        update_data = {}
        if new_role:
            if new_role not in ALLOWED_ROLES:
                return jsonify({'error': 'Invalid role', 'allowed': ALLOWED_ROLES}), 400
            update_data['role'] = new_role
            
        if new_display_name is not None:
            update_data['displayName'] = new_display_name
            try:
                 auth.update_user(uid, display_name=new_display_name)
            except Exception as e:
                 print(f"Error updating display name in auth: {e}")
                 return jsonify({'error': str(e)}), 500

        if update_data:
            user_ref.update(update_data)
            
        return jsonify({'message': f'User updated successfully'})

    def delete_user(self, uid):
        """Delete a user from Firebase Auth and Firestore."""
        try:
            auth.delete_user(uid)
            self.db.collection('users').document(uid).delete()
            return jsonify({'message': 'User deleted successfully'})
        except Exception as e:
            print(f"Error deleting user: {e}")
            return jsonify({'error': str(e)}), 500

    def list_patients(self):
        """Returns a list of all users with PATIENT role."""
        try:
            users_ref = self.db.collection('users').where('role', '==', 'PATIENT')
            docs = users_ref.stream()
            
            patients = []
            for doc in docs:
                user = doc.to_dict()
                user['uid'] = doc.id
                patients.append(user)
                
            return jsonify(patients), 200
        except Exception as e:
             print(f"Error listing patients: {e}")
             return jsonify({'error': str(e)}), 500
