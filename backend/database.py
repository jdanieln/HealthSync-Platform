import os
import firebase_admin
from firebase_admin import credentials, firestore

class Database:
    """Manages database connection and setup."""
    def __init__(self):
        self.db = None
        self._initialize()

    def _initialize(self):
        cred_path = os.getenv('FIREBASE_CREDENTIALS', 'serviceAccountKey.json')
        
        if not firebase_admin._apps:
            if os.getenv('FIREBASE_PRIVATE_KEY'):
                private_key = os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n')
                
                cred_dict = {
                    "type": os.getenv('FIREBASE_TYPE', 'service_account'),
                    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                    "private_key": private_key,
                    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                    "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
                    "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
                    "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL', 'https://www.googleapis.com/oauth2/v1/certs'),
                    "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
                    "universe_domain": os.getenv('FIREBASE_UNIVERSE_DOMAIN', 'googleapis.com')
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'your-project-id.appspot.com')
                })
                print("Firebase Admin Initialized from environment variables")
                self.db = firestore.client()
            elif os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'your-project-id.appspot.com')
                })
                print(f"Firebase Admin Initialized from file: {cred_path}")
                self.db = firestore.client()
            else:
                print(f"Warning: Firebase credentials not found at {cred_path} or in env vars. Firebase features will not work.")
                self.db = None
        else:
            self.db = firestore.client()
            
    def get_db(self):
        return self.db
