import { Alert as RNAlert, DeviceEventEmitter } from 'react-native';
import { SHOW_CUSTOM_ALERT } from '../components/CustomAlertModal';

export const setupCustomAlert = () => {
    RNAlert.alert = (
        title: string,
        message?: string,
        buttons?: any[],
        options?: any
    ) => {
        // If standard API is used, emit an event that the CustomAlertModal will catch
        DeviceEventEmitter.emit(SHOW_CUSTOM_ALERT, { title, message, buttons, options });
    };
};
