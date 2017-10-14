FROM node:8.5

# Truffle dependencies
RUN apt-get -y update &&\
    apt-get -y upgrade &&\
    apt-get install build-essential -y

RUN mkdir -p /app
WORKDIR /app

ADD / .
RUN rm -fr node_modules
RUN npm install
