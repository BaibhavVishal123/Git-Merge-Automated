# GIT MERGE API

## To start

```
git clone <REPO-URL> 
cd <FOLDER>
npm install
npm install pm2 -g
```


## Running standalone for testing

``` npm start ```

## Running prduction instance
### Setting up restart upon reboot
``` 
pm2 startup systemd
```

NOTE: "systemd" can be replaced by some other value depending on Machine OS. Ubuntu has systemd. Some other might have "upstart", etc.
Running the last command would give us output something like this

```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/home/ubuntu/.nvm/versions/node/v12.14.0/bin /home/ubuntu/.nvm/versions/node/v12.14.0/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Copy paste your respective output to terminal and then press enter.

## Starting Server

For a single forked out process.

``` 
pm2 start bin/www 
pm2 save
```

## Logs
``` pm2 logs ```
