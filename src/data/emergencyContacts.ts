export interface OfficialEmergencyContact {
  id: string;
  label: string;
  department: string;
  numbers: string[];
  availability: string;
  source: string;
}

export const OFFICIAL_LPU_EMERGENCY_CONTACTS: OfficialEmergencyContact[] = [
  {
    id: 'uni-hospital-emergency',
    label: 'Uni-Hospital Medical Emergency',
    department: 'Uni Health Centre (24×7 Ambulance & Emergency)',
    numbers: ['01824-501227', '01824-444079', '97800-36453', '75081-82840'],
    availability: '24×7 Verified',
    source: 'Official LPU Health Centre Directory (lpu.in)',
  },
  {
    id: 'campus-security',
    label: 'Campus Security Office',
    department: 'Security Section 1 (Ext. 4365)',
    numbers: ['01824-444365'],
    availability: '24×7 Campus Security',
    source: 'Official LPU Directory (lpu.in)',
  },
  {
    id: 'student-welfare',
    label: 'Division of Student Welfare',
    department: 'Student Support & Enquiries',
    numbers: ['01824-444500'],
    availability: 'Official University Helpline',
    source: 'Official LPU Directory (lpu.in)',
  },
  {
    id: 'general-helpline',
    label: 'LPU Main Switchboard',
    department: 'General Campus Enquiry',
    numbers: ['01824-517000'],
    availability: 'University Helpline',
    source: 'Official LPU Website (lpu.in)',
  },
];
