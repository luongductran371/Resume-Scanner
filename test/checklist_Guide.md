# Manual Testing Guide (Postman & cURL)

## Using Postman
1. Open Postman and create a new POST request to `http://localhost:3000/upload`.
2. Set body type to `form-data`.
3. Add a key named `file` and select `sample_resume.pdf` as the value.
4. Send the request.
5. Check the response for `name`, `email`, or `skills` fields.

## Using cURL
```sh
curl -F "file=@sample_resume.pdf" http://localhost:3000/upload
```
- Review the response for expected fields.
