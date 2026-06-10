export type CarEnum =
    | "sedan"
    | "suv"
    | "truck"
    | "coupe"
    | "convertible"
    | "other";

export type CarType = {
    VIN: string;
    type: CarEnum;
    manufacturer: string;
    model: string;
    year: number;
    mileage: number;
    licensePlate: string;
    insuranceValidUntil: Date | null;
    technicalInspectionValidUntil: Date | null;
    insuranceValid?: boolean | null;
    technicalInspectionValid?: boolean | null;
    engineCapacity?: number;
    fuelType?: string;
    power?: number;
    torque?: number;
    transmissionType?: string;
    gears?: number;
};