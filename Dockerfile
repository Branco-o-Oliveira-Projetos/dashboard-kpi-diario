FROM node:20

WORKDIR /app

# Copie apenas os arquivos de dependências primeiro
COPY package*.json ./

# Instale as dependências
RUN npm install && npm install vite --save-dev

# Copie o restante do código
COPY . .

# Adicione o diretório node_modules/.bin ao PATH
ENV PATH="./node_modules/.bin:$PATH"

ENV VITE_API_BASE_URL=https://dashboardkpidiarioapi.automacoesbeo.xyz

# Corrija as permissões dos binários no node_modules/.bin
RUN chmod -R +x ./node_modules/.bin

# Construa o projeto
RUN npm run build

EXPOSE 1633
CMD ["npm", "preview"]