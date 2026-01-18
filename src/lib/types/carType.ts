import { CarEnum } from "$lib/enums/carEnum";

export type CarType = {
    VIN: string;
    type: CarEnum;
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