export const RegexCheck = {
    // Check if the file has a valid ID (alphanumeric and 5 characters long) and a valid extension (2-4 characters)
    isValidFilename: (name) => {
        return (/^[a-zA-Z0-9]{5}\.[A-Za-z0-9]{2,4}$/.test(name));
    }
}