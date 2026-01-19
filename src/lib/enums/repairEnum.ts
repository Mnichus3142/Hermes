export const RepairCategories = [
    'ENGINE', 'SUSPENSION', 'BRAKES', 'TIRES', 'BODY', 
    'ELECTRONICS', 'INTERIOR', 'GLASS', 'FLUIDS', 'EXHAUST', 'OTHER'
] as const;

export type RepairCategory = typeof RepairCategories[number];
