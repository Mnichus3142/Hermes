import type { CarType } from "../types/carType";
import { Car } from "./car";

class CarStore {
    private _cars: Car[] = $state([]);

    setCars(carsData: CarType[]) {
        this._cars = carsData.map(carData => new Car(carData));
    }

    addCar(carData: CarType) {
        const newCar = new Car(carData);
        this._cars.push(newCar);
    }

    updateCar(carData: CarType) {
        // Find stored car and update it
        const index = this._cars.findIndex(c => c.getCarInfo().car.VIN === carData.VIN);
        if (index !== -1) {
            this._cars[index] = new Car(carData);
        }
    }

    deleteCar(vin: string) {
        this._cars = this._cars.filter(c => c.getCarInfo().car.VIN !== vin);
    }

    updateMileage(vin: string, mileage: number) {
        const index = this._cars.findIndex(c => c.getCarInfo().car.VIN === vin);
        if (index !== -1) {
            const currentData = this._cars[index].getCarInfo().car;
            const updatedData = { ...currentData, mileage: mileage };
            this._cars[index] = new Car(updatedData);
        }
    }

    get cars() {
        return this._cars;
    }
}

export const carStore = new CarStore();