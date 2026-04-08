from firebase_admin import firestore

class AppointmentRepository:
    def __init__(self, db):
        self.db = db
        self.collection = self.db.collection('appointments')

    def create(self, data):
        _, doc_ref = self.collection.add(data)
        return doc_ref.id

    def get_by_id(self, appointment_id):
        doc = self.collection.document(appointment_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def update(self, appointment_id, update_data):
        self.collection.document(appointment_id).update(update_data)

    def get_all(self):
        docs = self.collection.stream()
        return self._format_and_sort(docs)

    def get_by_patient_id(self, patient_id):
        docs = self.collection.where('patientId', '==', patient_id).stream()
        return self._format_and_sort(docs)

    def _format_and_sort(self, docs):
        appointments = []
        for doc in docs:
            item = doc.to_dict()
            item['id'] = doc.id
            appointments.append(item)
            
        appointments.sort(key=lambda x: (x.get('date', ''), x.get('time', '')), reverse=True)
        return appointments
