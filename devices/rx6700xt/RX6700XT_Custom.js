export function Name() { return "RX 6700 XT Add-on"; }
export function Publisher() { return "Zitt"; }
export function Type() { return "SMBUS"; }
export function Size() { return [5, 2]; }
export function DefaultPosition() { return [150, 100]; }
export function DefaultScale() { return 10.0; }
export function LedNames() { return [["Logo"]]; }
export function LedPositions() { return [[2, 1]]; }

export function ControllableParameters() {
  return [
    {
      property: "forcedColor",
      group: "lighting",
      label: "Forced Color",
      type: "color",
      default: "#00ff00"
    },
    {
      property: "LightingMode",
      group: "lighting",
      label: "Lighting Mode",
      type: "combobox",
      values: ["Canvas", "Forced"],
      default: "Forced"
    }
  ];
}

let LightingMode;
let forcedColor;
let busRef;

const AMD_VENDOR_ID = 0x1002;
const GIGABYTE_VENDOR_ID = 0x1458;
const RX6700XT_DEVICE_ID = 0x73DF;
const ADDRESS = 0x50;

export function Scan(bus) {
  const vendor = bus.Vendor();
  const subVendor = bus.SubVendor();
  const device = bus.Product();
  const subDevice = bus.SubDevice ? bus.SubDevice() : "N/A";

  bus.log(`SMBUS scan: Vendor=0x${vendor.toString(16)}, SubVendor=0x${subVendor.toString(16)}, Device=0x${device.toString(16)}, SubDevice=0x${subDevice}`, { toFile: true });

  if (vendor !== AMD_VENDOR_ID || subVendor !== GIGABYTE_VENDOR_ID || device !== RX6700XT_DEVICE_ID) {
    bus.log("Device does not match Gigabyte RX 6700 XT", { toFile: true });
    return [];
  }

  bus.log("Matched Gigabyte RX 6700 XT, testing SMBus address 0x50", { toFile: true });

  bus.WriteBlockWithoutRegister(8, [0xAB]);
  const [status, data] = bus.ReadBlockWithoutRegister(4);

  bus.log(`Read response from 0x50: ${data}`, { toFile: true });

  if (data && data[0] === 0xAB) {
    bus.log("SMBUS test passed! Initializing device", { toFile: true });
    busRef = bus;
    return [ADDRESS];
  }

  bus.log("SMBUS test failed, device not responding", { toFile: true });
  return [];
}

export function Initialize() {
  device.setName("Gigabyte RX 6700 XT Add-on");
  device.setSize([5, 2]);
  device.setControllableLeds([["Logo"]], [[2, 1]]);
}

export function Render() {
  const rgb = LightingMode === "Forced" ? hexToRgb(forcedColor) : device.color(2, 1);
  applyColor(rgb);
  device.pause(10);
}

export function Shutdown() {
  applyColor([0, 0, 0]); // Turn off LED on shutdown
}

function applyColor(rgb) {
  if (!busRef) return;

  // Set static color mode
  busRef.WriteBlockWithoutRegister(8, [0x88, 0x01, 0x06, 0x63, 0x08, 0x01]);

  // Send RGB color data
  busRef.WriteBlockWithoutRegister(8, [0x40, rgb[0], rgb[1], rgb[2], 0x01]);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}
