# sharex-uploader
A ShareX image/text/file custom uploader written with [Bun](https://bun.com/) in Javascript!

## How to run
1. Clone the repository with `git clone https://github.com/M336G/sharex-uploader.git`, take a look at **[.env.example](https://github.com/M336G/sharex-uploader/blob/main/.env.example)** and create a `.env` file if you need to configure your server.
2. Install [Bun](https://bun.com/) and run `bun install` to install dependencies.
3. Start the project with `bun run start`!

## Endpoints
**config.json**
| Endpoint | Description | Authorization? |
| --- | --- | --- |
| `GET /<filename>` | Get an uploaded file | No |
| `GET /` | Get a list of every uploaded file | Yes |
| `POST /` | Upload a new file to the server | Yes |

*`POST /` requires passing the file directly in its body.*
*To authenticate, supply a Bearer token to your request's Authorization header (example: `Bearer AAAABBBBCCCCDDDD`).*

## SXCU File
Here's a template to make a .sxcu file if you use this project (make sure to replace the `YOUR_UPLOADER'S_NAME`, `YOUR_SERVER_URL` and `YOUR_TOKEN_HERE` fields!):
```
{
    "Version": "17.0.0",
    "Name": "YOUR_UPLOADER'S_NAME",
    "DestinationType": "ImageUploader, TextUploader, FileUploader",
    "RequestMethod": "POST",
    "RequestURL": "YOUR_SERVER_URL",
    "Headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
    },
    "Body": "Binary",
    "URL": "{regex:^(http[s]?://.*)$}"
}
```

## Contributing
Pull requests are more than welcome to the project! Feel free to open one if you feel like something needs modification or if there is any problem with the codebase.

## Credits
This project is licensed under the [Mozilla Public License Version 2.0](https://github.com/M336G/sharex-uploader/blob/main/LICENSE).