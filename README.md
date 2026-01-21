# Payments Reminders - Dashboard

Dashboard analítico para visualização de eventos do chatbot Chatlayer.

## Pré-requisitos

- Node.js instalado (versão 18 ou superior recomendada).

## Instalação

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy e Configuração do GitHub

### 1. Configurar o Vite
Abra o arquivo `vite.config.ts` e altere a propriedade `base` para o nome do seu repositório:
```ts
base: '/nome-do-seu-repositorio/',
```

### 2. Solução de Problemas: Erro ao "Salvar" no GitHub

Se você está recebendo erros ao tentar fazer o commit ou push para o GitHub, é muito provável que a pasta `node_modules` tenha sido adicionada ao Git antes do arquivo `.gitignore` ser criado. Isso causa erros devido ao enorme número de arquivos.

**Para corrigir, execute os seguintes comandos no seu terminal, na ordem exata:**

1. **Remover tudo do "index" do Git (não apaga seus arquivos locais, apenas o rastreamento):**
   ```bash
   git rm -r --cached .
   ```

2. **Adicionar os arquivos novamente (agora respeitando o .gitignore):**
   ```bash
   git add .
   ```

3. **Confirmar que node_modules não está na lista:**
   Execute `git status`. Se você ver milhares de arquivos verdes, algo está errado. Você deve ver apenas seus arquivos de código (src, package.json, etc.).

4. **Fazer o commit:**
   ```bash
   git commit -m "Corrigindo rastreamento de arquivos"
   ```

5. **Renomear a branch para main (se ainda não estiver):**
   ```bash
   git branch -M main
   ```

6. **Adicionar o repositório remoto (caso não tenha feito):**
   *(Substitua USUARIO e REPOSITORIO pelos seus dados)*
   ```bash
   git remote add origin https://github.com/USUARIO/REPOSITORIO.git
   ```
   *Se der erro dizendo que 'origin already exists', ignore este passo.*

7. **Forçar o envio (CUIDADO: isso sobrescreve o histórico remoto se houver):**
   ```bash
   git push -u origin main --force
   ```

## Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (Gráficos)
- Alasql (Banco de dados em memória para filtros)

