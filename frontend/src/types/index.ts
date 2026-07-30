export type User = {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
};

export type Doctor = {
  id: string;
  specialty: string;
  verified: boolean;
  full_name: string | null;
};

export type AvailabilitySlot = {
  id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: 'open' | 'booked';
  capacity: number;
  booked_count: number; 
};

export type Consultation = {
  id: string;
  slot_id: string;
  patient_id: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
};
export type MyConsultation = {
  id: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  start_time: string;
  end_time: string;
  doctor_id: string;
  specialty: string;
  doctor_name: string | null;
};
export type Prescription = {
  id: string;
  consultation_id: string;
  details: string;
  issued_at: string;
};
export type AssignedConsultation = {
  id: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  start_time: string;
  end_time: string;
  patient_name: string | null;
  patient_id: string;
};

export type DoctorProfile = {
  id: string;
  specialty: string;
  verified: boolean;
};

export type ConsultationMessage = {
  id: string;
  consultation_id: string;
  sender_id: string;
  message_type: 'text' | 'image';
  content: string;
  created_at: string;
};

export type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  patient_name: string | null;
  created_at: string;
};

export type DoctorReviewsData = {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
};

export type RefundRequest = {
  id: string;
  consultation_id: string;
  patient_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_message: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_email?: string;
};
