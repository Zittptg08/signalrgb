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

export function Render() {
  const rgb = LightingMode === "Forced" ? hexToRgb(forcedColor) : device.color(2, 1);
  const packet = [0x40, rgb[0], rgb[1], rgb[2], 0x01];

  // Set static mode
  device.bus().WriteBlockWithoutRegister(8, [0x88, 0x01, 0x06, 0x63, 0x08, 0x01]);

  // Send color to LED
  device.bus().WriteBlockWithoutRegister(8, packet);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}
