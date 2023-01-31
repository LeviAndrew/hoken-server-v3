FROM node:lts-alpine
WORKDIR /server
RUN npm install -g typescript@4.1.2
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 80
ENTRYPOINT [ "npm", "run" ]
CMD [ "dev" ]
