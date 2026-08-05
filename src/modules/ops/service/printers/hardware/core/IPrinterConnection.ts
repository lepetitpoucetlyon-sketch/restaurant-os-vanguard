/**
 * Core interface for Printer Connections (Grade X)
 * Ensures all connection methods (Bluetooth, USB, Network) expose the same contract.
 */
export interface IPrinterConnection {
    /**
     * Whether the connection is currently active
     */
    readonly isConnected: boolean;

    /**
     * Connects to the printer. May prompt the user for device selection.
     */
    connect(): Promise<void>;

    /**
     * Disconnects from the printer.
     */
    disconnect(): Promise<void>;

    /**
     * Writes raw bytes (ESC/POS bytecode) to the printer.
     * @param data The ESC/POS Uint8Array to send
     */
    write(data: Uint8Array): Promise<void>;
}
