# FILE: Dockerfile (frontend)
FROM node:20

WORKDIR /app
COPY . .

ENV VITE_API_BASE_URL=http://dashboardkpidiarioapi.automacoesbeo.xyz

RUN npm install && npm run build

EXPOSE 1633
CMD ["npm", "run", "dev", "--", "--port", "1633", "--host", "0.0.0.0"]