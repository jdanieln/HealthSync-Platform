import functools
from flask import jsonify, request, g
from firebase_admin import auth

class SecurityMiddleware:
    """Handles authentication and authorization."""
    def __init__(self, db):
        self.db = db

    def verify_token(self, f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            print("DEBUG: verify_token decorator called")
            
            # Preflight OPTIONS requests don't have the Authorization header
            # Let Flask-CORS handle them or return 200 OK
            if request.method == 'OPTIONS':
                return jsonify({}), 200

            if not self.db:
                 # If DB not connected, fail
                 return jsonify({'error': 'Database not connected'}), 503

            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                print("DEBUG: verify_token - Missing or invalid Authorization header")
                return jsonify({'error': 'Unauthorized', 'message': 'Missing Token'}), 401
            
            token = auth_header.split(' ')[1]
            try:
                # Verify Firebase ID Token
                decoded_token = auth.verify_id_token(token)
                uid = decoded_token['uid']
                
                # Fetch user from Firestore to get Role
                user_ref = self.db.collection('users').document(uid)
                user_doc = user_ref.get()
                
                if user_doc.exists:
                    g.user = user_doc.to_dict()
                    g.user['uid'] = uid
                    print(f"DEBUG: verify_token - User found in Firestore. Role: {g.user.get('role')}")
                else:
                    # Fallback: check if doc exists by email
                    req_json = request.get_json(silent=True) or {}
                    email_to_check = req_json.get('email')
                    if email_to_check:
                        users_by_email = self.db.collection('users').where('email', '==', email_to_check).limit(1).get()
                        if users_by_email:
                            matched_doc = users_by_email[0]
                            g.user = matched_doc.to_dict()
                            g.user['uid'] = uid
                            g.user['original_uid'] = matched_doc.id
                            print(f"DEBUG: verify_token - User found by EMAIL. Role: {g.user.get('role')}")
                        else:
                            print(f"DEBUG: verify_token - User {uid} NOT found in Firestore by UID or Email.")
                            g.user = {'uid': uid, 'role': 'GUEST'}
                    else:
                        print(f"DEBUG: verify_token - User {uid} NOT found in Firestore. No email provided for fallback.")
                        g.user = {'uid': uid, 'role': 'GUEST'}
                    
                return f(*args, **kwargs)
            except Exception as e:
                print(f"Token verification error: {e}")
                return jsonify({'error': 'Unauthorized', 'message': 'Invalid Token'}), 401
                
        return decorated_function

    def role_required(self, allowed_roles):
        def decorator(f):
            @functools.wraps(f)
            def decorated_function(*args, **kwargs):
                user_role = g.user.get('role')
                if user_role not in allowed_roles:
                     print(f"DEBUG: role_required - Access denied. User role: {user_role}, Allowed: {allowed_roles}")
                     return jsonify({'error': 'Forbidden', 'message': 'Insufficient Permissions'}), 403
                return f(*args, **kwargs)
            return decorated_function
        return decorator
