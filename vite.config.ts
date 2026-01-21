import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Substitua 'repo-name' pelo nome do seu repositório no GitHub
  // Exemplo: se o repo for https://github.com/usuario/dashboard-chat, use '/dashboard-chat/'
  // Se for usar um domínio personalizado (ex: www.meudashboard.com), remova esta linha 'base'.
  base: './', 
})