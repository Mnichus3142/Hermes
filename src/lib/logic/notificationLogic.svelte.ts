import { writable } from 'svelte/store';

export type notificationPayload = {
    title: string;
    message: string;
    type: 'info' | 'error' | 'success';
    duration: number;
}

export type notificationType = {
    color: string;
    icon: string;
}

export class Notification {
    private title: string;
    private message: string;
    private notificationProperties: notificationType;
    private duration: number;

    private typeData = {
        'info' : ['bg-blue-500', ''],
        'error' : ['bg-red-500' , ''],
        'success': ['bg-green-500', '']
    };

    public id: number = 0;
    
    constructor (payload: notificationPayload, id: number) {
        this.title = payload.title;
        this.message = payload.message;
        this.notificationProperties = {
            color: this.typeData[payload.type][0],
            icon: this.typeData[payload.type][1]
        }
        this.id = id;
        this.duration = payload.duration;
    }

    public getTitle() {
        return this.title;
    }

    public getMessage() {
        return this.message;
    }

    public getNotificationType() {
        return this.notificationProperties;
    }

    public getDuration() {
        return this.duration;
    }

    public getNotificationProperties() {
        return this.notificationProperties;
    }

    public closeNotification() {
        removeNotification(this.id);
    }
}

const MAX_NOTIFICATIONS = 3;

export const notifications = writable<Notification[]>([]);

export const removeNotification = (id: number) => {
    notifications.update(current => {
        const filteredNotifications = current.filter(notif => notif.id !== id);
        
        return filteredNotifications.map((notif, index) => {
            notif.id = index + 1;
            return notif;
        });
    });
};

export const createNewNotification = (payload: notificationPayload) => {
    notifications.update(current => {
        const newNotif = new Notification(payload, current.length + 1);

        let updatedNotifications = [...current];
        if (updatedNotifications.length >= MAX_NOTIFICATIONS) {
            updatedNotifications.shift();
        }

        updatedNotifications = [...updatedNotifications, newNotif];

        if (payload.duration !== 0) {
            setTimeout(() => {
                removeNotification(newNotif.id);
            }, newNotif.getDuration());
        }

        return updatedNotifications;
    });
};