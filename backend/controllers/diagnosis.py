from flask import jsonify, request, g
from firebase_admin import firestore

class DiagnosisController:
    def __init__(self, app, db, middleware):
        self.app = app
        self.db = db
        self.middleware = middleware
        self._register_routes()

    def _register_routes(self):
        self.app.route('/api/diagnoses', methods=['POST'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN', 'DOCTOR'])(self.create_diagnosis))
        )
        self.app.route('/api/diagnoses/patient/<patient_uid>', methods=['GET'])(
            self.middleware.verify_token(self.get_patient_diagnoses)
        )

    def create_diagnosis(self):
        """Create a new medical diagnosis for a patient."""
        data = request.json
        patient_uid = data.get('patientId')
        symptoms = data.get('symptoms')
        diagnosis_text = data.get('diagnosis')
        prescription = data.get('prescription')
        
        if not all([patient_uid, symptoms, diagnosis_text]):
            return jsonify({'error': 'Missing required fields (patientId, symptoms, diagnosis)'}), 400
            
        try:
            appointment_id = data.get('appointmentId')
            
            patient_ref = self.db.collection('users').document(patient_uid)
            patient_doc = patient_ref.get()
            if not patient_doc.exists:
                 return jsonify({'error': 'Patient not found'}), 404
                 
            new_diagnosis = {
                'patientId': patient_uid,
                'doctorId': g.user['uid'],
                'doctorName': g.user.get('displayName', 'Unknown Doctor'),
                'symptoms': symptoms,
                'diagnosis': diagnosis_text,
                'prescription': prescription or '',
                'appointmentId': appointment_id,
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            _, doc_ref = self.db.collection('diagnoses').add(new_diagnosis)
            
            if appointment_id:
                self.db.collection('appointments').document(appointment_id).update({
                    'status': 'COMPLETED',
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                
            return jsonify({'message': 'Diagnosis created and appointment completed', 'id': doc_ref.id}), 201
            
        except Exception as e:
            print(f"Error creating diagnosis: {e}")
            return jsonify({'error': str(e)}), 500

    def get_patient_diagnoses(self, patient_uid):
        """Get all diagnoses for a specific patient."""
        user_role = g.user.get('role')
        user_uid = g.user['uid']
        
        if user_role == 'PATIENT' and user_uid != patient_uid:
            return jsonify({'error': 'Forbidden', 'message': 'You can only view your own history.'}), 403
            
        if user_role not in ['SUPER_ADMIN', 'DOCTOR', 'PATIENT']:
             return jsonify({'error': 'Forbidden', 'message': 'Insufficient Permissions'}), 403

        try:
            diagnoses_ref = self.db.collection('diagnoses').where('patientId', '==', patient_uid)
            docs = diagnoses_ref.stream()
            
            diagnoses = []
            for doc in docs:
                item = doc.to_dict()
                item['id'] = doc.id
                diagnoses.append(item)
                
            diagnoses.sort(key=lambda x: x.get('createdAt').timestamp() if x.get('createdAt') else 0, reverse=True)
                
            return jsonify(diagnoses), 200
            
        except Exception as e:
            print(f"Error retrieving diagnoses: {e}")
            return jsonify({'error': str(e)}), 500
