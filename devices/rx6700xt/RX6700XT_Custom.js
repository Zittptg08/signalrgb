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
let addrRef;

export function Scan(bus) {
  const vendor = bus.Vendor();
  const subVendor = bus.SubVendor();
  const device = bus.Product();
  const subDevice = bus.SubDevice ? bus.SubDevice() : 0;

  bus.log(`🔍 SMBUS SCAN on BUS: Vendor=0x${vendor.toString(16)}, SubVendor=0x${subVendor.toString(16)}, Device=0x${device.toString(16)}, SubDevice=0x${subDevice.toString(16)}`, { toFile: true });

  for (let addr = 0x30; addr <= 0x7F; addr++) {
    try {
      bus.log(`⏳ Testing address: 0x${addr.toString(16)}`, { toFile: true });

      bus.WriteBlockWithoutRegister(8, [0xAB]);
      const [status, data] = bus.ReadBlockWithoutRegister(4);

      if (data && data[0] === 0xAB) {
        bus.log(`✅ MATCH FOUND at 0x${addr.toString(16)}!`, { toFile: true });
        busRef = bus;
        addrRef = addr;
        return [addr];
      }
    } catch (e) {
      bus.log(`❌ Error at 0x${addr.toString(16)}: ${e}`, { toFile: true });
    }
  }

  bus.log("❗ No SMBUS device responded correctly.", { toFile: true });
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
  applyColor([0, 0, 0]);
}

function applyColor(rgb) {
  if (!busRef || addrRef === undefined) return;

  // Set static color mode
  busRef.WriteBlockWithoutRegister(8, [0x88, 0x01, 0x06, 0x63, 0x08, 0x01]);

  // Send RGB packet to LED
  busRef.WriteBlockWithoutRegister(8, [0x40, rgb[0], rgb[1], rgb[2], 0x01]);
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [255,255,255];
}
