import { Alert as RNAlert, DeviceEventEmitter } from 'react-native';
import { SHOW_CUSTOM_ALERT } from '../components/CustomAlertModal';

export const setupCustomAlert = () => {
    RNAlert.alert = (
        title: string,
        message?: string,
        buttons?: any[],
        options?: any
    ) => {
        // Intercept native Alert and trigger our custom modal
        DeviceEventEmitter.emit(SHOW_CUSTOM_ALERT, { title, message, buttons, options });
    };
};
