import { IPrinterConnection } from '../core/IPrinterConnection';

interface BluetoothPrinterConfig {
    /** 
     * UUID of the GATT Service used for printing. 
     * If omitted, a generic BLE printer service is tried, but it's highly recommended to configure it per brand.
     */
    serviceUuid?: string;
    /** 
     * UUID of the GATT Characteristic used for writing data.
     */
    characteristicUuid?: string;
}

/**
 * WebBluetooth Adapter for Thermal Printers (Grade X)
 * Uses native navigator.bluetooth to connect to BLE printers without any external drivers.
 */
export class BluetoothPrinterAdapter implements IPrinterConnection {
    private device: BluetoothDevice | null = null;
    private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    
    // Default UUIDs often used by generic BLE printers (e.g., standard BLE serial profile).
    // In production, these should be dynamically injected based on the printer model selected by the user.
    private readonly defaultServiceUuid = '000018f0-0000-1000-8000-00805f9b34fb';
    private readonly defaultCharUuid = '00002af1-0000-1000-8000-00805f9b34fb';

    private config: BluetoothPrinterConfig;

    constructor(config: BluetoothPrinterConfig = {}) {
        this.config = config;
    }

    public get isConnected(): boolean {
        return !!this.device?.gatt?.connected && !!this.writeCharacteristic;
    }

    public async connect(): Promise<void> {
        if (!navigator.bluetooth) {
            throw new Error("WebBluetooth API is not supported in this browser. Please use Chrome/Edge or a supported mobile browser.");
        }

        try {
            const serviceUuid = this.config.serviceUuid || this.defaultServiceUuid;
            
            // 1. Request device (prompts user)
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [serviceUuid] }],
                optionalServices: [serviceUuid]
            });

            if (!this.device.gatt) {
                throw new Error("Bluetooth device does not support GATT.");
            }

            // 2. Connect to GATT server
            const server = await this.device.gatt.connect();

            // 3. Get the printing service
            const service = await server.getPrimaryService(serviceUuid);

            // 4. Get the write characteristic
            const charUuid = this.config.characteristicUuid || this.defaultCharUuid;
            this.writeCharacteristic = await service.getCharacteristic(charUuid);

        } catch (error) {
            this.device = null;
            this.writeCharacteristic = null;
            console.error("Bluetooth connection failed:", error);
            throw new Error(`Failed to connect to Bluetooth printer: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.writeCharacteristic = null;
    }

    public async write(data: Uint8Array): Promise<void> {
        if (!this.isConnected || !this.writeCharacteristic) {
            throw new Error("Cannot write to printer: Device is not connected.");
        }

        // WebBluetooth characteristic writes have an MTU limit (often 20 or 512 bytes).
        // For thermal printers, especially with images/QR, we chunk the data.
        const CHUNK_SIZE = 512; 
        
        try {
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                // Prefer writeValueWithoutResponse for speed if available, otherwise writeValue
                if (this.writeCharacteristic.writeValueWithoutResponse) {
                    await this.writeCharacteristic.writeValueWithoutResponse(chunk);
                } else {
                    await this.writeCharacteristic.writeValue(chunk);
                }
            }
        } catch (error) {
            console.error("Failed to write to Bluetooth printer:", error);
            throw new Error(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
