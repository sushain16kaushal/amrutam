// Amrutam — AI Doctor Knowledge Base — Batch 1
// Specialties: Cardiology, Dermatology, Pediatrics
//
// Har chunk: { specialty, topic, content, source }
// content: general educational info, paraphrased from trusted public-health sources
//   (CDC, MedlinePlus public-domain sections, general established clinical knowledge).
// source: internal tracking tag — NOT for verbatim reproduction, just provenance record.
//
// Review note (Sushain): content medically-reviewed sources se hai, tumhe sirf
// relevance/formatting check karni hai — accuracy pehle se authoritative hai.
// Har chunk ke end mein disclaimer nahi hai — woh AI response-generation ke waqt
// system-prompt level pe add hota hai (persona config se), knowledge chunk mein nahi.

export const KNOWLEDGE_BASE_BATCH_1 = [
  // ---------------- CARDIOLOGY ----------------
  {
    specialty: 'Cardiology',
    topic: 'High Blood Pressure (Hypertension)',
    content: 'High blood pressure, or hypertension, occurs when the force of blood against artery walls stays consistently elevated. Current guidance considers a reading at or above 130/80 mmHg to be high, while below 120/80 mmHg is considered normal. Most people with high blood pressure feel no symptoms at all, which is why it is often called a "silent" condition — regular measurement is the only reliable way to detect it. Left unmanaged, it raises the risk of heart disease, stroke, kidney damage, and vision problems. Lifestyle changes (reduced salt intake, regular physical activity, limiting alcohol, maintaining a healthy weight) and, when needed, prescribed medication are the standard management approaches.',
    source: 'CDC (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Coronary Artery Disease',
    content: 'Coronary artery disease develops when the blood vessels supplying the heart muscle become narrowed, usually due to fatty deposits (plaque) building up over years. This can reduce blood flow to the heart, causing chest discomfort during exertion (angina), and in severe cases can lead to a heart attack if a vessel becomes blocked. Common risk factors include high blood pressure, high cholesterol, smoking, diabetes, and a sedentary lifestyle. Management typically combines lifestyle changes, medication, and — in more advanced cases — procedures to restore blood flow.',
    source: 'CDC / general clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Heart Failure — General Overview',
    content: 'Heart failure means the heart is not pumping blood as efficiently as it should — it does not mean the heart has stopped working. Common signs include shortness of breath (especially when lying down or during activity), persistent fatigue, and swelling in the legs, ankles, or abdomen due to fluid buildup. It is usually a chronic, manageable condition rather than a sudden event, often resulting from long-term conditions like hypertension or coronary artery disease. Ongoing medical management, medication adherence, and monitoring fluid intake are central to living well with heart failure.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Palpitations and Irregular Heartbeat',
    content: 'Palpitations refer to a noticeable sensation of the heart beating irregularly, too fast, or too forcefully. They are often triggered by caffeine, stress, dehydration, lack of sleep, or intense exercise, and are frequently harmless. However, palpitations accompanied by chest pain, fainting, severe breathlessness, or that last an extended period can indicate an underlying arrhythmia and warrant prompt in-person evaluation, particularly in people with existing heart conditions.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'High Cholesterol',
    content: 'Cholesterol is a fat-like substance the body needs in small amounts, but excess LDL ("bad") cholesterol can build up in artery walls and increase heart disease risk, while HDL ("good") cholesterol helps remove it. High cholesterol typically causes no symptoms and is identified through a blood test. Diet high in saturated fats, physical inactivity, smoking, and genetics all contribute to elevated levels. Management usually involves dietary changes, increased physical activity, and sometimes cholesterol-lowering medication.',
    source: 'CDC / MedlinePlus (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Heart Attack Warning Signs',
    content: 'Common heart attack warning signs include chest pain or pressure (often described as tightness or squeezing), pain spreading to the arm, jaw, neck, or back, shortness of breath, cold sweat, nausea, and lightheadedness. Symptoms can be less typical in women, sometimes presenting more as fatigue, indigestion-like discomfort, or breathlessness without prominent chest pain. Any suspected heart attack is a medical emergency requiring immediate emergency care — this is not a situation for general guidance or waiting to see if symptoms pass.',
    source: 'CDC (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Stroke Warning Signs',
    content: 'Stroke symptoms often appear suddenly and can include facial drooping on one side, weakness or numbness in an arm or leg (especially one-sided), slurred or difficult speech, and sudden severe headache or vision changes. A common way to remember warning signs is the acronym FAST — Face drooping, Arm weakness, Speech difficulty, Time to call emergency services. Because brain tissue can be damaged quickly, stroke is a medical emergency where every minute matters — immediate emergency care is essential rather than general guidance.',
    source: 'CDC (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Chest Pain — General Context',
    content: 'Chest pain has many possible causes ranging from muscle strain and acid reflux to anxiety and, less commonly but seriously, heart-related conditions. Pain that is sharp and worsens with specific movement or breathing is more often musculoskeletal, while pressure-like pain associated with exertion, sweating, breathlessness, or radiating to the arm/jaw raises more concern for a cardiac cause. Because it is not possible to reliably distinguish these causes through conversation alone, any new, severe, or persistent chest pain — especially with other warning signs — should be evaluated in person promptly.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Cardiology',
    topic: 'Heart-Healthy Lifestyle Habits',
    content: 'Key habits associated with lower cardiovascular risk include regular physical activity (around 150 minutes of moderate activity per week), a diet emphasizing vegetables, fruits, whole grains, and limited salt/saturated fat, maintaining a healthy weight, not smoking, moderating alcohol intake, managing stress, and getting adequate sleep. These changes support blood pressure, cholesterol, and overall heart function, and are recommended alongside — not as a replacement for — any prescribed medical treatment.',
    source: 'CDC (paraphrased)'
  },

  // ---------------- DERMATOLOGY ----------------
  {
    specialty: 'Dermatology',
    topic: 'Acne — General Overview',
    content: 'Acne occurs when hair follicles become clogged with oil and dead skin cells, often worsened by hormonal changes, certain medications, or bacteria on the skin. It commonly appears as whiteheads, blackheads, pimples, or deeper cystic breakouts, most often on the face, chest, and back. Gentle cleansing, avoiding excessive scrubbing, and over-the-counter treatments containing benzoyl peroxide or salicylic acid are common first-line approaches. Persistent, painful, or scarring acne is best evaluated in person, as prescription treatment may be more effective.',
    source: 'MedlinePlus (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Eczema (Atopic Dermatitis)',
    content: 'Eczema is a chronic condition causing dry, itchy, inflamed patches of skin, often appearing in the creases of elbows and knees, though it can occur anywhere. It tends to flare up periodically, often triggered by irritants like harsh soaps, certain fabrics, temperature changes, or stress, and is common in people with a personal or family history of allergies or asthma. Regular moisturizing, avoiding known triggers, and gentle skincare routines help manage symptoms; persistent or severe flares may need prescription treatment.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Psoriasis',
    content: 'Psoriasis is a chronic autoimmune condition that causes skin cells to build up rapidly, forming thick, scaly, sometimes silvery patches, commonly on the elbows, knees, scalp, and lower back. It is not contagious. Triggers can include stress, skin injury, certain infections, and some medications. It tends to follow a pattern of flares and remission, and while there is no cure, various topical and systemic treatments can meaningfully reduce symptoms — in-person dermatological care is generally recommended for an accurate diagnosis and treatment plan.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Fungal Skin Infections',
    content: 'Common fungal skin infections include ringworm (a ring-shaped, scaly, itchy rash despite the name having nothing to do with worms) and athlete\'s foot (itching, peeling skin, often between the toes). These infections thrive in warm, moist environments and can spread through direct contact or shared surfaces like towels or gym floors. Keeping the affected area clean and dry, along with over-the-counter antifungal creams, is a common first step; infections that don\'t improve or keep recurring should be evaluated in person.',
    source: 'MedlinePlus (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Contact Dermatitis',
    content: 'Contact dermatitis is a skin reaction caused by direct contact with an irritating substance or an allergen — common triggers include certain soaps, cosmetics, jewelry (especially nickel), plants, or chemicals. It typically presents as redness, itching, and sometimes blistering limited to the area of contact. Identifying and avoiding the trigger is central to management, along with gentle cleansing and, if needed, mild topical treatments for symptom relief.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Hives (Urticaria)',
    content: 'Hives appear as raised, itchy welts on the skin that can vary in size and often move or change location over hours. They are commonly triggered by allergic reactions (to foods, medications, insect bites), infections, stress, or temperature changes, though a specific trigger is often not identified. Most cases resolve on their own or with antihistamines. Hives accompanied by swelling of the face/throat, difficulty breathing, or dizziness are signs of a potentially serious allergic reaction and require emergency care immediately.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Warts',
    content: 'Warts are small, rough skin growths caused by human papillomavirus (HPV) infecting the outer skin layer, commonly appearing on hands, fingers, or feet. They are generally harmless and often resolve on their own over months to years, though this can take a long time. Over-the-counter treatments containing salicylic acid can help, and in-person removal (freezing, minor procedures) is an option for persistent or bothersome warts.',
    source: 'MedlinePlus (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Skin Cancer Warning Signs (ABCDE Rule)',
    content: 'A helpful way to evaluate a mole or skin spot for possible concern is the ABCDE rule: Asymmetry (one half doesn\'t match the other), Border irregularity, Color variation within the same spot, Diameter larger than about 6mm, and Evolving (changing in size, shape, or color over time). Any mole or skin change matching these patterns — or any new, unusual, or changing skin growth — should be examined in person by a doctor promptly, as this cannot be reliably assessed through a text description alone.',
    source: 'CDC / general clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Dermatology',
    topic: 'Dry Skin Care Basics',
    content: 'Dry skin is often worsened by hot showers, harsh soaps, low humidity, and frequent hand-washing. Helpful habits include using lukewarm rather than hot water, applying fragrance-free moisturizer immediately after bathing while skin is still damp, using gentle cleansers, and using a humidifier in dry environments. Persistent dryness, cracking, or itching that doesn\'t improve with these measures may benefit from in-person evaluation, especially if an underlying skin condition is suspected.',
    source: 'General clinical knowledge (paraphrased)'
  },

  // ---------------- PEDIATRICS ----------------
  {
    specialty: 'Pediatrics',
    topic: 'Fever in Children — General Guidance',
    content: 'Fever in children is generally defined as a temperature at or above 100.4°F (38°C) and is usually the body\'s normal response to fighting infection rather than a condition in itself. For most children, comfort measures (rest, fluids, light clothing) are the main focus rather than the exact number on the thermometer. However, fever in an infant under 3 months old, a fever above 104°F (40°C), a fever lasting more than a few days, or fever accompanied by difficulty breathing, rash, stiff neck, unusual drowsiness, or refusal to drink fluids should prompt urgent in-person medical evaluation — this is not something to manage through general guidance alone.',
    source: 'CDC / general clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Common Cold in Children',
    content: 'The common cold in children typically causes a runny or stuffy nose, sneezing, mild cough, and sometimes a low-grade fever, usually caused by a virus and resolving within 7-10 days. Rest, fluids, and saline nasal drops (for younger children) are typical supportive measures — antibiotics do not help, since colds are viral. Signs that warrant in-person evaluation include difficulty breathing, high fever, ear pain, symptoms lasting beyond 10-14 days, or a child who seems unusually unwell.',
    source: 'CDC (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Ear Infections (Otitis Media)',
    content: 'Middle ear infections are common in young children and often follow a cold, causing ear pain, tugging at the ear, difficulty sleeping, and sometimes fever. Many mild ear infections improve on their own within a few days, and pain relief measures can help in the meantime. Persistent pain beyond 2-3 days, high fever, fluid draining from the ear, or symptoms in a very young infant should be evaluated in person, as some cases benefit from antibiotic treatment.',
    source: 'CDC / general clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Childhood Vaccination — General Awareness',
    content: 'Routine childhood vaccination schedules are designed to protect against serious diseases at the ages when children are most vulnerable, with most schedules covering vaccines from birth through adolescence. Exact schedules and specific vaccines vary by country and are set by national health authorities. Parents with questions about a specific child\'s vaccination timing, catch-up schedules, or medical exemptions should discuss this with an in-person pediatrician, since individual health history matters for these decisions.',
    source: 'CDC (paraphrased, general awareness only — not a substitute for official schedule)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Diaper Rash',
    content: 'Diaper rash is a common skin irritation in the diaper area, usually caused by prolonged contact with wetness, friction, or sometimes a yeast infection. Frequent diaper changes, allowing some diaper-free time, gentle cleaning, and a barrier cream (like one containing zinc oxide) are typical supportive measures. A rash that is severe, doesn\'t improve within a few days, involves blistering or pus, or is accompanied by fever should be evaluated in person.',
    source: 'MedlinePlus (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Childhood Asthma — General Overview',
    content: 'Asthma in children involves inflammation and narrowing of the airways, causing wheezing, coughing (especially at night or with activity), chest tightness, and shortness of breath. Common triggers include respiratory infections, allergens, exercise, and cold air. Asthma management typically involves an individualized plan from a doctor, including trigger avoidance and prescribed medications. Difficulty breathing, bluish lips, or a child unable to speak in full sentences due to breathlessness are emergency signs requiring immediate care.',
    source: 'CDC / general clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Constipation in Children',
    content: 'Constipation in children is common and often related to diet (low fiber or fluid intake), changes in routine, or withholding stool due to discomfort or toilet-training stress. Increasing fiber-rich foods and fluids, and encouraging regular bathroom routines, often help. Persistent constipation lasting more than 1-2 weeks, blood in the stool, significant abdominal pain, or a child who seems unwell should be evaluated in person.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Croup',
    content: 'Croup is a viral infection causing swelling around the vocal cords and windpipe, leading to a distinctive barking cough, hoarse voice, and sometimes a harsh sound when breathing in (stridor), most common in young children. Symptoms are often worse at night and can improve with cool or humid air. Mild cases can often be managed at home, but difficulty breathing, stridor at rest, bluish lips, or the child struggling to breathe requires immediate emergency care.',
    source: 'General clinical knowledge (paraphrased)'
  },
  {
    specialty: 'Pediatrics',
    topic: 'Hand, Foot, and Mouth Disease',
    content: 'Hand, foot, and mouth disease is a common, usually mild viral illness in young children causing fever, sores in the mouth, and a rash or blisters on the hands and feet. It spreads easily in daycare/school settings through close contact. Most cases resolve within 7-10 days with supportive care (fluids, pain relief for mouth sores). Signs needing in-person evaluation include signs of dehydration, high or prolonged fever, or the child appearing significantly unwell.',
    source: 'CDC (paraphrased)'
  }
];