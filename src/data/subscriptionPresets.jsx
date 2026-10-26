import React from "react";

export const SUBSCRIPTION_CATEGORIES = [
  "Streaming Vídeo",
  "Música & Áudio",
  "Tecnologia & IA",
  "Produtividade & Trabalho",
  "Nuvem & Armazenamento",
  "Jogos & Games",
  "Entregas & Compras",
  "Educação & Idiomas",
  "Telecom & Internet",
  "Outros"
];

export const PAYMENT_METHODS = [
  "Cartão de Crédito",
  "Cartão de Débito",
  "Pix Automático",
  "Débito em Conta",
  "Boleto",
  "PayPal",
  "Apple Pay",
  "Google Pay",
  "Outro"
];

export const BILLING_CYCLES = [
  { id: "monthly", label: "Mensal", multiplier: 1, text: "mês" },
  { id: "yearly", label: "Anual", multiplier: 1 / 12, text: "ano" },
  { id: "quarterly", label: "Trimestral", multiplier: 1 / 3, text: "trimestre" },
  { id: "semiannual", label: "Semestral", multiplier: 1 / 6, text: "semestre" },
  { id: "weekly", label: "Semanal", multiplier: 4.33, text: "semana" }
];

export const PRESET_SUBSCRIPTIONS = [
  {
    id: "netflix",
    name: "Netflix",
    category: "Streaming Vídeo",
    defaultPrice: 44.90,
    color: "#E50914",
    bgGradient: "linear-gradient(135deg, #141414 0%, #221F1F 100%)",
    glowColor: "rgba(229, 9, 20, 0.4)",
    borderColor: "rgba(229, 9, 20, 0.3)",
    description: "Filmes, séries e documentários ilimitados",
    suggestedPlans: [
      { name: "Padrão com anúncios", price: 20.90 },
      { name: "Padrão (1080p)", price: 44.90 },
      { name: "Premium (4K + HDR)", price: 59.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 111 150" fill="none">
        <path d="M0 0H28.4L64 89.6V0H92.4V150H64L28.4 60.4V150H0V0Z" fill="none" />
        <path d="M0 0H28.4V150H0V0Z" fill="#B1060F"/>
        <path d="M64 0H92.4V150H64V0Z" fill="#B1060F"/>
        <path d="M0 0H28.4L92.4 150H64L0 0Z" fill="#E50914"/>
      </svg>
    )
  },
  {
    id: "google-one",
    name: "Google One",
    category: "Nuvem & Armazenamento",
    defaultPrice: 9.99,
    color: "#4285F4",
    bgGradient: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    glowColor: "rgba(66, 133, 244, 0.4)",
    borderColor: "rgba(66, 133, 244, 0.3)",
    description: "Armazenamento Google Fotos, Drive e Gmail",
    suggestedPlans: [
      { name: "Básico 100 GB", price: 9.99 },
      { name: "Padrão 200 GB", price: 14.99 },
      { name: "Premium 2 TB", price: 38.99 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13.5 24 13.5c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.3 6.3 14.7z"/>
        <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.9 14.4-5.2l-6.7-5.5C29.6 36.8 26.9 37.5 24 37.5c-6 0-10.7-3.2-12.8-8.5l-6.6 5.1C8 41.3 15.4 46 24 46z"/>
        <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.5-2.4 4.7-4.5 6.2l6.7 5.5C41.8 36.6 44.5 30.9 44.5 24c0-1.3-.2-2.7-.5-4z"/>
      </svg>
    )
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "Música & Áudio",
    defaultPrice: 21.90,
    color: "#1DB954",
    bgGradient: "linear-gradient(135deg, #0f1c14 0%, #121212 100%)",
    glowColor: "rgba(29, 185, 84, 0.4)",
    borderColor: "rgba(29, 185, 84, 0.3)",
    description: "Músicas e podcasts sem anúncios",
    suggestedPlans: [
      { name: "Individual", price: 21.90 },
      { name: "Duo (2 contas)", price: 27.90 },
      { name: "Família (até 6 contas)", price: 34.90 },
      { name: "Universitário", price: 11.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 168 168">
        <circle cx="84" cy="84" r="84" fill="#1DB954"/>
        <path d="M123.6 120.3c-1.5 2.5-4.8 3.3-7.3 1.8-20-12.2-45.2-15-74.9-8.2-2.9.7-5.7-1.1-6.4-4-.7-2.9 1.1-5.7 4-6.4 32.5-7.4 60.3-4.3 82.8 9.5 2.5 1.5 3.3 4.8 1.8 7.3zm10-22.3c-1.9 3.1-6 4-9.1 2.2-22.9-14.1-57.8-18.2-84.9-9.9-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 31-9.4 69.5-4.9 95.7 11.3 3.1 1.9 4 6 2.2 9.1zm.9-23.2C107.1 58.4 61.8 56.9 36 64.7c-4.2 1.3-8.6-1.1-9.9-5.3-1.3-4.2 1.1-8.6 5.3-9.9 29.8-9 79.9-7.3 111.4 11.4 3.8 2.3 5 7.2 2.7 11-2.3 3.8-7.2 5-11 2.9z" fill="#000000"/>
      </svg>
    )
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium",
    category: "Streaming Vídeo",
    defaultPrice: 24.90,
    color: "#FF0000",
    bgGradient: "linear-gradient(135deg, #1f0b0b 0%, #141414 100%)",
    glowColor: "rgba(255, 0, 0, 0.4)",
    borderColor: "rgba(255, 0, 0, 0.3)",
    description: "Vídeos sem anúncios e YouTube Music incluído",
    suggestedPlans: [
      { name: "Individual", price: 24.90 },
      { name: "Família", price: 41.90 },
      { name: "Estudante", price: 13.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 90 64" fill="none">
        <path d="M88.1 9.9c-1-3.9-4.1-6.9-8-7.9C73.1 0 45 0 45 0S16.9 0 9.9 2C6 3 2.9 6 1.9 9.9 0 17 0 32 0 32s0 15 1.9 22.1c1 3.9 4.1 6.9 8 7.9 7 2 35.1 2 35.1 2s28.1 0 35.1-2c3.9-1 7-4 8-7.9C90 47 90 32 90 32s0-15-1.9-22.1z" fill="#FF0000"/>
        <path d="M36 45.7L59.4 32 36 18.3v27.4z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "amazon-prime",
    name: "Amazon Prime",
    category: "Entregas & Compras",
    defaultPrice: 19.90,
    color: "#00A8E1",
    bgGradient: "linear-gradient(135deg, #091b29 0%, #0d1117 100%)",
    glowColor: "rgba(0, 168, 225, 0.4)",
    borderColor: "rgba(0, 168, 225, 0.3)",
    description: "Frete grátis, Prime Video, Prime Music e ofertas",
    suggestedPlans: [
      { name: "Mensal", price: 19.90 },
      { name: "Anual (R$ 166,80)", price: 13.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#000000"/>
        <path d="M22 46.5C22 41 26 36.5 32 36.5c3.5 0 6 1.5 7.5 3.5V37h8.5v28H39.5V61c-1.5 2-4 3.5-7.5 3.5-6 0-10-4.5-10-10v-8zm8.5 7.5c0 3 2 5 5 5s5-2 5-5v-7c0-3-2-5-5-5s-5 2-5 5v7z" fill="#FFFFFF"/>
        <path d="M52 37h8.5v28H52V37z" fill="#FFFFFF"/>
        <path d="M18 73c18 8 42 8 62-2" stroke="#FF9900" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M78 66l6 6-7 4" fill="#FF9900"/>
      </svg>
    )
  },
  {
    id: "disney-plus",
    name: "Disney+",
    category: "Streaming Vídeo",
    defaultPrice: 43.90,
    color: "#113CCF",
    bgGradient: "linear-gradient(135deg, #081138 0%, #04081c 100%)",
    glowColor: "rgba(17, 60, 207, 0.4)",
    borderColor: "rgba(17, 60, 207, 0.3)",
    description: "Disney, Pixar, Marvel, Star Wars e ESPN",
    suggestedPlans: [
      { name: "Padrão com anúncios", price: 43.90 },
      { name: "Premium (com ESPN)", price: 62.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#04081c"/>
        <path d="M12 70C35 32 68 25 88 32" stroke="#113CCF" strokeWidth="6" strokeLinecap="round"/>
        <path d="M12 70C35 32 68 25 88 32" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round"/>
        <text x="32" y="66" fill="#FFFFFF" fontSize="38" fontWeight="900" fontFamily="sans-serif">D+</text>
      </svg>
    )
  },
  {
    id: "max",
    name: "Max (HBO)",
    category: "Streaming Vídeo",
    defaultPrice: 39.90,
    color: "#002BE7",
    bgGradient: "linear-gradient(135deg, #00125e 0%, #060919 100%)",
    glowColor: "rgba(0, 43, 231, 0.4)",
    borderColor: "rgba(0, 43, 231, 0.3)",
    description: "HBO, Warner Bros, DC, Discovery e Champions",
    suggestedPlans: [
      { name: "Básico com anúncios", price: 29.90 },
      { name: "Standard (Full HD)", price: 39.90 },
      { name: "Platinum (4K Ultra HD)", price: 55.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#002BE7"/>
        <text x="50" y="63" fill="#FFFFFF" fontSize="30" fontWeight="900" letterSpacing="-1" textAnchor="middle" fontFamily="sans-serif">MAX</text>
      </svg>
    )
  },
  {
    id: "apple-services",
    name: "Apple One / iCloud",
    category: "Nuvem & Armazenamento",
    defaultPrice: 42.90,
    color: "#A3A3A3",
    bgGradient: "linear-gradient(135deg, #1C1917 0%, #0C0A09 100%)",
    glowColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    description: "iCloud+, Apple Music, TV+, Arcade e Fitness",
    suggestedPlans: [
      { name: "iCloud+ 50 GB", price: 4.90 },
      { name: "iCloud+ 200 GB", price: 14.90 },
      { name: "Apple Music", price: 21.90 },
      { name: "Apple One Individual", price: 42.90 },
      { name: "Apple One Família", price: 54.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 170 170" fill="none">
        <rect width="170" height="170" rx="36" fill="#18181B"/>
        <path d="M125.7 93.6c-.2-21 17.1-31.1 17.9-31.6-9.8-14.3-25-16.2-30.4-16.5-12.9-1.3-25.3 7.6-31.9 7.6-6.5 0-16.7-7.4-27.4-7.2-14.1.2-27.2 8.2-34.4 20.8-14.7 25.5-3.8 63.3 10.5 83.9 7 10.1 15.3 21.4 26.2 21 10.5-.4 14.5-6.8 27.2-6.8 12.7 0 16.3 6.8 27.3 6.6 11.2-.2 18.3-10.2 25.2-20.3 8-11.7 11.3-23 11.5-23.6-.3-.1-22.1-8.5-22.3-33.5l.6-.4zM108.6 33.7c5.8-7 9.7-16.8 8.6-26.6-8.3.3-18.4 5.5-24.3 12.5-5.2 6-9.8 15.7-8.6 25.3 9.3.7 18.5-4.2 24.3-11.2z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    category: "Tecnologia & IA",
    defaultPrice: 115.00,
    color: "#10A37F",
    bgGradient: "linear-gradient(135deg, #09201a 0%, #0d1117 100%)",
    glowColor: "rgba(16, 163, 127, 0.4)",
    borderColor: "rgba(16, 163, 127, 0.3)",
    description: "Acesso antecipado a modelos avançados da OpenAI (GPT-4o)",
    suggestedPlans: [
      { name: "ChatGPT Plus (US$ 20)", price: 115.00 },
      { name: "ChatGPT Team", price: 150.00 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#10A37F"/>
        <path d="M80.4 44.5c-.8-6.1-5.2-11.1-11.3-12.7v-4.5c0-6.9-5-12.8-11.8-13.9-6-1-12 1.9-15 7.1-2.2-1.3-4.7-2-7.3-2-7.6 0-13.9 6-14.3 13.6-5.8 2-9.7 7.5-9.7 13.7 0 2.6.7 5.1 2 7.3-4.6 4.3-5.7 11.2-2.6 16.7 3.4 6.2 10.2 9.8 17.3 9v4.5c0 6.9 5 12.8 11.8 13.9 6 1 12-1.9 15-7.1 2.2 1.3 4.7 2 7.3 2 7.6 0 13.9-6 14.3-13.6 5.8-2 9.7-7.5 9.7-13.7 0-2.6-.7-5.1-2-7.3 4.5-4.4 5.6-11.3 2.5-16.9l-5.9 3.4zm-28 34.6c-4.4 0-8-3.6-8-8v-3.7l6.5 3.7c2.9 1.7 6.4 2 9.5.8-2.2 4.4-6.6 7.2-11.5 7.2h3.5zm20.8-12c-2.2 3.8-6.1 6.3-10.6 6.7l-4.5-2.6v-7.5l6.5-3.7c3.3-1.9 5.3-5.4 5.3-9.2 0-.3 0-.6-.1-.9 4.3 4 5.6 10.3 3.4 17.2zm-2.7-23.7l-6.5 3.8-6.5-3.8V36c0-3.8 2-7.3 5.3-9.2 3.8-2.2 8.6-1.5 11.6 1.7 3 3.3 3.6 8.2 1.4 12.1l-5.3 3.1zM52.4 46.9l-6.5-3.8 6.5-3.8 6.5 3.8-6.5 3.8zm-16-17.6c2.2-3.8 6.1-6.3 10.6-6.7l4.5 2.6V33l-6.5 3.7c-3.3 1.9-5.3 5.4-5.3 9.2 0 .3 0 .6.1.9-4.3-4.1-5.6-10.4-3.4-17.5zm-5 27.2l6.5-3.8 6.5 3.8V64c0 3.8-2 7.3-5.3 9.2-3.8 2.2-8.6 1.5-11.6-1.7-3-3.3-3.6-8.2-1.4-12.1l5.3-2.9zm16.5 12.6l-6.5-3.7V58l6.5-3.7 6.5 3.7v7.5l-6.5 3.6z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    category: "Produtividade & Trabalho",
    defaultPrice: 36.00,
    color: "#00A4EF",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    glowColor: "rgba(0, 164, 239, 0.4)",
    borderColor: "rgba(0, 164, 239, 0.3)",
    description: "Word, Excel, PowerPoint e 1 TB de OneDrive",
    suggestedPlans: [
      { name: "Personal (1 pessoa)", price: 36.00 },
      { name: "Family (até 6 pessoas)", price: 45.00 },
      { name: "Personal Anual (R$ 359)", price: 29.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#18181B"/>
        <rect x="22" y="22" width="26" height="26" rx="3" fill="#F25022"/>
        <rect x="52" y="22" width="26" height="26" rx="3" fill="#7FBA00"/>
        <rect x="22" y="52" width="26" height="26" rx="3" fill="#00A4EF"/>
        <rect x="52" y="52" width="26" height="26" rx="3" fill="#FFB900"/>
      </svg>
    )
  },
  {
    id: "canva-pro",
    name: "Canva Pro",
    category: "Produtividade & Trabalho",
    defaultPrice: 34.90,
    color: "#00C4CC",
    bgGradient: "linear-gradient(135deg, #062b33 0%, #081a24 100%)",
    glowColor: "rgba(0, 196, 204, 0.4)",
    borderColor: "rgba(0, 196, 204, 0.3)",
    description: "Design ilimitado, remoção de fundo e IA",
    suggestedPlans: [
      { name: "Pro Individual", price: 34.90 },
      { name: "Equipes (5 pessoas)", price: 54.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="48" fill="url(#canvaGrad)"/>
        <defs>
          <linearGradient id="canvaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C4CC"/>
            <stop offset="50%" stopColor="#7D2AE8"/>
            <stop offset="100%" stopColor="#FF4F93"/>
          </linearGradient>
        </defs>
        <path d="M68 36c-2.4-3.5-7.6-5-13.8-4-10.8 1.8-19.7 11.4-20.9 22.8-.8 7.3 2.7 13 8.8 14.2 6.5 1.3 13.5-2.2 18-9 2-3 3-6.5 3-7.5s-.8-1-2-.5c-3 1.2-6.5 2-9.5 1.2-4.2-1-6.2-4.5-5.5-10.2.8-6.2 5.2-11.8 10.8-13 4-.9 7.2.2 8.8 2.5 1.2 1.8 2.5 2 3.3.5.5-.8-.2-2.3-1-3.5z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "ifood-clube",
    name: "iFood Clube",
    category: "Entregas & Compras",
    defaultPrice: 9.95,
    color: "#EA1D2C",
    bgGradient: "linear-gradient(135deg, #2b0b0e 0%, #17090b 100%)",
    glowColor: "rgba(234, 29, 44, 0.4)",
    borderColor: "rgba(234, 29, 44, 0.3)",
    description: "Cupons de desconto e entrega grátis todo mês",
    suggestedPlans: [
      { name: "Clube 5 Cupons", price: 4.95 },
      { name: "Clube 10 Cupons", price: 9.95 },
      { name: "Clube 20 Cupons", price: 19.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#EA1D2C"/>
        <circle cx="34" cy="40" r="7" fill="#FFFFFF"/>
        <circle cx="66" cy="40" r="7" fill="#FFFFFF"/>
        <path d="M25 56c12 18 38 18 50 0" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "meli-plus",
    name: "Meli+ (Mercado Livre)",
    category: "Entregas & Compras",
    defaultPrice: 17.99,
    color: "#FFE600",
    bgGradient: "linear-gradient(135deg, #1c1a05 0%, #111424 100%)",
    glowColor: "rgba(255, 230, 0, 0.35)",
    borderColor: "rgba(255, 230, 0, 0.25)",
    description: "Frete grátis, Disney+ padrão e Deezer incluídos",
    suggestedPlans: [
      { name: "Meli+ Mensal", price: 17.99 },
      { name: "Meli+ com Disney+", price: 27.99 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#FFE600"/>
        <path d="M26 44c4-7 13-10 20-6l4 2 4-2c7-4 16-1 20 6 3 5 2 11-2 15L50 80 28 59c-4-4-5-10-2-15z" fill="#2D3277"/>
      </svg>
    )
  },
  {
    id: "playstation-plus",
    name: "PlayStation Plus",
    category: "Jogos & Games",
    defaultPrice: 34.90,
    color: "#003791",
    bgGradient: "linear-gradient(135deg, #001f52 0%, #070d1e 100%)",
    glowColor: "rgba(0, 55, 145, 0.4)",
    borderColor: "rgba(0, 55, 145, 0.3)",
    description: "Jogos mensais, multiplayer online e catálogo",
    suggestedPlans: [
      { name: "Essential Mensal", price: 34.90 },
      { name: "Extra Mensal", price: 52.90 },
      { name: "Deluxe Mensal", price: 59.90 },
      { name: "Essential Anual (R$ 278)", price: 23.20 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#003791"/>
        <path d="M26 50h48M50 26v48" stroke="#FFE600" strokeWidth="12" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: "xbox-game-pass",
    name: "Xbox Game Pass",
    category: "Jogos & Games",
    defaultPrice: 35.99,
    color: "#107C10",
    bgGradient: "linear-gradient(135deg, #092609 0%, #0d170d 100%)",
    glowColor: "rgba(16, 124, 16, 0.4)",
    borderColor: "rgba(16, 124, 16, 0.3)",
    description: "Centenas de jogos no PC, console e Cloud Gaming",
    suggestedPlans: [
      { name: "Core", price: 34.99 },
      { name: "PC Game Pass", price: 35.99 },
      { name: "Ultimate (Cloud + PC)", price: 59.99 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#107C10"/>
        <circle cx="50" cy="50" r="32" stroke="#FFFFFF" strokeWidth="6" fill="none"/>
        <path d="M30 34c11 11 20 23 20 32 0-9 9-21 20-32-6-7-14-11-20-11s-14 4-20 11z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "deezer",
    name: "Deezer",
    category: "Música & Áudio",
    defaultPrice: 22.90,
    color: "#A238FF",
    bgGradient: "linear-gradient(135deg, #240b3b 0%, #12091c 100%)",
    glowColor: "rgba(162, 56, 255, 0.4)",
    borderColor: "rgba(162, 56, 255, 0.3)",
    description: "Música em áudio HiFi sem perdas",
    suggestedPlans: [
      { name: "Premium", price: 22.90 },
      { name: "Família (6 contas)", price: 35.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#A238FF"/>
        <rect x="22" y="58" width="10" height="16" rx="3" fill="#FFFFFF"/>
        <rect x="36" y="44" width="10" height="30" rx="3" fill="#FFFFFF"/>
        <rect x="50" y="30" width="10" height="44" rx="3" fill="#FFFFFF"/>
        <rect x="64" y="48" width="10" height="26" rx="3" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "duolingo-super",
    name: "Duolingo Super",
    category: "Educação & Idiomas",
    defaultPrice: 29.90,
    color: "#58CC02",
    bgGradient: "linear-gradient(135deg, #102904 0%, #0a1705 100%)",
    glowColor: "rgba(88, 204, 2, 0.4)",
    borderColor: "rgba(88, 204, 2, 0.3)",
    description: "Vidas infinitas e sem anúncios no aprendizado",
    suggestedPlans: [
      { name: "Super Individual", price: 29.90 },
      { name: "Super Família", price: 44.90 },
      { name: "Anual (R$ 179,90)", price: 14.99 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#58CC02"/>
        <circle cx="37" cy="46" r="14" fill="#FFFFFF"/>
        <circle cx="63" cy="46" r="14" fill="#FFFFFF"/>
        <circle cx="37" cy="46" r="7" fill="#18181B"/>
        <circle cx="63" cy="46" r="7" fill="#18181B"/>
        <path d="M44 58h12l-6 8z" fill="#FF9600"/>
      </svg>
    )
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    category: "Tecnologia & IA",
    defaultPrice: 58.00,
    color: "#8B5CF6",
    bgGradient: "linear-gradient(135deg, #19122e 0%, #0d0a17 100%)",
    glowColor: "rgba(139, 92, 246, 0.4)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    description: "Assistente de código e autocompletion por IA",
    suggestedPlans: [
      { name: "Copilot Individual (US$ 10)", price: 58.00 },
      { name: "Copilot Business", price: 110.00 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#24292F"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M50 20C33.4 20 20 33.4 20 50c0 13.3 8.6 24.5 20.6 28.5 1.5.3 2-.7 2-1.5v-5.2c-8.3 1.8-10.1-4-10.1-4-1.4-3.5-3.3-4.4-3.3-4.4-2.7-1.9.2-1.8.2-1.8 3 .2 4.6 3.1 4.6 3.1 2.7 4.6 7 3.3 8.7 2.5.3-2 1.1-3.3 2-4-6.7-.8-13.7-3.3-13.7-14.8 0-3.3 1.2-6 3.1-8.1-.3-.8-1.3-3.8.3-8 0 0 2.5-.8 8.2 3.1 2.4-.7 5-1 7.5-1s5.1.3 7.5 1c5.7-3.9 8.2-3.1 8.2-3.1 1.7 4.2.6 7.2.3 8 2 2.1 3.1 4.8 3.1 8.1 0 11.6-7 14-13.7 14.8 1.1 1 2.1 2.8 2.1 5.7v8.5c0 .8.6 1.8 2.1 1.5C71.4 74.5 80 63.3 80 50c0-16.6-13.4-30-30-30z" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "notion-plus",
    name: "Notion Plus",
    category: "Produtividade & Trabalho",
    defaultPrice: 58.00,
    color: "#FFFFFF",
    bgGradient: "linear-gradient(135deg, #18181B 0%, #09090B 100%)",
    glowColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    description: "Workspace conectado para notas, docs e projetos",
    suggestedPlans: [
      { name: "Notion Plus (US$ 10)", price: 58.00 },
      { name: "Notion Plus + IA", price: 110.00 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#000000"/>
        <text x="50" y="70" fill="#FFFFFF" fontSize="64" fontWeight="800" textAnchor="middle" fontFamily="serif">N</text>
      </svg>
    )
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    category: "Streaming Vídeo",
    defaultPrice: 19.99,
    color: "#F47521",
    bgGradient: "linear-gradient(135deg, #2b1404 0%, #170d06 100%)",
    glowColor: "rgba(244, 117, 33, 0.4)",
    borderColor: "rgba(244, 117, 33, 0.3)",
    description: "O maior catálogo de animes do mundo",
    suggestedPlans: [
      { name: "Fan", price: 19.99 },
      { name: "Mega Fan", price: 24.99 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#F47521"/>
        <circle cx="50" cy="50" r="28" fill="#FFFFFF"/>
        <circle cx="58" cy="50" r="20" fill="#F47521"/>
        <circle cx="58" cy="50" r="9" fill="#FFFFFF"/>
      </svg>
    )
  },
  {
    id: "telecom-internet",
    name: "Internet Fibra / Celular",
    category: "Telecom & Internet",
    defaultPrice: 99.90,
    color: "#06B6D4",
    bgGradient: "linear-gradient(135deg, #082f49 0%, #031726 100%)",
    glowColor: "rgba(6, 182, 212, 0.4)",
    borderColor: "rgba(6, 182, 212, 0.3)",
    description: "Plano de banda larga, fibra óptica ou celular",
    suggestedPlans: [
      { name: "Plano Controle Celular", price: 54.90 },
      { name: "Internet Fibra 300 Mega", price: 99.90 },
      { name: "Internet Fibra 600 Mega", price: 129.90 }
    ],
    renderLogo: ({ size = 32 }) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#0284C7"/>
        <path d="M22 68a42 42 0 0 1 56 0M32 74a28 28 0 0 1 36 0M42 80a14 14 0 0 1 16 0" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="50" cy="85" r="4" fill="#FFFFFF"/>
      </svg>
    )
  }
];

export const getPresetById = (id) => {
  return PRESET_SUBSCRIPTIONS.find((p) => p.id === id);
};

export const renderSubscriptionIcon = (sub, size = 32) => {
  if (sub.preset_id) {
    const preset = getPresetById(sub.preset_id);
    if (preset) return preset.renderLogo({ size });
  }

  // Fallback / Custom icon
  const initial = (sub.name || "A").charAt(0).toUpperCase();
  const color = sub.color || "#8B5CF6";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? "14px" : "10px",
        background: `linear-gradient(135deg, ${color}, #4C1D95)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFFFFF",
        fontWeight: 800,
        fontSize: size * 0.46,
        boxShadow: `0 4px 12px ${color}40`,
        border: "1px solid rgba(255,255,255,0.2)"
      }}
    >
      {initial}
    </div>
  );
};
