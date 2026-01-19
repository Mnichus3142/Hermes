import { describe, expect, it } from "vitest"
import { Car } from "$lib/logic/car"
import { CarEnum } from "$lib/enums/carEnum"

describe('#Car Class', () => {
    it('Should create a Car instance and compute validity correctly', () => {
        const carData = {
            VIN: "1HGCM82633A123456",
            type: CarEnum.COMPACT,
            manufacturer: "Honda",
            model: "Accord",
            year: 2020,
            mileage: 15000,
            licensePlate: "ABC1234",
            // Future date
            insuranceValidUntil: new Date(new Date().getTime() + 1000000000), 
            // Past date
            technicalInspectionValidUntil: new Date(new Date().getTime() - 1000000000),
        };

        const car = new Car(carData);
        const carInfo = car.getCarInfo();
        expect(carInfo.car.insuranceValid).toBe(true);
        expect(carInfo.car.technicalInspectionValid).toBe(false);
    });
});