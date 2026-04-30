export type notificationPayload = {
    title: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'warn';
    duration: number;
}