import { Box, Typography, Stack } from '@mui/material';

interface Network {
  id: string;
  label: string;
  logo: string;
  border: string;
  bg: string;
}

const NETWORKS: Network[] = [
  {
    id: 'mtn',
    label: 'MTN',
    logo: '/networks/mtn.jpg',
    border: '#F5A623',
    bg: '#FFFDF5',
  },
  {
    id: 'airtel',
    label: 'Airtel',
    logo: '/networks/airtel.svg',
    border: '#E8001C',
    bg: '#FFF5F6',
  },
  {
    id: 'glo',
    label: 'Glo',
    logo: '/networks/glo.png',
    border: '#28A745',
    bg: '#F4FFF7',
  },
  {
    id: '9mobile',
    label: '9mobile',
    logo: '/networks/9mobile.png',
    border: '#1A3E2A',
    bg: '#F2F8F5',
  },
];

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

export default function NetworkSelector({ selected, onChange }: Props) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block', letterSpacing: 0.3 }}>
        Select Network Provider
      </Typography>
      <Stack direction="row" spacing={1.5}>
        {NETWORKS.map(({ id, label, logo, border, bg }) => {
          const active = selected === id;
          return (
            <Box
              key={id}
              onClick={() => onChange(id)}
              sx={{
                flex: 1,
                border: '2px solid',
                borderColor: active ? border : 'grey.200',
                borderRadius: 2.5,
                bgcolor: active ? bg : 'background.paper',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 2,
                gap: 1,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: border,
                  bgcolor: bg,
                },
              }}
            >
              <Box
                component="img"
                src={logo}
                alt={label}
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: 'contain',
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'grey.100',
                }}
              />
              <Typography variant="caption" fontWeight={active ? 700 : 500} color={active ? 'text.primary' : 'text.secondary'}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
