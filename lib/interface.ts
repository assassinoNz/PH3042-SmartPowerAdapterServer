export interface InboundFirmwareEvent {
    deviceId: string;
    event: string;
}

export interface OutboundFirmwareEvent {
    event: string;

    state?: boolean;
}