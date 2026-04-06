from flask import jsonify, request, g
from firebase_admin import firestore

class AppointmentController:
    def __init__(self, app, db, middleware):
        self.app = app
        self.db = db
        self.middleware = middleware
        self._register_routes()

    def _register_routes(self):
        self.app.route('/api/appointments', methods=['POST'])(
            self.middleware.verify_token(self.middleware.role_required(['PATIENT'])(self.create_appointment))
        )
        self.app.route('/api/appointments', methods=['GET'])(
            self.middleware.verify_token(self.list_appointments)
        )
        self.app.route('/api/appointments/<appointment_id>', methods=['PUT'])(
            self.middleware.verify_token(self.middleware.role_required(['SUPER_ADMIN', 'DOCTOR'])(self.update_appointment_status))
        )

    def create_appointment(self):
        """Patient requests an appointment."""
        data = request.json
        date = data.get('date')
        time = data.get('time')
        reason = data.get('reason', '')
        
        if not all([date, time]):
            return jsonify({'error': 'Missing date or time'}), 400
            
        try:
            new_appointment = {
                'patientId': g.user['uid'],
                'patientName': g.user.get('displayName', 'Unknown Patient'),
                'patientEmail': g.user.get('email'),
                'date': date,
                'time': time,
                'reason': reason,
                'status': 'PENDING',
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            _, doc_ref = self.db.collection('appointments').add(new_appointment)
            return jsonify({'message': 'Appointment requested successfully', 'id': doc_ref.id}), 201
        except Exception as e:
            print(f"Error creating appointment: {e}")
            return jsonify({'error': str(e)}), 500

    def list_appointments(self):
        """List appointments based on role."""
        user_role = g.user.get('role')
        user_uid = g.user['uid']
        
        try:
            if user_role == 'PATIENT':
                query = self.db.collection('appointments').where('patientId', '==', user_uid)
            else:
                query = self.db.collection('appointments')
                
            docs = query.stream()
            appointments = []
            for doc in docs:
                item = doc.to_dict()
                item['id'] = doc.id
                appointments.append(item)
                
            appointments.sort(key=lambda x: (x.get('date', ''), x.get('time', '')), reverse=True)
            
            return jsonify(appointments), 200
        except Exception as e:
            print(f"Error listing appointments: {e}")
            return jsonify({'error': str(e)}), 500

    def update_appointment_status(self, appointment_id):
        """Update appointment status (APPROVED, REJECTED, COMPLETED)."""
        data = request.json
        new_status = data.get('status')
        
        ALLOWED_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']
        if new_status not in ALLOWED_STATUSES:
            return jsonify({'error': 'Invalid status', 'allowed': ALLOWED_STATUSES}), 400
            
        try:
            app_ref = self.db.collection('appointments').document(appointment_id)
            if not app_ref.get().exists:
                return jsonify({'error': 'Appointment not found'}), 404
                
            app_ref.update({
                'status': new_status,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'processedBy': g.user['uid'],
                'processedByName': g.user.get('displayName', 'Unknown')
            })
            
            return jsonify({'message': f'Appointment status updated to {new_status}'})
        except Exception as e:
            print(f"Error updating appointment: {e}")
            return jsonify({'error': str(e)}), 500
