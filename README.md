# termux-whatsapp-sticker-maker

Works in Windows, Linux, Mac and Termux(Android)

Requisites:

- NodeJS, FFMPEG and git(to clone this repository)

In action:
![screenshot](https://i.imgur.com/YAHG7GJ.png)

Features:

- Create sticker with photo, GIF or video using caption /sticker.

Install on Termux || Linux:

- Install dependecies

```
pkg update && pkg install git nodejs ffmpeg  -y
```

- Clone this repository

```
git clone https://github.com/jlucaso1/termux-whatsapp-sticker-maker
```

- Navigate to folder and install node dependencies

```
cd termux-whatsapp-sticker-maker
npm install
```

- Run the project

```
node index.js
Will be generated a QR CODE
```

Credits to [@adiwajshing](https://github.com/adiwajshing/) for the Whatsapp API.
