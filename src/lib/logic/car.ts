import { CarType } from "../enums/type.js";
import type { Car as CarTypeDef } from "../types/car.js";

export class Car {
    private car: CarTypeDef;

    constructor(
        car : CarTypeDef
    ) {
        this.car = car;
        this.car.insuranceValid = car.insuranceValidUntil > new Date();
        this.car.technicalInspectionValid = car.technicalInspectionValidUntil > new Date();
    }

    getCarInfo() {
        return {
            car: this.car
        };
    }
}