export type Car = {
    type: string;
    manufacturer: string;
    model: string;
    year: number;
    mileage: number;
    licensePlate: string;
    insuranceValidUntil: Date;
    technicalInspectionValidUntil: Date;
    insuranceValid: boolean | null;
    technicalInspectionValid: boolean | null;
};