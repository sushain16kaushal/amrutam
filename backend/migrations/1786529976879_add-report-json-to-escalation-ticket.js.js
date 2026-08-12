export const up = (pgm) => {
  pgm.addColumns('consultations', {
    health_report_json: {
      type: 'jsonb',
      default: null // consultation-end pe generate hui structured report (chiefComplaint, symptomsSummary, etc.)
    },
    health_report_clinics: {
      type: 'jsonb',
      default: null // nearby clinics/hospitals snapshot, jab report generate hui thi
    },
    health_report_generated_at: {
      type: 'timestamp',
      default: null
    }
  });
};

export const down = (pgm) => {
  pgm.dropColumns('consultations', ['health_report_json', 'health_report_clinics', 'health_report_generated_at']);
};


