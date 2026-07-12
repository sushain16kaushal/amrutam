openapi: 3.0.3
info:
  title: Amrutam Backend API
  description: Telemedicine platform backend — auth, booking, consultations, prescriptions, search, analytics.
  version: 1.0.0
servers:
  - url: http://localhost:5000/api
    description: Local development

tags:
  - name: Auth
  - name: Users
  - name: Doctors
  - name: Bookings
  - name: Consultations
  - name: Prescriptions
  - name: Audit
  - name: Analytics

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    ApiSuccess:
      type: object
      properties:
        success: { type: boolean, example: true }
        data: {}

    ApiError:
      type: object
      properties:
        success: { type: boolean, example: false }
        message: { type: string }

    User:
      type: object
      properties:
        id: { type: string, format: uuid }
        email: { type: string, format: email }
        role: { type: string, enum: [patient, doctor, admin] }

    Consultation:
      type: object
      properties:
        id: { type: string, format: uuid }
        slot_id: { type: string, format: uuid }
        patient_id: { type: string, format: uuid }
        status: { type: string, enum: [confirmed, in_progress, completed, cancelled] }
        created_at: { type: string, format: date-time }

    AvailabilitySlot:
      type: object
      properties:
        id: { type: string, format: uuid }
        doctor_id: { type: string, format: uuid }
        start_time: { type: string, format: date-time }
        end_time: { type: string, format: date-time }
        status: { type: string, enum: [open, booked] }

    Prescription:
      type: object
      properties:
        id: { type: string, format: uuid }
        consultation_id: { type: string, format: uuid }
        details: { type: string }
        issued_at: { type: string, format: date-time }

  responses:
    BadRequest:
      description: Validation error
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiError' }
    Unauthorized:
      description: Missing or invalid authentication
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiError' }
    Forbidden:
      description: Authenticated but not permitted
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiError' }
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiError' }
    Conflict:
      description: Conflicting state (e.g. slot already booked, duplicate email)
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiError' }

paths:
  /auth/register:
    post:
      tags: [Auth]
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8, description: "Must contain an uppercase letter and a number" }
                role: { type: string, enum: [patient, doctor, admin], default: patient }
                fullName: { type: string }
                phone: { type: string }
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiSuccess'
                  - properties: { data: { $ref: '#/components/schemas/User' } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '409': { $ref: '#/components/responses/Conflict' }

  /auth/login:
    post:
      tags: [Auth]
      summary: Login with email + password (step 1 of MFA flow if enabled)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: >
            Either a full accessToken (MFA disabled) or mfaRequired:true with a tempToken
            (MFA enabled — call /auth/verify-mfa next).
        '401': { $ref: '#/components/responses/Unauthorized' }
        '429': { description: Rate limit exceeded }

  /auth/verify-mfa:
    post:
      tags: [Auth]
      summary: Complete login by verifying a TOTP code
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [tempToken, otpCode]
              properties:
                tempToken: { type: string }
                otpCode: { type: string, example: "123456" }
      responses:
        '200': { description: Returns full accessToken }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /auth/enable-mfa:
    post:
      tags: [Auth]
      security: [{ bearerAuth: [] }]
      summary: Enable MFA for the authenticated user
      responses:
        '200': { description: Returns otpauthUrl to render as a QR code }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /users/me:
    get:
      tags: [Users]
      security: [{ bearerAuth: [] }]
      summary: Get the authenticated user's profile
      responses:
        '200': { description: Profile object }
        '404': { $ref: '#/components/responses/NotFound' }
    patch:
      tags: [Users]
      security: [{ bearerAuth: [] }]
      summary: Update the authenticated user's profile
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                fullName: { type: string }
                phone: { type: string }
      responses:
        '200': { description: Updated profile }
        '400': { $ref: '#/components/responses/BadRequest' }

  /doctors/register:
    post:
      tags: [Doctors]
      security: [{ bearerAuth: [] }]
      summary: Register the authenticated user as a doctor
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [specialty]
              properties:
                specialty: { type: string }
      responses:
        '201': { description: Doctor profile created }
        '409': { $ref: '#/components/responses/Conflict' }

  /doctors/availability:
    post:
      tags: [Doctors]
      security: [{ bearerAuth: [] }]
      summary: Add an availability slot (doctor only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [startTime, endTime]
              properties:
                startTime: { type: string, format: date-time }
                endTime: { type: string, format: date-time }
      responses:
        '201':
          description: Slot created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiSuccess'
                  - properties: { data: { $ref: '#/components/schemas/AvailabilitySlot' } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /doctors/{doctorId}/availability:
    get:
      tags: [Doctors]
      summary: List a doctor's open availability slots (public)
      parameters:
        - name: doctorId
          in: path
          required: true
          schema: { type: string, format: uuid }
        - name: fromDate
          in: query
          schema: { type: string, format: date-time }
      responses:
        '200':
          description: List of open slots
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiSuccess'
                  - properties:
                      data:
                        type: array
                        items: { $ref: '#/components/schemas/AvailabilitySlot' }

  /doctors/search:
    get:
      tags: [Doctors]
      summary: Search verified doctors (public)
      parameters:
        - name: specialty
          in: query
          schema: { type: string }
        - name: name
          in: query
          description: Typo-tolerant fuzzy match on doctor full name
          schema: { type: string }
        - name: availableFrom
          in: query
          schema: { type: string, format: date-time }
        - name: availableTo
          in: query
          schema: { type: string, format: date-time }
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 10, maximum: 50 }
      responses:
        '200': { description: Paginated search results }

  /bookings:
    post:
      tags: [Bookings]
      security: [{ bearerAuth: [] }]
      summary: Book an availability slot
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema: { type: string, format: uuid }
          description: Required. Retrying with the same key returns the original response instead of creating a duplicate booking.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [slotId]
              properties:
                slotId: { type: string, format: uuid }
      responses:
        '201':
          description: Booking confirmed
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiSuccess'
                  - properties: { data: { $ref: '#/components/schemas/Consultation' } }
        '400': { description: "Missing Idempotency-Key or invalid input" }
        '402': { description: "Payment failed — booking rolled back (saga)" }
        '409': { description: "Slot unavailable or currently locked by a concurrent request" }

  /consultations/{id}:
    get:
      tags: [Consultations]
      security: [{ bearerAuth: [] }]
      summary: Get a consultation (patient or assigned doctor only)
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: Consultation details }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }

  /consultations/{id}/status:
    patch:
      tags: [Consultations]
      security: [{ bearerAuth: [] }]
      summary: Update consultation status (assigned doctor only)
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status: { type: string, enum: [in_progress, completed] }
      responses:
        '200': { description: Updated consultation }
        '400': { description: "Invalid state transition" }
        '403': { $ref: '#/components/responses/Forbidden' }

  /consultations/{id}/cancel:
    post:
      tags: [Consultations]
      security: [{ bearerAuth: [] }]
      summary: Cancel a confirmed consultation (patient or doctor); reopens the slot
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: Cancelled consultation }
        '400': { description: "Can only cancel a 'confirmed' consultation" }
        '403': { $ref: '#/components/responses/Forbidden' }

  /consultations/{consultationId}/prescriptions:
    post:
      tags: [Prescriptions]
      security: [{ bearerAuth: [] }]
      summary: Write a prescription (assigned doctor only, consultation must be in_progress/completed)
      parameters:
        - name: consultationId
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [details]
              properties:
                details: { type: string, minLength: 5 }
      responses:
        '201':
          description: Prescription created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiSuccess'
                  - properties: { data: { $ref: '#/components/schemas/Prescription' } }
        '400': { description: "Consultation not in a prescribable state" }
        '403': { $ref: '#/components/responses/Forbidden' }
    get:
      tags: [Prescriptions]
      security: [{ bearerAuth: [] }]
      summary: List prescriptions for a consultation (patient or assigned doctor)
      parameters:
        - name: consultationId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200': { description: List of prescriptions }

  /audit-logs:
    get:
      tags: [Audit]
      security: [{ bearerAuth: [] }]
      summary: List audit logs (admin only)
      parameters:
        - name: actorId
          in: query
          schema: { type: string, format: uuid }
        - name: action
          in: query
          schema: { type: string }
        - name: fromDate
          in: query
          schema: { type: string, format: date-time }
        - name: toDate
          in: query
          schema: { type: string, format: date-time }
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        '200': { description: Paginated audit log entries }
        '403': { $ref: '#/components/responses/Forbidden' }

  /analytics/overview:
    get:
      tags: [Analytics]
      security: [{ bearerAuth: [] }]
      summary: Aggregate platform overview (admin only, cached 5 min)
      responses:
        '200': { description: "Totals — consultations, revenue, active doctors/patients" }
        '403': { $ref: '#/components/responses/Forbidden' }

  /analytics/consultations-by-day:
    get:
      tags: [Analytics]
      security: [{ bearerAuth: [] }]
      summary: Daily consultation counts (admin only, cached 5 min)
      parameters:
        - name: days
          in: query
          schema: { type: integer, default: 30, maximum: 90 }
      responses:
        '200': { description: Time-series data }

  /analytics/top-specialties:
    get:
      tags: [Analytics]
      security: [{ bearerAuth: [] }]
      summary: Most-booked specialties (admin only, cached 5 min)
      parameters:
        - name: limit
          in: query
          schema: { type: integer, default: 5, maximum: 20 }
      responses:
        '200': { description: Ranked specialty list }

  /analytics/cancellation-rate:
    get:
      tags: [Analytics]
      security: [{ bearerAuth: [] }]
      summary: Overall cancellation rate (admin only, cached 5 min)
      responses:
        '200': { description: "total, cancelled, cancellationRatePercent" }