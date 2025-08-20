FROM node:20

WORKDIR /app
COPY . .

ENV VITE_API_BASE_URL=https://dashboardkpidiarioapi.automacoesbeo.xyz

RUN npm install
RUN npm run build

EXPOSE 1633
CMD ["npm", "preview"]