export type AgeGroup = 'child' | 'adult' | 'elderly';

export function getAgeGroup(age: number): AgeGroup {
  if (age < 12) {
    return 'child';
  } else if (age >= 12 && age < 60) {
    return 'adult';
  } else {
    return 'elderly';
  }
}
