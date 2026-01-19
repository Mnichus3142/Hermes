import { describe, expect, it } from "vitest"
import type { CarType } from "../lib/types/carType"
import { CarEnum } from "$lib/enums/carEnum";

describe('#checkCarType', () => {
    it('Should define the car type correctly', () => {
        const carExample: CarType = {
            VIN: "1HGCM82633A123456",
            type: CarEnum.COMPACT,
            manufacturer: "Honda",
            model: "Accord",
            year: 2020,
            mileage: 15000,
            licensePlate: "ABC1234",
            insuranceValidUntil: new Date("2024-12-31"),
            technicalInspectionValidUntil: new Date("2024-11-30"),
            insuranceValid: true,
            technicalInspectionValid: true
        };
        expect(carExample.VIN).toBe("1HGCM82633A123456");
        expect(carExample.type).toBe(CarEnum.COMPACT);
        expect(carExample.manufacturer).toBe("Honda");
        expect(carExample.model).toBe("Accord");
        expect(carExample.year).toBe(2020);
        expect(carExample.mileage).toBe(15000);
        expect(carExample.licensePlate).toBe("ABC1234");
        expect(carExample.insuranceValidUntil).toEqual(new Date("2024-12-31"));
        expect(carExample.technicalInspectionValidUntil).toEqual(new Date("2024-11-30"));
        expect(carExample.insuranceValid).toBe(true);
        expect(carExample.technicalInspectionValid).toBe(true);
    }
    )
})