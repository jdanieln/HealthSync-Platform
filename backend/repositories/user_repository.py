from firebase_admin import auth, firestore

class UserRepository:
    def __init__(self, db):
        self.db = db
        self.collection = self.db.collection('users')

    def get_by_uid(self, uid):
        doc = self.collection.document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            data['uid'] = doc.id
            return data
        return None

    def get_by_email(self, email):
        docs = self.collection.where('email', '==', email).limit(1).get()
        if docs:
            doc = docs[0]
            data = doc.to_dict()
            data['uid'] = doc.id
            return data, doc.reference
        return None, None

    def create(self, uid, user_data):
        self.collection.document(uid).set(user_data)
        
    def update(self, uid, update_data):
        self.collection.document(uid).update(update_data)
        
    def delete(self, uid):
        self.collection.document(uid).delete()

    def get_all(self):
        docs = self.collection.stream()
        return [self._format_doc(doc) for doc in docs]

    def get_patients(self):
        docs = self.collection.where('role', '==', 'PATIENT').stream()
        return [self._format_doc(doc) for doc in docs]

    def create_auth_user(self, email, display_name):
        return auth.create_user(email=email, display_name=display_name)

    def update_auth_user(self, uid, display_name):
        return auth.update_user(uid, display_name=display_name)

    def delete_auth_user(self, uid):
        auth.delete_user(uid)

    def _format_doc(self, doc):
        data = doc.to_dict()
        data['uid'] = doc.id
        return data
