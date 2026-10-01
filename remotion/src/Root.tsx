import { Composition } from "remotion";
import { Short, calculateShortMetadata } from "./Short";

// One composition renders any exported script: pass --props='{"slug":"cents_007_x"}'.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    width={1080}
    height={1920}
    fps={60}
    durationInFrames={60 * 30}
    defaultProps={{ slug: "cents_001_coffee" }}
    calculateMetadata={calculateShortMetadata}
  />
);
