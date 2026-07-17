/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette du projet (cohérente avec le CDC et la présentation)
        primaire: '#5B2C8D', // violet
        marine: '#1A237E'    // bleu marine
      }
    }
  },
  plugins: []
};
