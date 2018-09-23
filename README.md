# homebridge-insteon-blinds

`homebridge-insteon-blinds` is a plugin for Homebridge.

Control your `http`-based insteon blinds via Homebridge!

The difference from the original fork is that in this version is checked the buffer in insteon hub and retrieve the current position of the instoen blinds (micromodule open/Close)

## Installation

If you are new to Homebridge, please first read the Homebridge [documentation](https://www.npmjs.com/package/homebridge).
If you are running on a Raspberry, you will find a tutorial in the [homebridge-punt Wiki](https://github.com/cflurin/homebridge-punt/wiki/Running-Homebridge-on-a-Raspberry-Pi).

Install homebridge:
```sh
sudo npm install -g homebridge
```
Install homebridge-blinds:
```sh
sudo npm install -g homebridge--insteon-blinds
```

## Configuration

Add the accessory in `config.json` in your home directory inside `.homebridge`.

```js
    {
      "accessory": "BlindsHTTP",
      "name": "Window",
      "up_url": "http://1.2.3.4/window/up",
      "down_url": "http://1.2.3.4/window/down",
      "stop_url": "http://1.2.3.4/window/stop",
      "last_url":"1.2.3.4:25105/3?0262XXXXXX0F1900=I=3",
      "motion_time": "<time your blind needs to move from up to down (in milliseconds)>",
      "http_method": "PUT",
      "trigger_stop_at_boundaries": false
    }
```
last_url is the request to the hub insteon that is writing in the buffstatus the currentposition.(is correct without the http)
inside the index.js you need to change at row 170 and 172 the user and password for your insteon hub.


You can omit `http_method`, it defaults to `POST`.

`trigger_stop_at_boundaries` allows you to choose if a stop command should be fired or not when moving the blinds to position 0 or 100.  Most blinds dont require this command and will stop by themself, for such blinds it is advised to set this to `false`.

## Note
Currently the plugin only emulates the position (it saves it in a variable), because my blinds only support
up and down via urls.

Feel free to contribute to make this a better plugin!
