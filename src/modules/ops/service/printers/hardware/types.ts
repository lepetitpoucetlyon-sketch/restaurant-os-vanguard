export type PrinterBrand =
  | 'epson'    // TM-T20, TM-T88, TM-T70, TM-m30
  | 'star'     // TSP100, TSP650, mPOP, SM-L200
  | 'bixolon'  // SPP-R, SRP series
  | 'citizen'  // CT-S series
  | 'generic'  // ESC/POS compatible

export type PrinterConnectionType =
  | 'network'    // WiFi / Ethernet TCP
  | 'bluetooth'  // BLE
  | 'usb'        // WebUSB
  | 'serial'     // Web Serial (RS-232)
  | 'browser'    // window.print() fallback

export type PrinterRole =
  | 'receipt'   // Ticket caisse client
  | 'kitchen'   // Bon cuisine
  | 'bar'       // Bon bar
  | 'label'     // Étiquettes

export type PaperWidth = 58 | 72 | 80

export interface NetworkConnection {
  type: 'network'
  ip: string
  port: number  // 9100 raw ESC/POS | 8008 Epson ePOS HTTP
  protocol: 'raw' | 'epos-http'
}

export interface BluetoothConnection {
  type: 'bluetooth'
  deviceId?: string
  deviceName?: string
}

export interface USBConnection {
  type: 'usb'
  vendorId?: number
  productId?: number
  deviceName?: string
}

export interface SerialConnection {
  type: 'serial'
  portLabel?: string
  baudRate: 9600 | 19200 | 38400 | 115200
}

export interface BrowserConnection {
  type: 'browser'
}

export type PrinterConnection =
  | NetworkConnection
  | BluetoothConnection
  | USBConnection
  | SerialConnection
  | BrowserConnection

export interface PrinterDevice {
  id: string
  name: string
  brand: PrinterBrand
  role: PrinterRole
  connection: PrinterConnection
  paperWidth: PaperWidth
  hasCutter: boolean
  enabled: boolean
  isDefault: boolean
}

export type TicketStyle = 'classic' | 'minimalist' | 'gourmet';

export interface BitmapImage {
  width: number;       // Largeur en pixels (multiple de 8 recommandé)
  height: number;      // Hauteur en pixels
  data: Uint8Array | number[]; // Pixels monochromes 1-bit (0 = blanc, 1 = noir)
}

export interface ReceiptConfig {
  ticketStyle?: TicketStyle;
  showLogo?: boolean;
  qrCodeType?: 'eticket' | 'google_review' | 'loyalty' | 'custom';
  qrCodeCustomUrl?: string;
  googleReviewUrl?: string;
  loyaltyUrl?: string;
  customFooterNote?: string;
}

export interface ReceiptTicket {
  items: Array<{ name: string; qty: number; priceInMicrounits: number }>
  totalInMicrounits: number
  tvaRatePercent: number
  ticketNumber: string
  businessName: string
  paymentMethod?: string
  cashGiven?: number      // microunits
  changeGiven?: number    // microunits
  footerNote?: string
  // Champs de style & branding
  ticketStyle?: TicketStyle
  logoBitmap?: BitmapImage
  qrCodeUrl?: string
  qrCodeLabel?: string
  // Champs NF525
  siret?: string
  nf525Hash?: string
  certifiedAt?: string
}

export interface KitchenTicket {
  orderId: string
  tableLabel: string
  items: Array<{ name: string; qty: number; modifiers?: string[]; course?: string }>
  serverName?: string
  timestamp: Date
  isVoid?: boolean
}

export type PrintJob =
  | { type: 'receipt'; ticket: ReceiptTicket }
  | { type: 'kitchen'; ticket: KitchenTicket }
  | { type: 'test' }

export interface PrintResult {
  success: boolean
  method: PrinterConnectionType | 'epos-http'
  error?: string
}

export const BRAND_LABELS: Record<PrinterBrand, string> = {
  epson: 'Epson',
  star: 'Star Micronics',
  bixolon: 'Bixolon',
  citizen: 'Citizen',
  generic: 'Generic ESC/POS',
}

export const ROLE_LABELS: Record<PrinterRole, string> = {
  receipt: 'Ticket caisse',
  kitchen: 'Bon cuisine',
  bar: 'Bon bar',
  label: 'Étiquettes',
}

export const CONNECTION_LABELS: Record<PrinterConnectionType, string> = {
  network: 'WiFi / Réseau',
  bluetooth: 'Bluetooth',
  usb: 'USB',
  serial: 'Série (RS-232)',
  browser: 'Navigateur (secours)',
}

// BLE GATT service UUIDs per brand
export const BLE_SERVICES: Record<string, string> = {
  epson:   '000018f0-0000-1000-8000-00805f9b34fb',
  star:    '00001101-0000-1000-8000-00805f9b34fb',
  generic: '000018f0-0000-1000-8000-00805f9b34fb',
}

export const BLE_CHARACTERISTICS: Record<string, string> = {
  epson:   '00002af1-0000-1000-8000-00805f9b34fb',
  star:    '00002af1-0000-1000-8000-00805f9b34fb',
  generic: '00002af1-0000-1000-8000-00805f9b34fb',
}
