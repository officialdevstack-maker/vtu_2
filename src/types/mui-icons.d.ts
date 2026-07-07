declare module "@mui/icons-material/*" {
  import type { OverridableComponent, SvgIconTypeMap } from "@mui/material";
  const Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
  export default Icon;
}

declare module "@mui/icons-material" {
  import type { OverridableComponent, SvgIconTypeMap } from "@mui/material";
  const Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
  export default Icon;
}
