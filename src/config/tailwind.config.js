// AetherOS — Tailwind Runtime Theme Configuration
window.tailwind = window.tailwind || {};
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                        display: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        os: {
                            950: '#020203',
                            900: '#050507',
                            800: '#08080b',
                            700: '#0d0d11',
                            600: '#141418',
                            500: '#1e1e24',
                            400: '#28282f',
                            accent: '#5a5a65',
                            highlight: '#ffffff',
                        }
                    },
                    boxShadow: {
                        'os-panel': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 6px -1px rgba(0,0,0,0.4), 0 20px 50px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
                        'os-recessed': 'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.4)',
                        'os-btn': '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06)',
                        'os-dock': '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        'os-window': '0 0 0 1px rgba(255,255,255,0.07), 0 2px 4px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.6), 0 32px 80px rgba(0,0,0,0.4)',
                    }
                }
            }
        }
