import '@emotion/react';
import { Theme as MuiTheme } from '@mui/material/styles';

declare module '@emotion/react' {
  export interface Theme extends MuiTheme {}
}

// Add this to a file like 'src/theme.d.ts' or at the top of your 'sidebar.tsx'
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    // Add custom fields here if you have them
    breakpoint: {
      md:string
    }
  }
}

declare module 'lucide-react';