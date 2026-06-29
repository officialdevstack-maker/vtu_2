import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#5558E3',
      dark: '#4346C8',
      light: '#7B7EF1',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F7F8FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#EEF2F6',
    success: { main: '#10B981', light: '#D1FAE5', contrastText: '#065F46' },
    warning: { main: '#F59E0B', light: '#FEF3C7', contrastText: '#78350F' },
    error:   { main: '#EF4444', light: '#FEE2E2', contrastText: '#7F1D1D' },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Nunito", "Inter", "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 500 },
    body2: { fontWeight: 500 },
    caption: { fontWeight: 500 },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #EEF2F6',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.875rem',
        },
        sizeLarge: {
          padding: '11px 24px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#DDE3ED',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A0A7B8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5558E3',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 4,
          fontSize: '0.7rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#F1F5F9', fontFamily: '"Nunito", sans-serif' },
        head: { fontWeight: 700, color: '#94A3B8', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#EEF2F6' } },
    },
    MuiListItemButton: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 700, fontFamily: '"Nunito", sans-serif' } },
    },
  },
});