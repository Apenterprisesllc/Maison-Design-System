export interface Testimonial {
  id: string;
  quote: string;
  attribution: string;
  role: string;
  building: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'AP Enterprises handles things the way the building always should have. The valet is at the door, the service is in the residence, and I never see the seam.',
    attribution: 'Eleanor Ashcombe',
    role: 'Resident · Member since 2024',
    building: 'The Arden',
  },
  {
    id: 't2',
    quote:
      'It replaced six vendor relationships, two clipboards, and a group chat. The board signed off in one meeting.',
    attribution: 'Daniel Park',
    role: 'Property Manager',
    building: 'One Beacon Tower',
  },
  {
    id: 't3',
    quote:
      'The standard is unmistakable. My residents stopped asking for things and started expecting them to be done.',
    attribution: 'Sofía Castellanos',
    role: 'General Manager',
    building: 'The Ashford',
  },
];
