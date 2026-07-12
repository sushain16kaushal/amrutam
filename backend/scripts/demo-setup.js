// scripts/demo-setup.js
const AUTH = 'http://localhost:5000/api/auth';
const DOC = 'http://localhost:5000/api/doctors';

const run = async () => {
  const doctorEmail = `demo_doctor_${Date.now()}@amrutam.com`;
  await fetch(`${AUTH}/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: doctorEmail, password: 'Test@1234', role: 'doctor' })});
  const doctorLogin = await (await fetch(`${AUTH}/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: doctorEmail, password: 'Test@1234' })})).json();
  const doctorToken = doctorLogin.data.accessToken;

  const doctorReg = await (await fetch(`${DOC}/register`, { method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${doctorToken}`}, body: JSON.stringify({ specialty: 'Cardiology' })})).json();

  const start = new Date(Date.now() + 24*60*60*1000);
  const end = new Date(start.getTime() + 30*60*1000);
  const slot = await (await fetch(`${DOC}/availability`, { method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${doctorToken}`}, body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() })})).json();

  const start2 = new Date(Date.now() + 48*60*60*1000);
  const end2 = new Date(start2.getTime() + 30*60*1000);
  const slot2 = await (await fetch(`${DOC}/availability`, { method: 'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${doctorToken}`}, body: JSON.stringify({ startTime: start2.toISOString(), endTime: end2.toISOString() })})).json();

  const patientEmail = `demo_patient_${Date.now()}@amrutam.com`;
  await fetch(`${AUTH}/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: patientEmail, password: 'Test@1234', role: 'patient' })});
  const patientLogin = await (await fetch(`${AUTH}/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: patientEmail, password: 'Test@1234' })})).json();

  const patient2Email = `demo_patient2_${Date.now()}@amrutam.com`;
  await fetch(`${AUTH}/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: patient2Email, password: 'Test@1234', role: 'patient' })});
  const patient2Login = await (await fetch(`${AUTH}/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: patient2Email, password: 'Test@1234' })})).json();

  const adminEmail = `demo_admin_${Date.now()}@amrutam.com`;
  await fetch(`${AUTH}/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: adminEmail, password: 'Test@1234', role: 'admin' })});
  const adminLogin = await (await fetch(`${AUTH}/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: adminEmail, password: 'Test@1234' })})).json();

  console.log('\n========= COPY THESE INTO POSTMAN =========');
  console.log('DOCTOR_ID:', doctorReg.data.id);
  console.log('SLOT_1_ID (for successful booking):', slot.data.id);
  console.log('SLOT_2_ID (for payment-fail demo):', slot2.data.id);
  console.log('PATIENT_TOKEN:', patientLogin.data.accessToken);
  console.log('PATIENT_2_TOKEN (for 409 demo):', patient2Login.data.accessToken);
  console.log('ADMIN_TOKEN:', adminLogin.data.accessToken);
  console.log('=============================================\n');
};

run().catch(console.error);