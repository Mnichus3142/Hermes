import { writable } from 'svelte/store';

export type notificationPayload = {
    message: string;
    type: 'info' | 'error' | 'success';
}

export type notificationType = {
    color: string;
    icon: string;
}

export class Notification {
    private message: string;
    private notificationProperties: notificationType;

    private typeData = {
        'info' : ['bg-blue-500', ''],
        'error' : ['bg-red-500' , ''],
        'success': ['bg-green-500', '']
    };

    public id: number = 0;
    
    constructor (payload: notificationPayload, id: number) {
        this.message = payload.message;
        this.notificationProperties = {
            color: this.typeData[payload.type][0],
            icon: this.typeData[payload.type][1]
        }
        this.id = id;
    }

    public getMessage() {
        return this.message;
    }

    public getNotificationType() {
        return this.notificationProperties;
    }
}

export const notifications = writable<Notification[]>([]);

export const createNewNotification = (payload: notificationPayload) => {
    notifications.update(current => {
        const newNotif = new Notification(payload, current.length + 1);
        return [...current, newNotif];
    });
};