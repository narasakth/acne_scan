/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0066CC',
                secondary: '#00A896',
                accent: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                'text-primary': '#1E293B',
                'text-secondary': '#64748B',
                'bg-main': '#F8FAFC',
                'border-color': '#E2E8F0',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
