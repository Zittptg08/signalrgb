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
const ADDRESS = 0x50; // SMBus I2C address

export function Scan(bus) {
  if (bus.Vendor() !== AMD_VENDOR_ID) return [];
  if (bus.SubVendor() !== GIGABYTE_VENDOR_ID) return [];
  if (bus.Product() !== RX6700XT_DEVICE_ID) return [];

  // Nếu cần kiểm tra thêm SubDevice ID, bỏ comment dòng dưới
  // if (bus.SubDevice() !== 0x40E1) return [];

  bus.log("Checking RX 6700 XT on SMBus...", { toFile: true });

  // Gửi gói test
  bus.WriteBlockWithoutRegister(8, [0xAB]);
  const [status, data] = bus.ReadBlockWithoutRegister(4);

  if (data && data[0] === 0xAB) {
    bus.log("RX 6700 XT matched and passed test", { toFile: true });
    busRef = bus;
    return [ADDRESS];
  }

  return [];
}

export function Initialize() {
  device.setName("RX 6700 XT Add-on");
  device.setSize([5, 2]);
  device.setControllableLeds([["Logo"]], [[2, 1]]);
}

export function Render() {
  const rgb = LightingMode === "Forced" ? hexToRgb(forcedColor) : device.color(2, 1);
  applyColor(rgb);
  device.pause(10);
}

export function Shutdown() {
  applyColor([0, 0, 0]); // Tắt LED khi shutdown
}

function applyColor(rgb) {
  if (!busRef) return;

  // Static mode command
  busRef.WriteBlockWithoutRegister(8, [0x88, 0x01, 0x06, 0x63, 0x08, 0x01]);

  // Send RGB packet
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

