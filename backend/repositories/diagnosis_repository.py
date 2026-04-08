class DiagnosisRepository:
    def __init__(self, db):
        self.db = db
        self.collection = self.db.collection('diagnoses')

    def create(self, data):
        _, doc_ref = self.collection.add(data)
        return doc_ref.id

    def get_by_patient_id(self, patient_id):
        docs = self.collection.where('patientId', '==', patient_id).stream()
        return self._format_and_sort(docs)

    def update_patient_id(self, old_uid, new_uid):
        docs = self.collection.where('patientId', '==', old_uid).stream()
        for doc in docs:
            doc.reference.update({'patientId': new_uid})

    def _format_and_sort(self, docs):
        diagnoses = []
        for doc in docs:
            item = doc.to_dict()
            item['id'] = doc.id
            diagnoses.append(item)
            
        diagnoses.sort(key=lambda x: x.get('createdAt').timestamp() if x.get('createdAt') else 0, reverse=True)
        return diagnoses
