How to deploy the application, commands based on  ubuntu 16.04:

Install npm + nodejs

sudo apt-get install npm

sudo npm install -g npm

sudo npm install -g n

sudo n stable

sudo npm install -g gulp

Install mongoDb

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

sudo apt-get update

sudo apt-get install -y mongodb-org

Edit the mongodb systemd settings - sudo nano /etc/systemd/system/mongodb.service

sudo systemctl start mongodb

Install ruby compass dependency

sudo apt-get install ruby-compass

Run gulp default task, to build static files

gulp

Use pm2 to maintain app online all the time, and enforce auto restart on crash

npm install -g pm2

pm2 start app.js

Application now runing on port 8006

