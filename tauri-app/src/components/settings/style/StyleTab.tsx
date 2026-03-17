import { PositionGrid } from "./PositionGrid";
import { OrientationPicker } from "./OrientationPicker";
import { OpacitySlider } from "./OpacitySlider";
import { GraphTypePicker } from "./GraphTypePicker";
import { MonitorSelect } from "./MonitorSelect";

export function StyleTab() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <PositionGrid />
      <OrientationPicker />
      <OpacitySlider />
      <GraphTypePicker />
      <MonitorSelect />
    </div>
  );
}
